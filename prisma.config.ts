import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'bun --bun prisma/seed.ts',
  },
  datasource: {
    // Prisma CLI commands (migrate, studio, ...) only accept SQLite `file:` URLs.
    // `bun run db:push` applies the schema to Turso via scripts/push-turso.ts.
    url: process.env.PRISMA_DATABASE_URL ?? 'file:./dev.db',
  },
})
