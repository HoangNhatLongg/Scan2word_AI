import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@scan2word.ai' },
    update: {},
    create: {
      fullName: 'Quản trị viên',
      email: 'admin@scan2word.ai',
      password: adminPassword,
      role: 'admin',
      isActive: true,
    },
  })

  console.log('Created admin user:', admin.email)

  // Create test user
  const userPassword = await bcrypt.hash('user123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      fullName: 'Người dùng Test',
      email: 'user@example.com',
      password: userPassword,
      role: 'user',
      isActive: true,
    },
  })

  console.log('Created test user:', user.email)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
