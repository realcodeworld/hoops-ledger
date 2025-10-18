import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding super admin...')

  // Check if super admin already exists
  const existingSuperAdmin = await prisma.superAdmin.findUnique({
    where: { email: 'superadmin@hoops.com' },
  })

  if (existingSuperAdmin) {
    console.log('✅ Super admin already exists')
    return
  }

  // Create super admin
  const passwordHash = await hashPassword('SuperAdmin123!')

  const superAdmin = await prisma.superAdmin.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@hoops.com',
      passwordHash,
    },
  })

  console.log('✅ Super admin created:')
  console.log('   Email:', superAdmin.email)
  console.log('   Password: SuperAdmin123!')
  console.log('   Login at: /super-admin/login')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding super admin:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
