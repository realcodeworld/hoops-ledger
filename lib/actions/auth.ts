'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  createUserSession,
  createPlayerSession,
  clearSession,
  generateMagicLink as generateMagicLinkUtil,
  consumeMagicLink as consumeMagicLinkUtil,
  verifyPassword,
  hashPassword,
  getCurrentUser
} from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  organizationName: z.string().min(1, 'Organization name is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function loginUser(formData: FormData) {
  try {
    const data = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.'
      }
    }

    const isValidPassword = await verifyPassword(data.password, user.passwordHash)
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.'
      }
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    await createUserSession(user)

    return { success: true, message: 'Login successful' }
  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Please provide a valid email and password.'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed. Please try again.'
    }
  }
}

export async function registerUser(formData: FormData) {
  try {
    const data = registerSchema.parse({
      organizationName: formData.get('organizationName'),
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    })

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists. Please use a different email or try logging in.'
      }
    }

    // Create organization first
    const organization = await prisma.organization.create({
      data: {
        name: data.organizationName,
        slug: data.organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      },
    })

    // Hash password and create user
    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        orgId: organization.id,
        name: data.name,
        email: data.email,
        role: 'admin',
        passwordHash,
      },
    })

    // Create default pricing rule for the organization
    await prisma.pricingRule.create({
      data: {
        orgId: organization.id,
        name: 'Standard',
        feePence: 500, // £5.00
      },
    })

    // Create user session
    await createUserSession(user)

    return { success: true, message: 'Account created successfully' }
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      return {
        success: false,
        error: firstError.message || 'Please check your information and try again.'
      }
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        success: false,
        error: 'An account with this email already exists. Please use a different email.'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed. Please try again.'
    }
  }
}

export async function logout() {
  await clearSession()
  redirect('/')
}

export async function generateMagicLink(playerId: string) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        orgId: currentUser.orgId, // Ensure same org
      },
    })

    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.email) {
      throw new Error('Player has no email address')
    }

    const url = await generateMagicLinkUtil(playerId)
    
    return { 
      success: true, 
      url,
      message: 'Magic link generated successfully' 
    }
  } catch (error) {
    console.error('Magic link generation error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate magic link' 
    }
  }
}

export async function consumeMagicLink(token: string) {
  try {
    const player = await consumeMagicLinkUtil(token)
    
    if (!player) {
      return {
        success: false,
        error: 'This magic link is invalid or has expired. Please request a new one.'
      }
    }

    await createPlayerSession(player)

    return { success: true, message: 'Login successful' }
  } catch (error) {
    console.error('Magic link consumption error:', error)
    return {
      success: false,
      error: 'This magic link is invalid or has expired. Please request a new one.'
    }
  }
}