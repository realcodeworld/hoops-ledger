'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { PaymentMethod } from '@prisma/client'
import { computeNetBalancePence } from '@/lib/player-balance'

const createPaymentSchema = z.object({
  playerId: z.string().min(1, 'Player is required'),
  amountPence: z.number().int().min(1, 'Amount must be positive'),
  method: z.enum(['cash', 'bank_transfer', 'other']),
  occurredOn: z.string().min(1, 'Date is required'),
  sessionId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function createManualPayment(formData: FormData) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const data = createPaymentSchema.parse({
      playerId: formData.get('playerId'),
      amountPence: parseInt(formData.get('amountPence') as string),
      method: formData.get('method') as PaymentMethod,
      occurredOn: formData.get('occurredOn'),
      sessionId: formData.get('sessionId'),
      notes: formData.get('notes'),
    })

    // Verify player belongs to user's org
    const player = await prisma.player.findFirst({
      where: {
        id: data.playerId,
        orgId: currentUser.orgId,
      },
    })

    if (!player) {
      throw new Error('Player not found')
    }

    // Verify session belongs to user's org (if provided)
    if (data.sessionId) {
      const session = await prisma.session.findFirst({
        where: {
          id: data.sessionId,
          orgId: currentUser.orgId,
        },
      })

      if (!session) {
        throw new Error('Session not found')
      }
    }

    const payment = await prisma.payment.create({
      data: {
        orgId: currentUser.orgId,
        playerId: data.playerId,
        amountPence: data.amountPence,
        method: data.method,
        occurredOn: new Date(data.occurredOn),
        sessionId: data.sessionId || null,
        recordedBy: currentUser.id,
        notes: data.notes || null,
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: currentUser.orgId,
        actorUserId: currentUser.id,
        action: 'CREATE_PAYMENT',
        entityType: 'Payment',
        entityId: payment.id,
        after: payment,
      },
    })

    // Automatically allocate payment to unpaid sessions (oldest first)
    const allocationResult = await allocatePaymentToSessions(payment.id)

    revalidatePath('/dashboard/payments')
    revalidatePath(`/dashboard/players/${data.playerId}`)
    if (data.sessionId) {
      revalidatePath(`/dashboard/sessions/${data.sessionId}`)
    }

    return {
      success: true,
      data: {
        payment,
        allocation: allocationResult.data,
      }
    }
  } catch (error) {
    console.error('Create payment error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create payment' 
    }
  }
}

export async function getPayments(limit = 50) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const payments = await prisma.payment.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      include: {
        player: true,
        session: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return { success: true, data: payments }
  } catch (error) {
    console.error('Get payments error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch payments' 
    }
  }
}

export async function getPaymentAllocations() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get payments with their allocations
    const payments = await prisma.payment.findMany({
      where: {
        orgId: currentUser.orgId,
      },
      include: {
        player: true,
        session: true,
        attendance: {
          include: {
            session: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, data: payments }
  } catch (error) {
    console.error('Get payment allocations error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch payment allocations' 
    }
  }
}

/**
 * Allocates a payment to unpaid sessions in chronological order (oldest first)
 * Returns the number of sessions paid and any remaining credit
 */
export async function allocatePaymentToSessions(paymentId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get the payment
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        orgId: currentUser.orgId,
      },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Get all unpaid attendances for this player, ordered by session date (oldest first)
    const unpaidAttendances = await prisma.attendance.findMany({
      where: {
        playerId: payment.playerId,
        status: 'unpaid',
      },
      include: {
        session: true,
      },
      orderBy: {
        session: {
          startsAt: 'asc', // Oldest session first
        },
      },
    })

    let remainingAmount = payment.amountPence
    const allocatedAttendances: string[] = []

    // Use a transaction to ensure all updates happen atomically
    await prisma.$transaction(async (tx) => {
      for (const attendance of unpaidAttendances) {
        // Only allocate if we have enough to cover the full fee
        if (remainingAmount >= attendance.feeAppliedPence) {
          // Mark attendance as paid and link to this payment
          await tx.attendance.update({
            where: { id: attendance.id },
            data: {
              status: 'paid',
              paymentId: payment.id,
            },
          })

          // Create audit log for this allocation
          await tx.auditLog.create({
            data: {
              orgId: currentUser.orgId,
              actorUserId: currentUser.id,
              action: 'MARK_PAID',
              entityType: 'Attendance',
              entityId: attendance.id,
              before: { status: 'unpaid', paymentId: null },
              after: { status: 'paid', paymentId: payment.id },
            },
          })

          remainingAmount -= attendance.feeAppliedPence
          allocatedAttendances.push(attendance.id)
        } else {
          // Not enough remaining to pay this session fully
          break
        }
      }
    })

    return {
      success: true,
      data: {
        paymentId: payment.id,
        paymentAmount: payment.amountPence,
        allocatedCount: allocatedAttendances.length,
        allocatedAttendances,
        remainingCredit: remainingAmount,
      },
    }
  } catch (error) {
    console.error('Allocate payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to allocate payment',
    }
  }
}

export async function getPlayerBalance(playerId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Verify player belongs to user's org
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        orgId: currentUser.orgId,
      },
    })

    if (!player) {
      throw new Error('Player not found')
    }

    const openingBalancePence = player.openingBalancePence ?? 0

    const attendanceResult = await prisma.attendance.aggregate({
      where: {
        playerId,
        status: {
          in: ['unpaid', 'paid'],
        },
      },
      _sum: {
        feeAppliedPence: true,
      },
    })

    const paymentResult = await prisma.payment.aggregate({
      where: {
        playerId,
      },
      _sum: {
        amountPence: true,
      },
    })

    const totalSessionFeesPence = attendanceResult._sum.feeAppliedPence || 0
    const totalPaid = paymentResult._sum.amountPence || 0

    const net = computeNetBalancePence({
      totalSessionFeesPence,
      openingBalancePence,
      totalPaidPence: totalPaid,
    })

    // Legacy `balance`: signed net (positive = owes, negative = credit)
    const balance = net.net

    return {
      success: true,
      data: {
        playerId,
        totalFeesOwed: totalSessionFeesPence,
        openingBalancePence,
        totalPaid,
        balance,
        unpaidBalance: net.amountDue,
        credit: net.credit,
      }
    }
  } catch (error) {
    console.error('Get player balance error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to calculate player balance' 
    }
  }
}

/**
 * Batch fetch player balances for multiple players in a single query
 * Optimizes the N+1 query problem when displaying player lists
 */
export async function getPlayerBalancesBatch(playerIds: string[], orgId: string) {
  try {
    const [allAttendances, payments, openingRows] = await Promise.all([
      prisma.attendance.groupBy({
        by: ['playerId'],
        where: {
          playerId: { in: playerIds },
          status: { in: ['unpaid', 'paid'] },
        },
        _sum: {
          feeAppliedPence: true,
        },
      }),
      prisma.payment.groupBy({
        by: ['playerId'],
        where: {
          playerId: { in: playerIds },
        },
        _sum: {
          amountPence: true,
        },
      }),
      prisma.player.findMany({
        where: {
          id: { in: playerIds },
          orgId,
        },
        select: { id: true, openingBalancePence: true },
      }),
    ])

    const totalFeesMap = new Map(allAttendances.map(a => [a.playerId, a._sum.feeAppliedPence || 0]))
    const paymentsMap = new Map(payments.map(p => [p.playerId, p._sum.amountPence || 0]))
    const openingMap = new Map(openingRows.map((p) => [p.id, p.openingBalancePence ?? 0]))

    const balances = new Map<string, {
      balance: number
      credit: number
      unpaidBalance: number
      totalFeesOwed: number
      openingBalancePence: number
      totalPaid: number
    }>()

    for (const playerId of playerIds) {
      const totalSessionFeesPence = totalFeesMap.get(playerId) || 0
      const totalPaid = paymentsMap.get(playerId) || 0
      const openingBalancePence = openingMap.get(playerId) ?? 0
      const net = computeNetBalancePence({
        totalSessionFeesPence,
        openingBalancePence,
        totalPaidPence: totalPaid,
      })

      balances.set(playerId, {
        balance: net.net,
        credit: net.credit,
        unpaidBalance: net.amountDue,
        totalFeesOwed: totalSessionFeesPence,
        openingBalancePence,
        totalPaid,
      })
    }

    return { success: true, data: balances }
  } catch (error) {
    console.error('Get player balances batch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate player balances',
    }
  }
}

/**
 * Deletes a manual payment and reverts all allocations
 * Marks all linked attendances back to unpaid status
 */
export async function deletePayment(paymentId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get the payment with all linked attendances
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        orgId: currentUser.orgId,
      },
      include: {
        attendance: {
          include: {
            session: true,
          },
        },
        player: true,
      },
    })

    if (!payment) {
      throw new Error('Payment not found')
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Unlink and mark all attendances as unpaid
      for (const attendance of payment.attendance) {
        await tx.attendance.update({
          where: { id: attendance.id },
          data: {
            status: 'unpaid',
            paymentId: null,
          },
        })

        // Create audit log for reverting payment
        await tx.auditLog.create({
          data: {
            orgId: currentUser.orgId,
            actorUserId: currentUser.id,
            action: 'UNDO_PAID',
            entityType: 'Attendance',
            entityId: attendance.id,
            before: { status: 'paid', paymentId: payment.id },
            after: { status: 'unpaid', paymentId: null },
          },
        })
      }

      // Delete the payment
      await tx.payment.delete({
        where: { id: paymentId },
      })

      // Create audit log for payment deletion
      await tx.auditLog.create({
        data: {
          orgId: currentUser.orgId,
          actorUserId: currentUser.id,
          action: 'DELETE_PAYMENT',
          entityType: 'Payment',
          entityId: payment.id,
          before: payment,
        },
      })
    })

    revalidatePath('/dashboard/payments')
    revalidatePath(`/dashboard/players/${payment.playerId}`)

    // Revalidate all affected session pages
    const uniqueSessionIds = [...new Set(payment.attendance.map(a => a.sessionId))]
    uniqueSessionIds.forEach(sessionId => {
      revalidatePath(`/dashboard/sessions/${sessionId}`)
    })

    return {
      success: true,
      data: {
        deletedPaymentId: paymentId,
        revertedAttendances: payment.attendance.length,
      }
    }
  } catch (error) {
    console.error('Delete payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete payment',
    }
  }
}

/**
 * Updates a manual payment and reallocates if amount or player changed
 */
export async function updatePayment(
  paymentId: string,
  data: {
    amountPence?: number
    method?: PaymentMethod
    occurredOn?: string
    notes?: string | null
  }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Get existing payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        orgId: currentUser.orgId,
      },
      include: {
        attendance: true,
      },
    })

    if (!existingPayment) {
      throw new Error('Payment not found')
    }

    const amountChanged = data.amountPence !== undefined && data.amountPence !== existingPayment.amountPence

    // If amount changed, we need to reallocate
    if (amountChanged) {
      await prisma.$transaction(async (tx) => {
        // First, unlink all current allocations
        await tx.attendance.updateMany({
          where: {
            paymentId: paymentId,
          },
          data: {
            status: 'unpaid',
            paymentId: null,
          },
        })

        // Update the payment
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            amountPence: data.amountPence,
            method: data.method,
            occurredOn: data.occurredOn ? new Date(data.occurredOn) : undefined,
            notes: data.notes !== undefined ? data.notes : undefined,
          },
        })

        // Create audit log for update
        await tx.auditLog.create({
          data: {
            orgId: currentUser.orgId,
            actorUserId: currentUser.id,
            action: 'UPDATE_PAYMENT',
            entityType: 'Payment',
            entityId: paymentId,
            before: existingPayment,
            after: { ...existingPayment, ...data },
          },
        })
      })

      // Reallocate with new amount
      await allocatePaymentToSessions(paymentId)
    } else {
      // Just update the payment fields without reallocation
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          method: data.method,
          occurredOn: data.occurredOn ? new Date(data.occurredOn) : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
        },
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          orgId: currentUser.orgId,
          actorUserId: currentUser.id,
          action: 'UPDATE_PAYMENT',
          entityType: 'Payment',
          entityId: paymentId,
          before: existingPayment,
          after: { ...existingPayment, ...data },
        },
      })
    }

    revalidatePath('/dashboard/payments')
    revalidatePath(`/dashboard/players/${existingPayment.playerId}`)

    return { success: true, data: { paymentId } }
  } catch (error) {
    console.error('Update payment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update payment',
    }
  }
}

export async function getOrganizationFinancials() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    // Total outstanding (unpaid fees)
    const outstandingResult = await prisma.attendance.aggregate({
      where: {
        session: {
          orgId: currentUser.orgId,
        },
        status: 'unpaid',
      },
      _sum: {
        feeAppliedPence: true,
      },
    })

    // Total revenue this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const monthlyRevenueResult = await prisma.payment.aggregate({
      where: {
        orgId: currentUser.orgId,
        occurredOn: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amountPence: true,
      },
    })

    // Total revenue all time
    const totalRevenueResult = await prisma.payment.aggregate({
      where: {
        orgId: currentUser.orgId,
      },
      _sum: {
        amountPence: true,
      },
    })

    return { 
      success: true, 
      data: {
        outstandingAmount: outstandingResult._sum.feeAppliedPence || 0,
        monthlyRevenue: monthlyRevenueResult._sum.amountPence || 0,
        totalRevenue: totalRevenueResult._sum.amountPence || 0,
      }
    }
  } catch (error) {
    console.error('Get organization financials error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch financial data' 
    }
  }
}
