import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create dummy users
  const users = [
    {
      email: 'alice.johnson@example.com',
      name: 'Alice Johnson',
      googleId: 'google_alice_123456',
      picture: 'https://i.pravatar.cc/150?img=1',
    },
    {
      email: 'bob.smith@example.com',
      name: 'Bob Smith',
      googleId: 'google_bob_234567',
      picture: 'https://i.pravatar.cc/150?img=12',
    },
    {
      email: 'charlie.brown@example.com',
      name: 'Charlie Brown',
      googleId: 'google_charlie_345678',
      picture: 'https://i.pravatar.cc/150?img=33',
    },
    {
      email: 'diana.prince@example.com',
      name: 'Diana Prince',
      googleId: 'google_diana_456789',
      picture: 'https://i.pravatar.cc/150?img=5',
    },
    {
      email: 'evan.williams@example.com',
      name: 'Evan Williams',
      googleId: 'google_evan_567890',
      picture: 'https://i.pravatar.cc/150?img=13',
    },
  ]

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    })
    console.log(`✅ Created user: ${user.name} (${user.email})`)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
