import { prisma } from "#/db"


const TOTAL_TODOS = 1000

const topics = [
  'Review optimistic pagination',
  'Buy groceries',
  'Read a book',
  'Workout session',
  'Write documentation',
  'Fix login bug',
  'Prepare presentation',
  'Team meeting',
  'Deploy to production',
  'Refactor data layer',
  'Update dependencies',
  'Design new landing page',
  'Call client',
  'Pay invoices',
  'Clean up inbox',
  'Plan sprint',
  'Test new feature',
  'Backup database',
  'Review pull requests',
  'Organize files',
]

function statusFor(index: number) {
  const mod = index % 10
  if (mod < 6) return 'pending' as const
  if (mod < 9) return 'completed' as const
  return 'archived' as const
}

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.todo.deleteMany()

  const now = Date.now()

  const data = Array.from({ length: TOTAL_TODOS }, (_, index) => {
    const topic = topics[index % topics.length]
    const createdAt = new Date(now - index * 60_000)

    return {
      title: `${topic} #${index + 1}`,
      description:
        index % 5 === 0
          ? null
          : `Generated todo number ${index + 1} for optimistic pagination testing.`,
      status: statusFor(index),
      createdAt,
      updatedAt: createdAt,
    }
  })

  const todos = await prisma.todo.createMany({ data })

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
