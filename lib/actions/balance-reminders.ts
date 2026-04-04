'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { computeNetBalancePence } from '@/lib/player-balance'
import { sendBalanceReminderToAdmin } from '@/lib/email'
import { buildMonzoPaymentUrl } from '@/lib/monzo-pay-url'

export type UnpaidSessionSummary = {
  sessionId: string
  sessionName: string | null
  startsAt: Date
  feeAppliedPence: number
}

/** Org fields used for WhatsApp-style payment instructions at the end of balance reminders. */
export type BalanceReminderOrgPayment = {
  monzoPayUrl: string | null
  bankAccountName: string | null
  bankSortCode: string | null
  bankAccountNumber: string | null
}

function buildPaymentFooterLines(
  paymentRef: string,
  org: BalanceReminderOrgPayment,
  payOnlineUrl: string | null
): string[] {
  const hasBank =
    !!org.bankAccountName?.trim() &&
    !!org.bankSortCode?.trim() &&
    !!org.bankAccountNumber?.trim()
  const link = payOnlineUrl?.trim()
  const hasLink = !!link

  if (!hasBank && !hasLink) {
    return []
  }

  const lines: string[] = [
    '',
    '──────────',
    '*💳 How to pay*',
    '',
  ]

  if (hasLink && link) {
    lines.push('*🔗 Pay online*', link, '')
  }

  if (hasBank) {
    lines.push(
      '*🏦 Bank transfer*',
      `Account name: ${org.bankAccountName}`,
      `Sort code: ${org.bankSortCode}`,
      `Account number: ${org.bankAccountNumber}`,
      '',
      '*🔑 Payment reference* (use this exact text on your transfer):',
      paymentRef
    )
  }

  return lines
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

    const [unpaidAttendances, sessionFeesAgg, totalPaidAgg] = await Promise.all([
      prisma.attendance.findMany({
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
      }),
      prisma.attendance.aggregate({
        where: {
          playerId,
          status: { in: ['unpaid', 'paid'] },
        },
        _sum: { feeAppliedPence: true },
      }),
      prisma.payment.aggregate({
        where: { playerId },
        _sum: { amountPence: true },
      }),
    ])

    const totalSessionFeesPence = sessionFeesAgg._sum.feeAppliedPence || 0
    const totalPaidPence = totalPaidAgg._sum.amountPence || 0
    const openingBalancePence = player.openingBalancePence ?? 0
    const { amountDue: unpaidBalancePence } = computeNetBalancePence({
      totalSessionFeesPence,
      openingBalancePence,
      totalPaidPence,
    })

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
        openingBalancePence,
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
  unpaidSessions: UnpaidSessionSummary[],
  openingBalancePence: number,
  paymentRef: string,
  orgPayment: BalanceReminderOrgPayment,
  payOnlineUrl: string | null
): string {
  const lines: string[] = [
    `🏀 Hi ${playerName},`,
    '',
    `Your unpaid balance is ${formatCurrency(unpaidBalancePence)}.`,
    '',
  ]

  if (openingBalancePence > 0) {
    lines.push(
      `This includes ${formatCurrency(openingBalancePence)} carried forward from last year.`,
      ''
    )
  }

  if (unpaidSessions.length > 0) {
    lines.push('*📋 Unpaid sessions*')
    for (const s of unpaidSessions) {
      lines.push(
        `• ${s.sessionName || 'Session'} (${formatDate(s.startsAt)}) — ${formatCurrency(s.feeAppliedPence)}`
      )
    }
    lines.push('')
  }

  lines.push('Please arrange payment when you can.')
  const footerLines = buildPaymentFooterLines(paymentRef, orgPayment, payOnlineUrl)
  if (footerLines.length > 0) {
    lines.push(...footerLines)
  }
  lines.push('', 'Thanks!')

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

    const { unpaidBalancePence, unpaidSessions, openingBalancePence } = summaryResult.data

    if (unpaidBalancePence === 0) {
      return {
        success: true,
        message: 'No unpaid balance',
      }
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.orgId },
      select: {
        monzoPayUrl: true,
        bankAccountName: true,
        bankSortCode: true,
        bankAccountNumber: true,
      },
    })

    const orgPayment: BalanceReminderOrgPayment = org ?? {
      monzoPayUrl: null,
      bankAccountName: null,
      bankSortCode: null,
      bankAccountNumber: null,
    }

    const payOnlineUrl = buildMonzoPaymentUrl(
      orgPayment.monzoPayUrl,
      unpaidBalancePence,
      player.paymentRef
    )

    const message = buildReminderMessage(
      player.name,
      unpaidBalancePence,
      unpaidSessions,
      openingBalancePence ?? 0,
      player.paymentRef,
      orgPayment,
      payOnlineUrl
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

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.orgId },
      select: {
        monzoPayUrl: true,
        bankAccountName: true,
        bankSortCode: true,
        bankAccountNumber: true,
      },
    })

    const orgPayment: BalanceReminderOrgPayment = org ?? {
      monzoPayUrl: null,
      bankAccountName: null,
      bankSortCode: null,
      bankAccountNumber: null,
    }

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

      const { unpaidBalancePence, unpaidSessions, openingBalancePence } = summaryResult.data

      if (unpaidBalancePence === 0) {
        results.push({ playerId, included: false, error: 'No unpaid balance' })
        continue
      }

      const payOnlineUrl = buildMonzoPaymentUrl(
        orgPayment.monzoPayUrl,
        unpaidBalancePence,
        player.paymentRef
      )

      const message = buildReminderMessage(
        player.name,
        unpaidBalancePence,
        unpaidSessions,
        openingBalancePence ?? 0,
        player.paymentRef,
        orgPayment,
        payOnlineUrl
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
