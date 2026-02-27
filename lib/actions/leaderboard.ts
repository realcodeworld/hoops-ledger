'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  POINTS_PER_ATTENDANCE,
  POINTS_PER_PAID_SESSION,
  POINTS_PER_MATCH_PARTICIPATION,
  POINT_SOURCE_MATCH_WIN,
} from '@/lib/points'

export interface LeaderboardEntry {
  playerId: string
  name: string
  totalPoints: number
  rank: number
}

/**
 * Compute total points for a single player.
 * totalPoints = (attendanceCount * P1) + (paidCount * P2) + (matchParticipations * P3) + sum(PlayerPointEntry match_win)
 */
export async function getPlayerTotalPoints(playerId: string): Promise<number> {
  const [attendanceCount, paidCount, matchParticipationCount, pointEntrySum] = await Promise.all([
    prisma.attendance.count({
      where: { playerId },
    }),
    prisma.attendance.count({
      where: {
        playerId,
        status: 'paid',
      },
    }),
    prisma.matchPlayer.count({
      where: { playerId },
    }),
    prisma.playerPointEntry.aggregate({
      where: {
        playerId,
        source: POINT_SOURCE_MATCH_WIN,
      },
      _sum: { amount: true },
    }),
  ])

  const entryPoints = pointEntrySum._sum.amount ?? 0
  return (
    attendanceCount * POINTS_PER_ATTENDANCE +
    paidCount * POINTS_PER_PAID_SESSION +
    matchParticipationCount * POINTS_PER_MATCH_PARTICIPATION +
    entryPoints
  )
}

/**
 * Get total points for all players in an org (including hidden).
 * Used for match weighting. Returns map of playerId -> totalPoints.
 */
export async function getAllPlayerTotals(
  orgId: string
): Promise<Map<string, number>> {
  const players = await prisma.player.findMany({
    where: { orgId, isActive: true },
    select: { id: true },
  })
  const playerIds = players.map((p) => p.id)

  const [attendanceCounts, paidCounts, matchParticipationCounts, pointSums] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['playerId'],
      where: { playerId: { in: playerIds } },
      _count: { id: true },
    }),
    prisma.attendance.groupBy({
      by: ['playerId'],
      where: {
        playerId: { in: playerIds },
        status: 'paid',
      },
      _count: { id: true },
    }),
    prisma.matchPlayer.groupBy({
      by: ['playerId'],
      where: { playerId: { in: playerIds } },
      _count: { id: true },
    }),
    prisma.playerPointEntry.groupBy({
      by: ['playerId'],
      where: {
        playerId: { in: playerIds },
        source: POINT_SOURCE_MATCH_WIN,
      },
      _sum: { amount: true },
    }),
  ])

  const attendanceByPlayer = new Map(
    attendanceCounts.map((r) => [r.playerId, r._count.id])
  )
  const paidByPlayer = new Map(
    paidCounts.map((r) => [r.playerId, r._count.id])
  )
  const matchParticipationByPlayer = new Map(
    matchParticipationCounts.map((r) => [r.playerId, r._count.id])
  )
  const entrySumByPlayer = new Map(
    pointSums.map((r) => [r.playerId, r._sum.amount ?? 0])
  )

  const result = new Map<string, number>()
  for (const id of playerIds) {
    const att = attendanceByPlayer.get(id) ?? 0
    const paid = paidByPlayer.get(id) ?? 0
    const matchParts = matchParticipationByPlayer.get(id) ?? 0
    const entries = entrySumByPlayer.get(id) ?? 0
    result.set(
      id,
      att * POINTS_PER_ATTENDANCE +
        paid * POINTS_PER_PAID_SESSION +
        matchParts * POINTS_PER_MATCH_PARTICIPATION +
        entries
    )
  }
  return result
}

/**
 * Get leaderboard for org: ranked list of players (excluding hideFromLeaderboard),
 * with totalPoints and 1-based rank.
 */
export async function getLeaderboard(): Promise<{
  success: boolean
  data?: LeaderboardEntry[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    const player = user ? null : await import('@/lib/auth').then((m) => m.getCurrentPlayer())
    const orgId = user?.orgId ?? player?.orgId
    if (!orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const players = await prisma.player.findMany({
      where: {
        orgId,
        isActive: true,
        hideFromLeaderboard: false,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })

    const totals = await getAllPlayerTotals(orgId)
    const entries: LeaderboardEntry[] = players.map((p) => ({
      playerId: p.id,
      name: p.name,
      totalPoints: totals.get(p.id) ?? 0,
      rank: 0,
    }))

    entries.sort((a, b) => b.totalPoints - a.totalPoints)
    entries.forEach((e, i) => {
      e.rank = i + 1
    })

    return { success: true, data: entries }
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
    }
  }
}

export interface WinStreakEntry {
  playerId: string
  name: string
  longestWinStreak: number
  rank: number
}

export interface AttendanceStreakEntry {
  playerId: string
  name: string
  longestAttendanceStreak: number
  rank: number
}

/**
 * Longest consecutive match wins per player (matches ordered by createdAt).
 * Only includes players with at least one match; excludes hideFromLeaderboard.
 */
export async function getWinStreaks(): Promise<{
  success: boolean
  data?: WinStreakEntry[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    const player = user ? null : await import('@/lib/auth').then((m) => m.getCurrentPlayer())
    const orgId = user?.orgId ?? player?.orgId
    if (!orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const players = await prisma.player.findMany({
      where: {
        orgId,
        isActive: true,
        hideFromLeaderboard: false,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    const playerIds = new Set(players.map((p) => p.id))

    const matchPlayers = await prisma.matchPlayer.findMany({
      where: {
        match: { orgId },
        playerId: { in: [...playerIds] },
      },
      include: {
        match: { select: { winningTeam: true, createdAt: true } },
      },
      orderBy: { match: { createdAt: 'asc' } },
    })

    const byPlayer = new Map<string, { won: boolean }[]>()
    for (const mp of matchPlayers) {
      if (!byPlayer.has(mp.playerId)) byPlayer.set(mp.playerId, [])
      byPlayer.get(mp.playerId)!.push({
        won: mp.match.winningTeam === mp.team,
      })
    }

    const entries: WinStreakEntry[] = players
      .map((p) => {
        const results = byPlayer.get(p.id) ?? []
        let maxStreak = 0
        let current = 0
        for (const { won } of results) {
          if (won) {
            current++
            if (current > maxStreak) maxStreak = current
          } else {
            current = 0
          }
        }
        return { playerId: p.id, name: p.name, longestWinStreak: maxStreak, rank: 0 }
      })
      .filter((e) => e.longestWinStreak > 0)
    entries.sort((a, b) => b.longestWinStreak - a.longestWinStreak)
    entries.forEach((e, i) => {
      e.rank = i + 1
    })
    return { success: true, data: entries }
  } catch (error) {
    console.error('Get win streaks error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch win streaks',
    }
  }
}

/**
 * Longest consecutive sessions attended per player (sessions ordered by startsAt).
 * Only includes players with at least one attendance; excludes hideFromLeaderboard.
 */
export async function getAttendanceStreaks(): Promise<{
  success: boolean
  data?: AttendanceStreakEntry[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    const player = user ? null : await import('@/lib/auth').then((m) => m.getCurrentPlayer())
    const orgId = user?.orgId ?? player?.orgId
    if (!orgId) {
      return { success: false, error: 'Unauthorized' }
    }

    const players = await prisma.player.findMany({
      where: {
        orgId,
        isActive: true,
        hideFromLeaderboard: false,
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    const playerIds = new Set(players.map((p) => p.id))

    const [sessions, attendances] = await Promise.all([
      prisma.session.findMany({
        where: { 
          orgId,
          status: {
            not: 'cancelled',
          },
        },
        select: { id: true },
        orderBy: { startsAt: 'asc' },
      }),
      prisma.attendance.findMany({
        where: {
          session: { orgId },
          playerId: { in: [...playerIds] },
        },
        select: { playerId: true, sessionId: true },
      }),
    ])
    const orderedSessionIds = sessions.map((s) => s.id)
    const attendedByPlayer = new Map<string, Set<string>>()
    for (const a of attendances) {
      if (!attendedByPlayer.has(a.playerId)) attendedByPlayer.set(a.playerId, new Set())
      attendedByPlayer.get(a.playerId)!.add(a.sessionId)
    }

    const entries: AttendanceStreakEntry[] = players
      .map((p) => {
        const attended = attendedByPlayer.get(p.id) ?? new Set()
        let maxStreak = 0
        let current = 0
        for (const sid of orderedSessionIds) {
          if (attended.has(sid)) {
            current++
            if (current > maxStreak) maxStreak = current
          } else {
            current = 0
          }
        }
        return { playerId: p.id, name: p.name, longestAttendanceStreak: maxStreak, rank: 0 }
      })
      .filter((e) => e.longestAttendanceStreak > 0)
    entries.sort((a, b) => b.longestAttendanceStreak - a.longestAttendanceStreak)
    entries.forEach((e, i) => {
      e.rank = i + 1
    })
    return { success: true, data: entries }
  } catch (error) {
    console.error('Get attendance streaks error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch attendance streaks',
    }
  }
}
