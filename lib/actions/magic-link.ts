'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, generateMagicLink as generateMagicLinkUtil } from '@/lib/auth'
import { sendMagicLinkEmail } from '@/lib/email'

export async function sendMagicLink(playerId: string) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get player with organization details
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        orgId: currentUser.orgId,
      },
      include: {
        org: true,
      },
    })

    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.email) {
      throw new Error('Player has no email address on file')
    }

    // Generate the magic link
    const magicLinkUrl = await generateMagicLinkUtil(playerId)

    // Send the email
    const emailResult = await sendMagicLinkEmail(
      player.email,
      player.name,
      magicLinkUrl,
      player.org.name
    )

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email')
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'SEND_MAGIC_LINK',
        entityType: 'Player',
        entityId: player.id,
        after: {
          playerEmail: player.email,
          sentAt: new Date().toISOString(),
        },
      },
    })

    revalidatePath(`/dashboard/players/${playerId}`)

    return {
      success: true,
      message: `Magic link sent to ${player.email}`,
    }
  } catch (error) {
    console.error('Send magic link error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send magic link',
    }
  }
}
