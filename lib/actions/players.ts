'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isValidE164, normalizeToE164 } from '@/lib/utils'

const createPlayerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || val.trim() === '' || isValidE164(val), {
      message: 'Phone must be E.164 (e.g. +447700900123)',
    }),
  pricingRuleId: z.string().min(1, 'Pricing category is required'),
  isExempt: z.boolean().default(false),
  notes: z.string().optional().or(z.literal('')),
})

const updatePlayerSchema = createPlayerSchema.extend({
  id: z.string().min(1),
  isActive: z.boolean().default(true),
  hideFromLeaderboard: z.boolean().default(false),
}).omit({ pricingRuleId: true }).extend({
  pricingRuleId: z.string().min(1, 'Pricing category is required'),
})

export async function createPlayer(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const data = createPlayerSchema.parse({
      name: formData.get('name'),
      email: formData.get('email') || undefined,
      phone: formData.get('phone') || undefined,
      pricingRuleId: formData.get('pricingRuleId'),
      isExempt: formData.get('isExempt') === 'true',
      notes: formData.get('notes') || undefined,
    })

    const phoneToStore = data.phone?.trim()
      ? normalizeToE164(data.phone.trim()) ?? null
      : null

    const player = await prisma.player.create({
      data: {
        ...data,
        email: data.email || null,
        phone: phoneToStore,
        notes: data.notes || null,
        orgId: currentUser.orgId,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'CREATE_PLAYER',
        entityType: 'Player',
        entityId: player.id,
        after: player,
      },
    })

    revalidatePath('/dashboard/players')
    return { success: true, data: player }
  } catch (error) {
    console.error('Create player error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create player' 
    }
  }
}

export async function updatePlayer(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const data = updatePlayerSchema.parse({
      id: formData.get('id'),
      name: formData.get('name'),
      email: formData.get('email') || undefined,
      phone: formData.get('phone') || undefined,
      pricingRuleId: formData.get('pricingRuleId'),
      isExempt: formData.get('isExempt') === 'true',
      isActive: formData.get('isActive') === 'true',
      hideFromLeaderboard: formData.get('hideFromLeaderboard') === 'true',
      notes: formData.get('notes') || undefined,
    })

    // Get existing player for audit log
    const existingPlayer = await prisma.player.findFirst({
      where: {
        id: data.id,
        orgId: currentUser.orgId,
      },
    })

    if (!existingPlayer) {
      throw new Error('Player not found')
    }

    const phoneToStore = data.phone?.trim()
      ? normalizeToE164(data.phone.trim()) ?? null
      : null

    const updatedPlayer = await prisma.player.update({
      where: { id: data.id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: phoneToStore,
        pricingRuleId: data.pricingRuleId,
        isExempt: data.isExempt,
        isActive: data.isActive,
        hideFromLeaderboard: data.hideFromLeaderboard,
        notes: data.notes || null,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'UPDATE_PLAYER',
        entityType: 'Player',
        entityId: updatedPlayer.id,
        before: existingPlayer,
        after: updatedPlayer,
      },
    })

    revalidatePath('/dashboard/players')
    revalidatePath('/dashboard/leaderboard')
    return { success: true, data: updatedPlayer }
  } catch (error) {
    console.error('Update player error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update player' 
    }
  }
}

export async function togglePlayerExempt(playerId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const existingPlayer = await prisma.player.findFirst({
      where: {
        id: playerId,
        orgId: currentUser.orgId,
      },
    })

    if (!existingPlayer) {
      throw new Error('Player not found')
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        isExempt: !existingPlayer.isExempt,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'TOGGLE_PLAYER_EXEMPT',
        entityType: 'Player',
        entityId: updatedPlayer.id,
        before: existingPlayer,
        after: updatedPlayer,
      },
    })

    revalidatePath('/dashboard/players')
    return { success: true, data: updatedPlayer }
  } catch (error) {
    console.error('Toggle player exempt error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update player' 
    }
  }
}

export async function getPlayers() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const players = await prisma.player.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      include: {
        pricingRule: true,
        _count: {
          select: {
            attendance: true,
            payments: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    })

    return { success: true, data: players }
  } catch (error) {
    console.error('Get players error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch players' 
    }
  }
}

export async function getPlayerDetail(playerId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        orgId: currentUser.orgId,
      },
      include: {
        attendance: {
          include: {
            session: true,
            payment: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        payments: {
          include: {
            session: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!player) {
      throw new Error('Player not found')
    }

    return { success: true, data: player }
  } catch (error) {
    console.error('Get player detail error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch player details' 
    }
  }
}

export async function deletePlayer(playerId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const existingPlayer = await prisma.player.findFirst({
      where: {
        id: playerId,
        orgId: currentUser.orgId,
      },
      include: {
        _count: {
          select: {
            attendance: true,
            payments: true,
            matchPlayers: true,
          },
        },
      },
    })

    if (!existingPlayer) {
      throw new Error('Player not found')
    }

    // Delete related records first (cascade)
    await prisma.$transaction(async (tx) => {
      // Delete match player records
      await tx.matchPlayer.deleteMany({
        where: { playerId },
      })

      // Delete attendance records
      await tx.attendance.deleteMany({
        where: { playerId },
      })

      // Delete payment records
      await tx.payment.deleteMany({
        where: { playerId },
      })

      // Delete the player
      await tx.player.delete({
        where: { id: playerId },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          orgId: currentUser.orgId,
          actorUserId: currentUser.id,
          action: 'DELETE_PLAYER',
          entityType: 'Player',
          entityId: playerId,
          before: existingPlayer,
        },
      })
    })

    revalidatePath('/dashboard/players')
    revalidatePath('/dashboard/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Delete player error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete player',
    }
  }
}

export async function createQuickPlayer(name: string, pricingRuleId?: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Player name is required')
    }

    // If no pricing rule provided, get the first available pricing rule (typically Standard)
    let finalPricingRuleId = pricingRuleId

    if (!finalPricingRuleId) {
      const defaultPricingRule = await prisma.pricingRule.findFirst({
        where: { orgId: currentUser.orgId },
        orderBy: { createdAt: 'asc' },
      })

      if (!defaultPricingRule) {
        throw new Error('No pricing rules found for organization')
      }

      finalPricingRuleId = defaultPricingRule.id
    }

    const player = await prisma.player.create({
      data: {
        orgId: currentUser.orgId,
        name: name.trim(),
        pricingRuleId: finalPricingRuleId,
        isExempt: false,
        isActive: true,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'CREATE_QUICK_PLAYER',
        entityType: 'Player',
        entityId: player.id,
        after: player,
      },
    })

    revalidatePath('/dashboard/players')
    return { success: true, data: player }
  } catch (error) {
    console.error('Create quick player error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create player' 
    }
  }
}