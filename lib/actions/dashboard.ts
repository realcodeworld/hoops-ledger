'use server'

import { format } from 'date-fns'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export type DashboardAttendancePoint = {
  sessionId: string
  startsAt: string
  label: string
  attendees: number
}

/**
 * Most recent non-cancelled sessions (newest first in DB, returned chronological for charts).
 */
export async function getDashboardAttendanceSeries(maxSessions = 36) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false as const, error: 'Unauthorized' }
    }

    const rows = await prisma.session.findMany({
      where: {
        orgId: currentUser.orgId,
        status: { not: 'cancelled' },
      },
      orderBy: { startsAt: 'desc' },
      take: maxSessions,
      select: {
        id: true,
        startsAt: true,
        _count: { select: { attendance: true } },
      },
    })

    const chronological = [...rows].reverse()
    const data: DashboardAttendancePoint[] = chronological.map((s) => ({
      sessionId: s.id,
      startsAt: s.startsAt.toISOString(),
      label: format(s.startsAt, 'd MMM'),
      attendees: s._count.attendance,
    }))

    return { success: true as const, data }
  } catch (error) {
    console.error('getDashboardAttendanceSeries error:', error)
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to load attendance trend',
    }
  }
}
