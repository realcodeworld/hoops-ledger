'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { PaymentMethod } from '@prisma/client'

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

    revalidatePath('/dashboard/payments')
    revalidatePath(`/dashboard/players/${data.playerId}`)
    if (data.sessionId) {
      revalidatePath(`/dashboard/sessions/${data.sessionId}`)
    }

    return { success: true, data: payment }
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

    // Calculate unpaid balance
    // Unpaid balance = sum of only unpaid fees
    const unpaidResult = await prisma.attendance.aggregate({
      where: {
        playerId,
        status: 'unpaid',
      },
      _sum: {
        feeAppliedPence: true,
      },
    })

    const unpaidBalance = unpaidResult._sum.feeAppliedPence || 0

    // Also calculate total fees and payments for reference
    const attendanceResult = await prisma.attendance.aggregate({
      where: {
        playerId,
        status: {
          in: ['unpaid', 'paid'], // Include both unpaid and paid fees in balance calculation
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

    const totalFeesOwed = attendanceResult._sum.feeAppliedPence || 0
    const totalPaid = paymentResult._sum.amountPence || 0

    // Calculate credit (overpayment)
    const credit = totalPaid - totalFeesOwed

    // Return unpaid balance if they owe money, otherwise return credit as negative (so it displays as positive credit)
    const balance = unpaidBalance > 0 ? unpaidBalance : (credit > 0 ? -credit : 0)

    return {
      success: true,
      data: {
        playerId,
        totalFeesOwed,
        totalPaid,
        balance,
        unpaidBalance,
        credit: credit > 0 ? credit : 0,
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