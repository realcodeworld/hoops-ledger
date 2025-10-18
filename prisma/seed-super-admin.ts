import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Seeding Super Admin...')

  const email = 'superadmin@hoopsledger.com'
  const password = 'SuperAdmin123!'

  const passwordHash = await bcrypt.hash(password, 10)

  const superAdmin = await prisma.superAdmin.upsert({
    where: { email },
    update: {
      passwordHash,
      name: 'Super Admin',
    },
    create: {
      name: 'Super Admin',
      email,
      passwordHash,
    },
  })

  console.log('✅ Super Admin seeded successfully!')
  console.log('\n🔐 SUPER ADMIN CREDENTIALS:')
  console.log(`   Email: ${superAdmin.email}`)
  console.log(`   Password: ${password}`)
  console.log(`   Login URL: /super-admin/login`)
  console.log('\n⚠️  IMPORTANT: Change this password immediately after first login!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding super admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
