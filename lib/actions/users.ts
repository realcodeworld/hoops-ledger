'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'supervisor']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'supervisor']),
  password: z.string().min(8).optional().or(z.literal('')),
})

export async function createUser(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Unauthorized - Admin access required')
  }

  const data = createUserSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  })

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new Error('A user with this email already exists')
  }

  const passwordHash = await hashPassword(data.password)

  const user = await prisma.user.create({
    data: {
      orgId: currentUser.orgId,
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId: currentUser.orgId,
      actorUserId: currentUser.id,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      after: { ...user, passwordHash: '[REDACTED]' },
    },
  })

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}

export async function updateUser(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Unauthorized - Admin access required')
  }

  const data = updateUserSchema.parse({
    id: formData.get('id'),
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password') || '',
  })

  // Get existing user for audit log
  const existingUser = await prisma.user.findFirst({
    where: {
      id: data.id,
      orgId: currentUser.orgId,
    },
  })

  if (!existingUser) {
    throw new Error('User not found')
  }

  // Check if email is being changed and if it conflicts
  if (data.email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (emailTaken) {
      throw new Error('A user with this email already exists')
    }
  }

  // Prepare update data
  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
  }

  // Only update password if provided
  if (data.password && data.password.length > 0) {
    updateData.passwordHash = await hashPassword(data.password)
  }

  const updatedUser = await prisma.user.update({
    where: { id: data.id },
    data: updateData,
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      orgId: currentUser.orgId,
      actorUserId: currentUser.id,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: updatedUser.id,
      before: { ...existingUser, passwordHash: '[REDACTED]' },
      after: { ...updatedUser, passwordHash: '[REDACTED]' },
    },
  })

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      throw new Error('You cannot delete your own account')
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        orgId: currentUser.orgId,
      },
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: userId,
        before: { ...existingUser, passwordHash: '[REDACTED]' },
      },
    })

    revalidatePath('/dashboard/users')
    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }
  }
}

export async function getUsers() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    const users = await prisma.user.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      orderBy: [
        { role: 'asc' }, // admins first
        { name: 'asc' },
      ],
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('Get users error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }
  }
}
