'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, getCurrentPlayer } from '@/lib/auth'

const reportRangeSchema = z.object({
  days: z.number().int().min(1).max(3650).optional().default(30),
})

export async function getPlayerReport(playerId: string, days = 30) {
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

    const rangeStart = new Date()
    rangeStart.setDate(rangeStart.getDate() - days)

    // Sessions attended in range
    const attendanceInRange = await prisma.attendance.count({
      where: {
        playerId,
        session: {
          startsAt: {
            gte: rangeStart,
          },
        },
      },
    })

    // Lifetime sessions attended
    const lifetimeAttendance = await prisma.attendance.count({
      where: {
        playerId,
      },
    })

    // Financial summary
    const financialSummary = await prisma.attendance.aggregate({
      where: { playerId },
      _sum: {
        feeAppliedPence: true,
      },
    })

    const paymentSummary = await prisma.payment.aggregate({
      where: { playerId },
      _sum: {
        amountPence: true,
      },
    })

    // Last attendance
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        playerId,
      },
      include: {
        session: true,
      },
      orderBy: {
        session: {
          startsAt: 'desc',
        },
      },
    })

    // Calculate streak (consecutive recent sessions attended)
    const recentSessions = await prisma.session.findMany({
      where: {
        orgId: currentUser.orgId,
        startsAt: { lte: new Date() },
      },
      include: {
        attendance: {
          where: { playerId },
        },
      },
      orderBy: { startsAt: 'desc' },
      take: 20, // Check last 20 sessions
    })

    let currentStreak = 0
    for (const session of recentSessions) {
      if (session.attendance.length > 0) {
        currentStreak++
      } else {
        break
      }
    }

    // Average fee
    const averageFee = lifetimeAttendance > 0 
      ? (financialSummary._sum.feeAppliedPence || 0) / lifetimeAttendance 
      : 0

    return {
      success: true,
      data: {
        player,
        period: { days, rangeStart },
        attendanceInRange,
        lifetimeAttendance,
        lifetimePaid: paymentSummary._sum.amountPence || 0,
        lifetimeOwed: financialSummary._sum.feeAppliedPence || 0,
        averageFee: Math.round(averageFee),
        currentStreak,
        lastAttendance: lastAttendance ? {
          date: lastAttendance.session.startsAt,
          session: lastAttendance.session,
        } : null,
      },
    }
  } catch (error) {
    console.error('Get player report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate player report' 
    }
  }
}

export async function getOrganizationReport(days = 30) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Unauthorized')
    }

    const rangeStart = new Date()
    rangeStart.setDate(rangeStart.getDate() - days)

    // Revenue collected in period
    const revenueInPeriod = await prisma.payment.aggregate({
      where: {
        orgId: currentUser.orgId,
        occurredOn: {
          gte: rangeStart,
        },
      },
      _sum: {
        amountPence: true,
      },
    })

    // Total outstanding
    const totalOutstanding = await prisma.attendance.aggregate({
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

    // Sessions in period
    const sessionsInPeriod = await prisma.session.count({
      where: {
        orgId: currentUser.orgId,
        startsAt: {
          gte: rangeStart,
        },
      },
    })

    // Attendance trends
    const attendanceInPeriod = await prisma.attendance.count({
      where: {
        session: {
          orgId: currentUser.orgId,
          startsAt: {
            gte: rangeStart,
          },
        },
      },
    })

    // Average session fill rate
    const sessionsFillData = await prisma.session.findMany({
      where: {
        orgId: currentUser.orgId,
        startsAt: {
          gte: rangeStart,
        },
        capacity: { not: null },
      },
      include: {
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    })

    const averageFillRate = sessionsFillData.length > 0
      ? sessionsFillData.reduce((acc, session) => {
          const fillRate = session.capacity 
            ? (session._count.attendance / session.capacity) * 100 
            : 0
          return acc + fillRate
        }, 0) / sessionsFillData.length
      : 0

    // Player category mix
    const categoryMix = await prisma.player.groupBy({
      where: {
        orgId: currentUser.orgId,
        isActive: true,
      },
      by: ['pricingRuleId'],
      _count: true,
    })

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i, 1)
      monthStart.setHours(0, 0, 0, 0)
      
      const monthEnd = new Date()
      monthEnd.setMonth(monthEnd.getMonth() - i + 1, 0)
      monthEnd.setHours(23, 59, 59, 999)

      const monthlySum = await prisma.payment.aggregate({
        where: {
          orgId: currentUser.orgId,
          occurredOn: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amountPence: true,
        },
      })

      monthlyRevenue.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        revenue: monthlySum._sum.amountPence || 0,
      })
    }

    return {
      success: true,
      data: {
        period: { days, rangeStart },
        revenueInPeriod: revenueInPeriod._sum.amountPence || 0,
        totalOutstanding: totalOutstanding._sum.feeAppliedPence || 0,
        sessionsInPeriod,
        attendanceInPeriod,
        averageFillRate: Math.round(averageFillRate * 10) / 10, // Round to 1 decimal
        categoryMix: categoryMix.map(item => ({
          pricingRuleId: item.pricingRuleId,
          count: item._count,
        })),
        monthlyRevenue,
      },
    }
  } catch (error) {
    console.error('Get organization report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate organization report' 
    }
  }
}

// Player-specific report for their own dashboard
export async function getMyPlayerReport(days = 30) {
  try {
    const currentPlayer = await getCurrentPlayer()
    if (!currentPlayer) {
      throw new Error('Unauthorized')
    }

    const rangeStart = new Date()
    rangeStart.setDate(rangeStart.getDate() - days)

    // Sessions attended in range
    const attendanceInRange = await prisma.attendance.count({
      where: {
        playerId: currentPlayer.id,
        session: {
          startsAt: {
            gte: rangeStart,
          },
        },
      },
    })

    // Lifetime sessions attended
    const lifetimeAttendance = await prisma.attendance.count({
      where: {
        playerId: currentPlayer.id,
      },
    })

    // Financial summary
    const financialSummary = await prisma.attendance.aggregate({
      where: { playerId: currentPlayer.id },
      _sum: {
        feeAppliedPence: true,
      },
    })

    const paymentSummary = await prisma.payment.aggregate({
      where: { playerId: currentPlayer.id },
      _sum: {
        amountPence: true,
      },
    })

    // Session history (last 20 sessions)
    const sessionHistory = await prisma.attendance.findMany({
      where: {
        playerId: currentPlayer.id,
      },
      include: {
        session: true,
        payment: true,
      },
      orderBy: {
        session: {
          startsAt: 'desc',
        },
      },
      take: 20,
    })

    // Outstanding balance
    const balance = (financialSummary._sum.feeAppliedPence || 0) - (paymentSummary._sum.amountPence || 0)

    return {
      success: true,
      data: {
        player: currentPlayer,
        period: { days, rangeStart },
        attendanceInRange,
        lifetimeAttendance,
        lifetimePaid: paymentSummary._sum.amountPence || 0,
        lifetimeOwed: financialSummary._sum.feeAppliedPence || 0,
        currentBalance: balance,
        sessionHistory,
      },
    }
  } catch (error) {
    console.error('Get my player report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate your report' 
    }
  }
}