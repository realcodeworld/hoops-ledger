import { PrismaClient } from '@prisma/client'
import { bootstrapSuperAdmin } from './bootstrap-superadmin'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Bootstrapping super admin…')

  const result = await bootstrapSuperAdmin(prisma)

  if (result.skipped) {
    console.log(`ℹ️  ${result.reason}`)
    return
  }

  console.log(`✅ Super admin ready: ${result.email}`)
  if (result.source === 'env') {
    console.log('   Credentials were taken from SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD.')
  } else {
    console.log('   Using development defaults (not for production).')
    console.log(`   Email: ${result.email}`)
    console.log('   Password: SuperAdmin123!')
  }
  console.log('   Login: /super-admin/login')
}

main()
  .catch((e) => {
    console.error('❌ Super admin bootstrap failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
