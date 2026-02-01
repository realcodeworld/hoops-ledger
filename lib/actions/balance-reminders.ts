'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { sendBalanceReminderToAdmin } from '@/lib/email'

export type UnpaidSessionSummary = {
  sessionId: string
  sessionName: string | null
  startsAt: Date
  feeAppliedPence: number
}

export async function getPlayerUnpaidSummary(playerId: string) {
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
    })

    if (!player) {
      throw new Error('Player not found')
    }

    const unpaidAttendances = await prisma.attendance.findMany({
      where: {
        playerId,
        status: 'unpaid',
      },
      include: {
        session: true,
      },
      orderBy: {
        session: { startsAt: 'asc' },
      },
    })

    const unpaidBalancePence = unpaidAttendances.reduce(
      (sum, a) => sum + a.feeAppliedPence,
      0
    )

    const unpaidSessions: UnpaidSessionSummary[] = unpaidAttendances.map(
      (a) => ({
        sessionId: a.sessionId,
        sessionName: a.session.name,
        startsAt: a.session.startsAt,
        feeAppliedPence: a.feeAppliedPence,
      })
    )

    return {
      success: true,
      data: {
        unpaidBalancePence,
        unpaidSessions,
      },
    }
  } catch (error) {
    console.error('Get player unpaid summary error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get unpaid summary',
    }
  }
}

function buildReminderMessage(
  playerName: string,
  unpaidBalancePence: number,
  unpaidSessions: UnpaidSessionSummary[]
): string {
  const lines: string[] = [
    `Hi ${playerName},`,
    '',
    `Your unpaid balance is ${formatCurrency(unpaidBalancePence)}.`,
    '',
  ]

  if (unpaidSessions.length > 0) {
    lines.push('Unpaid sessions:')
    for (const s of unpaidSessions) {
      lines.push(
        `- ${s.sessionName || 'Session'} (${formatDate(s.startsAt)}) – ${formatCurrency(s.feeAppliedPence)}`
      )
    }
  }

  return lines.join('\n')
}

export async function emailBalanceReminderToAdmin(playerId: string) {
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
    })

    if (!player) {
      throw new Error('Player not found')
    }

    if (!player.phone) {
      return {
        success: false,
        error: 'Player has no phone number on file',
      }
    }

    const summaryResult = await getPlayerUnpaidSummary(playerId)
    if (!summaryResult.success || !summaryResult.data) {
      return {
        success: false,
        error: summaryResult.error || 'Failed to get unpaid summary',
      }
    }

    const { unpaidBalancePence, unpaidSessions } = summaryResult.data

    if (unpaidBalancePence === 0) {
      return {
        success: true,
        message: 'No unpaid balance',
      }
    }

    const message = buildReminderMessage(
      player.name,
      unpaidBalancePence,
      unpaidSessions
    )

    const payload = {
      phone_number: player.phone,
      name: player.name,
      message,
    }

    const emailResult = await sendBalanceReminderToAdmin(
      currentUser.email,
      payload
    )

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || 'Failed to send email',
      }
    }

    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'BALANCE_REMINDER_EMAILED_TO_ADMIN',
        entityType: 'Player',
        entityId: playerId,
        after: {
          playerId,
          adminEmail: currentUser.email,
          unpaidBalancePence,
          sessionCount: unpaidSessions.length,
        },
      },
    })

    revalidatePath(`/dashboard/players/${playerId}`)

    return {
      success: true,
      message: 'Balance reminder emailed to you',
    }
  } catch (error) {
    console.error('Email balance reminder error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to email reminder',
    }
  }
}

export async function emailBulkBalanceRemindersToAdmin(playerIds: string[]) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const results: { playerId: string; included: boolean; error?: string }[] =
      []
    const payloads: { phone_number: string; name: string; message: string }[] =
      []
    const includedPlayerIds: string[] = []

    for (const playerId of playerIds) {
      const player = await prisma.player.findFirst({
        where: {
          id: playerId,
          orgId: currentUser.orgId,
        },
      })

      if (!player) {
        results.push({ playerId, included: false, error: 'Player not found' })
        continue
      }

      if (!player.phone) {
        results.push({
          playerId,
          included: false,
          error: 'No phone number',
        })
        continue
      }

      const summaryResult = await getPlayerUnpaidSummary(playerId)
      if (!summaryResult.success || !summaryResult.data) {
        results.push({
          playerId,
          included: false,
          error: summaryResult.error || 'Failed to get summary',
        })
        continue
      }

      const { unpaidBalancePence, unpaidSessions } = summaryResult.data

      if (unpaidBalancePence === 0) {
        results.push({ playerId, included: false, error: 'No unpaid balance' })
        continue
      }

      const message = buildReminderMessage(
        player.name,
        unpaidBalancePence,
        unpaidSessions
      )

      payloads.push({
        phone_number: player.phone,
        name: player.name,
        message,
      })
      includedPlayerIds.push(playerId)
      results.push({ playerId, included: true })
    }

    if (payloads.length === 0) {
      return {
        success: true,
        results,
        message: 'No reminders to email (no players with phone and unpaid balance)',
      }
    }

    const emailResult = await sendBalanceReminderToAdmin(
      currentUser.email,
      payloads
    )

    if (!emailResult.success) {
      return {
        success: false,
        results,
        error: emailResult.error || 'Failed to send email',
      }
    }

    for (const playerId of includedPlayerIds) {
      await prisma.auditLog.create({
        data: {
          orgId: currentUser.orgId,
          actorUserId: currentUser.id,
          action: 'BALANCE_REMINDER_EMAILED_TO_ADMIN',
          entityType: 'Player',
          entityId: playerId,
          after: {
            playerId,
            adminEmail: currentUser.email,
            bulk: true,
          },
        },
      })
    }

    revalidatePath('/dashboard/players')

    return {
      success: true,
      results,
      message: `Emailed ${payloads.length} reminder(s) to you`,
    }
  } catch (error) {
    console.error('Bulk email balance reminders error:', error)
    return {
      success: false,
      results: [],
      error:
        error instanceof Error ? error.message : 'Failed to email reminders',
    }
  }
}
