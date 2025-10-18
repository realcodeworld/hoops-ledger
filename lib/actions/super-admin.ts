'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/password'
import { getSuperAdminSession, createSuperAdminSession, destroySuperAdminSession } from '@/lib/super-admin-auth'

// Login
export async function loginSuperAdmin(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email },
    })

    if (!superAdmin) {
      return { success: false, error: 'Invalid credentials' }
    }

    const isValidPassword = await verifyPassword(password, superAdmin.passwordHash)

    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' }
    }

    await createSuperAdminSession(superAdmin.id)

    return { success: true }
  } catch (error) {
    console.error('Super admin login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

// Logout
export async function logoutSuperAdmin() {
  await destroySuperAdminSession()
  redirect('/super-admin/login')
}

// Get all users across all organizations
export async function getAllUsers() {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    const users = await prisma.user.findMany({
      include: {
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { org: { name: 'asc' } },
        { email: 'asc' },
      ],
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('Get all users error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    }
  }
}

// Update user password
const updatePasswordSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function updateUserPassword(formData: FormData) {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    const data = updatePasswordSchema.parse({
      userId: formData.get('userId'),
      password: formData.get('password'),
    })

    const passwordHash = await hashPassword(data.password)

    await prisma.user.update({
      where: { id: data.userId },
      data: { passwordHash },
    })

    revalidatePath('/super-admin/users')
    return { success: true }
  } catch (error) {
    console.error('Update password error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update password',
    }
  }
}

// Update user details
const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'supervisor']),
})

export async function updateUserDetails(formData: FormData) {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    const data = updateUserSchema.parse({
      userId: formData.get('userId'),
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
    })

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser && existingUser.id !== data.userId) {
      throw new Error('Email is already taken by another user')
    }

    await prisma.user.update({
      where: { id: data.userId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
      },
    })

    revalidatePath('/super-admin/users')
    return { success: true }
  } catch (error) {
    console.error('Update user details error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    }
  }
}

// Create new user
const createUserSchema = z.object({
  orgId: z.string().min(1, 'Organization is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'supervisor']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function createNewUser(formData: FormData) {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    const data = createUserSchema.parse({
      orgId: formData.get('orgId'),
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

    await prisma.user.create({
      data: {
        orgId: data.orgId,
        name: data.name,
        email: data.email,
        role: data.role,
        passwordHash,
      },
    })

    revalidatePath('/super-admin/users')
    return { success: true }
  } catch (error) {
    console.error('Create user error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    }
  }
}

// Get all organizations
export async function getAllOrganizations() {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    const organizations = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
    })

    return { success: true, data: organizations }
  } catch (error) {
    console.error('Get organizations error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organizations',
    }
  }
}

// Delete user
export async function deleteUserAccount(userId: string) {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath('/super-admin/users')
    return { success: true }
  } catch (error) {
    console.error('Delete user error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    }
  }
}

// Get organization details with users and players
export async function getOrganizationDetails(orgId: string) {
  try {
    const superAdmin = await getSuperAdminSession()
    if (!superAdmin) {
      throw new Error('Unauthorized')
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: {
          orderBy: { email: 'asc' },
        },
        players: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!organization) {
      throw new Error('Organization not found')
    }

    return { success: true, data: organization }
  } catch (error) {
    console.error('Get organization details error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch organization details',
    }
  }
}
