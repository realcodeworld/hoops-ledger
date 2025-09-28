'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const createSessionSchema = z.object({
  name: z.string().nullable().transform(val => val || ''),
  venue: z.string().nullable().transform(val => val || ''),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().nullable().transform(val => val || ''),
  capacity: z.string().nullable().transform(val => val || ''),
  allowGuests: z.boolean().default(true),
  notes: z.string().nullable().transform(val => val || ''),
  pricingRuleId: z.string().nullable().transform(val => val || ''),
})

const updateSessionSchema = createSessionSchema.extend({
  id: z.string().min(1),
})

export async function createSession(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error('Unauthorized')
  }

  try {
    const data = createSessionSchema.parse({
      name: formData.get('name'),
      venue: formData.get('venue'),
      date: formData.get('date'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      capacity: formData.get('capacity'),
      allowGuests: formData.get('allowGuests') === 'true',
      notes: formData.get('notes'),
      pricingRuleId: formData.get('pricingRuleId'),
    })

    console.log('Creating session with data:', data)

    // Combine date and time
    const startsAt = new Date(`${data.date}T${data.startTime}`)
    const endsAt = data.endTime ? new Date(`${data.date}T${data.endTime}`) : null

    console.log('Parsed dates:', { startsAt, endsAt })

    const session = await prisma.session.create({
      data: {
        orgId: currentUser.orgId,
        name: data.name || null,
        venue: data.venue || null,
        startsAt,
        endsAt,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        allowGuests: data.allowGuests,
        notes: data.notes || null,
        pricingRuleId: data.pricingRuleId || null,
      },
    })

    console.log('Session created:', session.id)

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'CREATE_SESSION',
        entityType: 'Session',
        entityId: session.id,
        after: session,
      },
    })

    revalidatePath('/dashboard/sessions')
  } catch (error) {
    console.error('Create session error:', error)
    throw error
  }

  // Redirect outside the try-catch
  redirect('/dashboard/sessions')
}

export async function updateSession(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const data = updateSessionSchema.parse({
      id: formData.get('id'),
      name: formData.get('name'),
      venue: formData.get('venue'),
      startsAt: formData.get('startsAt'),
      endsAt: formData.get('endsAt'),
      capacity: formData.get('capacity'),
      allowGuests: formData.get('allowGuests') === 'true',
      notes: formData.get('notes'),
      pricingRuleId: formData.get('pricingRuleId'),
    })

    // Get existing session for audit log
    const existingSession = await prisma.session.findFirst({
      where: {
        id: data.id,
        orgId: currentUser.orgId,
      },
    })

    if (!existingSession) {
      throw new Error('Session not found')
    }

    const updatedSession = await prisma.session.update({
      where: { id: data.id },
      data: {
        name: data.name || null,
        venue: data.venue || null,
        startsAt: new Date(`${data.date}T${data.startTime}`),
        endsAt: data.endTime ? new Date(`${data.date}T${data.endTime}`) : null,
        capacity: data.capacity ? parseInt(data.capacity) : null,
        allowGuests: data.allowGuests,
        notes: data.notes || null,
        pricingRuleId: data.pricingRuleId || null,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'UPDATE_SESSION',
        entityType: 'Session',
        entityId: updatedSession.id,
        before: existingSession,
        after: updatedSession,
      },
    })

    revalidatePath('/dashboard/sessions')
    return { success: true, data: updatedSession }
  } catch (error) {
    console.error('Update session error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update session' 
    }
  }
}

export async function getSessions() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const sessions = await prisma.session.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      include: {
        pricingRule: true,
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: {
        startsAt: 'desc',
      },
    })

    return { success: true, data: sessions }
  } catch (error) {
    console.error('Get sessions error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch sessions' 
    }
  }
}

export async function getSessionDetail(sessionId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        orgId: currentUser.orgId,
      },
      include: {
        pricingRule: true,
        attendance: {
          include: {
            player: true,
            payment: true,
          },
          orderBy: {
            player: {
              name: 'asc',
            },
          },
        },
      },
    })

    if (!session) {
      throw new Error('Session not found')
    }

    return { success: true, data: session }
  } catch (error) {
    console.error('Get session detail error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch session details' 
    }
  }
}

export async function getTodaySessions() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    const sessions = await prisma.session.findMany({
      where: {
        orgId: currentUser.orgId,
        startsAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        pricingRule: true,
        _count: {
          select: {
            attendance: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    })

    return { success: true, data: sessions }
  } catch (error) {
    console.error('Get today sessions error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch today\'s sessions' 
    }
  }
}