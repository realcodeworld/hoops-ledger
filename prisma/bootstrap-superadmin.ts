import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export type BootstrapSuperAdminResult =
  | { skipped: true; reason: string }
  | { skipped: false; email: string; source: 'env' | 'development_default' }

const DEV_DEFAULT_EMAIL = 'superadmin@hoopsledger.com'
const DEV_DEFAULT_PASSWORD = 'SuperAdmin123!'
const MIN_PASSWORD_LENGTH = 8

/**
 * Upserts the bootstrap super admin.
 *
 * **Environment (recommended for production):**
 * - `SUPERADMIN_EMAIL` — required with password when using env bootstrap
 * - `SUPERADMIN_PASSWORD` — plain text; hashed before storage (min 8 characters)
 * - `SUPERADMIN_NAME` — optional display name (default: `Super Admin`)
 *
 * When both `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` are set, they are used and
 * the account is created or updated (password rotated on each seed run).
 *
 * When they are not set and `NODE_ENV === 'production'`, seeding is skipped (no default password).
 *
 * When they are not set in non-production, development defaults are used so local `db:seed` keeps working.
 */
export async function bootstrapSuperAdmin(
  prisma: PrismaClient
): Promise<BootstrapSuperAdminResult> {
  const envEmail = process.env.SUPERADMIN_EMAIL?.trim()
  const envPassword = process.env.SUPERADMIN_PASSWORD
  const envName = process.env.SUPERADMIN_NAME?.trim() || 'Super Admin'

  let email: string
  let password: string
  let name: string
  let source: 'env' | 'development_default'

  if (envEmail && envPassword !== undefined && envPassword !== '') {
    email = envEmail
    password = envPassword
    name = envName
    source = 'env'
  } else if (process.env.NODE_ENV === 'production') {
    return {
      skipped: true,
      reason:
        'Skipped super admin bootstrap: set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD in the environment.',
    }
  } else {
    email = DEV_DEFAULT_EMAIL
    password = DEV_DEFAULT_PASSWORD
    name = 'Super Admin'
    source = 'development_default'
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `SUPERADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.superAdmin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { name, email, passwordHash },
  })

  return { skipped: false, email, source }
}
