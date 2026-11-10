import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from '@libsql/client'

const databaseUrl = process.env.DATABASE_URL
const authToken = process.env.DATABASE_AUTH_TOKEN
const dryRun = process.argv.includes('--dry-run')

if (!databaseUrl || !/^(libsql|https?):\/\//.test(databaseUrl)) {
  throw new Error(
    'DATABASE_URL must be a Turso/libSQL URL (libsql://...) in your .env file.',
  )
}

const client = createClient({ url: databaseUrl, authToken })
const tempDir = mkdtempSync(join(tmpdir(), 'prisma-turso-'))
const remoteCopyPath = join(tempDir, 'remote.db')

try {
  // 1. Read the current schema from Turso.
  const remoteSchema = await client.execute(
    `SELECT type, name, sql
       FROM sqlite_master
      WHERE sql IS NOT NULL
        AND name NOT LIKE 'sqlite_%'
        AND tbl_name <> '_prisma_migrations'
      ORDER BY CASE type
                 WHEN 'table' THEN 0
                 WHEN 'index' THEN 1
                 WHEN 'trigger' THEN 2
                 ELSE 3
               END,
               name`,
  )

  // 2. Rebuild it in a temporary local SQLite file so Prisma can diff against it.
  const local = createClient({ url: `file:${remoteCopyPath}` })
  try {
    if (remoteSchema.rows.length > 0) {
      const ddl = remoteSchema.rows.map((row) => String(row.sql)).join(';\n')
      await local.executeMultiple(`${ddl};`)
    }
  } finally {
    local.close()
  }

  // 3. Let Prisma generate the SQL needed to match prisma/schema.prisma.
  const result = spawnSync(
    process.execPath,
    [
      'x',
      '--bun',
      'prisma',
      'migrate',
      'diff',
      '--from-config-datasource',
      '--to-schema',
      'prisma/schema.prisma',
      '--script',
      '--exit-code',
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, PRISMA_DATABASE_URL: `file:${remoteCopyPath}` },
      encoding: 'utf8',
    },
  )

  if (result.status !== 0 && result.status !== 2) {
    throw new Error(result.stderr || result.stdout || 'prisma migrate diff failed')
  }

  const hasChanges = result.status === 2
  const sql = result.stdout.trim()

  if (!hasChanges) {
    console.log('Turso is already in sync with prisma/schema.prisma.')
  } else if (dryRun) {
    console.log(sql)
  } else {
    // 4. Apply the diff atomically.
    await client.executeMultiple(
      `PRAGMA foreign_keys=OFF;\nBEGIN;\n${sql}\nCOMMIT;\nPRAGMA foreign_keys=ON;`,
    )
    console.log('Schema pushed to Turso successfully.')
  }
} finally {
  client.close()
  try {
    // Windows may keep the temporary SQLite file locked for a moment.
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
  } catch {
    // The OS will eventually clean its own temp directory.
  }
}
