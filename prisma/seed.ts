import { PrismaClient } from '../src/generated/prisma/client.js'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.todo.deleteMany()

  const todos = await prisma.todo.createMany({
    data: [
      {
        title: 'Buy groceries',
        description: 'Milk, eggs and bread',
        status: 'pending',
      },
      {
        title: 'Read a book',
        description: 'Finish chapter 10',
        status: 'pending',
      },
      {
        title: 'Workout',
        description: null,
        status: 'completed',
      },
      {
        title: 'Old project',
        description: 'Archived example',
        status: 'archived',
      },
    ],
  })

  console.log(`✅ Created ${todos.count} todos`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
