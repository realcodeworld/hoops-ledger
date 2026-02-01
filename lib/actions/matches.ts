'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getAllPlayerTotals } from '@/lib/actions/leaderboard'
import { computeMatchWinPoints } from '@/lib/points'
import { POINT_SOURCE_MATCH_WIN } from '@/lib/points'
import type { MatchTeam } from '@prisma/client'

export async function createMatchResult(
  sessionId: string,
  teamAPlayerIds: string[],
  teamBPlayerIds: string[],
  winningTeam: MatchTeam,
  label?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' }
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, orgId: currentUser.orgId },
    })
    if (!session) {
      return { success: false, error: 'Session not found' }
    }

    const teamA = [...new Set(teamAPlayerIds)].filter(Boolean)
    const teamB = [...new Set(teamBPlayerIds)].filter(Boolean)

    if (teamA.length === 0 || teamB.length === 0) {
      return { success: false, error: 'Both teams must have at least one player' }
    }

    const inBoth = teamA.filter((id) => teamB.includes(id))
    if (inBoth.length > 0) {
      return { success: false, error: 'A player cannot be on both teams' }
    }

    const allPlayerIds = [...teamA, ...teamB]
    const totals = await getAllPlayerTotals(currentUser.orgId)

    const teamATotal = allPlayerIds
      .filter((id) => teamA.includes(id))
      .reduce((sum, id) => sum + (totals.get(id) ?? 0), 0)
    const teamBTotal = allPlayerIds
      .filter((id) => teamB.includes(id))
      .reduce((sum, id) => sum + (totals.get(id) ?? 0), 0)

    const winningTotal = winningTeam === 'A' ? teamATotal : teamBTotal
    const opposingTotal = winningTeam === 'A' ? teamBTotal : teamATotal
    const pointsPerWinner = computeMatchWinPoints(opposingTotal, winningTotal)
    const winningPlayerIds = winningTeam === 'A' ? teamA : teamB

    const match = await prisma.match.create({
      data: {
        sessionId,
        orgId: currentUser.orgId,
        winningTeam,
        teamATotalPoints: teamATotal,
        teamBTotalPoints: teamBTotal,
        label: label?.trim() || null,
      },
    })

    await prisma.matchPlayer.createMany({
      data: [
        ...teamA.map((playerId) => ({ matchId: match.id, playerId, team: 'A' as MatchTeam })),
        ...teamB.map((playerId) => ({ matchId: match.id, playerId, team: 'B' as MatchTeam })),
      ],
    })

    await prisma.playerPointEntry.createMany({
      data: winningPlayerIds.map((playerId) => ({
        playerId,
        orgId: currentUser.orgId,
        source: POINT_SOURCE_MATCH_WIN,
        amount: pointsPerWinner,
        matchId: match.id,
      })),
    })

    revalidatePath(`/dashboard/sessions/${sessionId}`)
    revalidatePath('/dashboard/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Create match result error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record match',
    }
  }
}

export async function getSessionMatches(sessionId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Unauthorized', data: null }
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, orgId: currentUser.orgId },
    })
    if (!session) {
      return { success: false, error: 'Session not found', data: null }
    }

    const matches = await prisma.match.findMany({
      where: { sessionId },
      include: {
        matchPlayers: {
          include: {
            player: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return { success: true, data: matches }
  } catch (error) {
    console.error('Get session matches error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch matches',
      data: null,
    }
  }
}

export async function deleteMatch(matchId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' }
    }

    const match = await prisma.match.findFirst({
      where: { id: matchId, orgId: currentUser.orgId },
    })
    if (!match) {
      return { success: false, error: 'Match not found' }
    }

    await prisma.playerPointEntry.deleteMany({
      where: { matchId },
    })
    await prisma.match.delete({
      where: { id: matchId },
    })

    revalidatePath(`/dashboard/sessions/${match.sessionId}`)
    revalidatePath('/dashboard/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Delete match error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete match',
    }
  }
}
