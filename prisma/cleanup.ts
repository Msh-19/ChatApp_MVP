import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emails = [
    'alice.johnson@example.com',
    'bob.smith@example.com',
    'charlie.brown@example.com',
    'diana.prince@example.com',
    'evan.williams@example.com',
  ]

  console.log('Deleting seed users...')
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        in: emails,
      },
    },
  })

  console.log(`✅ Deleted ${result.count} seed users.`)
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
