'use server'

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const SUPER_ADMIN_SESSION_COOKIE = 'super_admin_session'

export async function getSuperAdminSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SUPER_ADMIN_SESSION_COOKIE)?.value

  if (!sessionId) {
    return null
  }

  const superAdmin = await prisma.superAdmin.findUnique({
    where: { id: sessionId },
  })

  return superAdmin
}

export async function createSuperAdminSession(superAdminId: string) {
  const cookieStore = await cookies()

  // Update last login
  await prisma.superAdmin.update({
    where: { id: superAdminId },
    data: { lastLoginAt: new Date() },
  })

  cookieStore.set(SUPER_ADMIN_SESSION_COOKIE, superAdminId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function destroySuperAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SUPER_ADMIN_SESSION_COOKIE)
}
