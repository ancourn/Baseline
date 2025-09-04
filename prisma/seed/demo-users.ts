import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('👥 Seeding demo users...')

  // Create demo users
  const demoUsers = [
    {
      email: 'admin@demo.com',
      name: 'Admin User',
      role: 'ADMIN',
      password: 'demo123'
    },
    {
      email: 'user@demo.com',
      name: 'Demo User',
      role: 'USER',
      password: 'demo123'
    },
    {
      email: 'developer@demo.com',
      name: 'Developer User',
      role: 'USER',
      password: 'demo123'
    }
  ]

  for (const userData of demoUsers) {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role as any,
        password: hashedPassword,
        emailVerified: new Date(),
        isActive: true
      }
    })
  }

  console.log('✅ Demo users seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })