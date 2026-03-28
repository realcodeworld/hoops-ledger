'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getAllPlayerTotals } from '@/lib/actions/leaderboard'
import { computeMatchWinPoints, halfMatchWinPoints, POINT_SOURCE_MATCH_WIN } from '@/lib/points'
import { resolveWinningTeamFromScores } from '@/lib/match-outcome'
import type { MatchTeam } from '@prisma/client'

function buildMatchWinPointRows(
  winningTeam: MatchTeam,
  teamA: string[],
  teamB: string[],
  teamATotal: number,
  teamBTotal: number,
  orgId: string,
  matchId: string
): { playerId: string; orgId: string; source: string; amount: number; matchId: string }[] {
  if (winningTeam === 'DRAW') {
    const ptsA = halfMatchWinPoints(teamBTotal, teamATotal)
    const ptsB = halfMatchWinPoints(teamATotal, teamBTotal)
    return [
      ...teamA.map((playerId) => ({
        playerId,
        orgId,
        source: POINT_SOURCE_MATCH_WIN,
        amount: ptsA,
        matchId,
      })),
      ...teamB.map((playerId) => ({
        playerId,
        orgId,
        source: POINT_SOURCE_MATCH_WIN,
        amount: ptsB,
        matchId,
      })),
    ]
  }
  const winningTotal = winningTeam === 'A' ? teamATotal : teamBTotal
  const opposingTotal = winningTeam === 'A' ? teamBTotal : teamATotal
  const pointsPerWinner = computeMatchWinPoints(opposingTotal, winningTotal)
  const winningPlayerIds = winningTeam === 'A' ? teamA : teamB
  return winningPlayerIds.map((playerId) => ({
    playerId,
    orgId,
    source: POINT_SOURCE_MATCH_WIN,
    amount: pointsPerWinner,
    matchId,
  }))
}

export async function createMatchResult(
  teamAPlayerIds: string[],
  teamBPlayerIds: string[],
  winningTeam: MatchTeam,
  label?: string | null,
  sessionId?: string | null,
  teamAScore?: number | null,
  teamBScore?: number | null
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' }
    }

    if (sessionId) {
      const session = await prisma.session.findFirst({
        where: { id: sessionId, orgId: currentUser.orgId },
      })
      if (!session) {
        return { success: false, error: 'Session not found' }
      }
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

    const fromScores = resolveWinningTeamFromScores(teamAScore, teamBScore)
    let winningTeamResolved: MatchTeam
    if (fromScores !== null) {
      winningTeamResolved = fromScores
    } else {
      if (winningTeam === 'DRAW') {
        return {
          success: false,
          error: 'Draw is only allowed when both team scores are entered',
        }
      }
      winningTeamResolved = winningTeam
    }

    const match = await prisma.match.create({
      data: {
        sessionId: sessionId || null,
        orgId: currentUser.orgId,
        winningTeam: winningTeamResolved,
        teamATotalPoints: teamATotal,
        teamBTotalPoints: teamBTotal,
        teamAScore: teamAScore != null ? teamAScore : null,
        teamBScore: teamBScore != null ? teamBScore : null,
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
      data: buildMatchWinPointRows(
        winningTeamResolved,
        teamA,
        teamB,
        teamATotal,
        teamBTotal,
        currentUser.orgId,
        match.id
      ),
    })

    if (sessionId) revalidatePath(`/dashboard/sessions/${sessionId}`)
    revalidatePath('/dashboard/matches')
    revalidatePath('/dashboard/leaderboard')
    return { success: true, data: { id: match.id } }
  } catch (error) {
    console.error('Create match result error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record match',
    }
  }
}

export async function getMatches() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Unauthorized', data: null }
    }

    const matches = await prisma.match.findMany({
      where: { orgId: currentUser.orgId },
      include: {
        session: { select: { id: true, name: true, startsAt: true } },
        matchPlayers: {
          include: {
            player: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: matches }
  } catch (error) {
    console.error('Get matches error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch matches',
      data: null,
    }
  }
}

export async function getMatchDetail(matchId: string) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Unauthorized', data: null }
    }

    const match = await prisma.match.findFirst({
      where: { id: matchId, orgId: currentUser.orgId },
      include: {
        session: { select: { id: true, name: true, startsAt: true } },
        matchPlayers: {
          include: {
            player: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!match) {
      return { success: false, error: 'Match not found', data: null }
    }

    return { success: true, data: match }
  } catch (error) {
    console.error('Get match detail error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch match',
      data: null,
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
        session: { select: { id: true, name: true, startsAt: true } },
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

export async function updateMatch(
  matchId: string,
  data: {
    label?: string | null
    sessionId?: string | null
    teamAScore?: number | null
    teamBScore?: number | null
    teamAPlayerIds?: string[]
    teamBPlayerIds?: string[]
    winningTeam?: MatchTeam
  }
): Promise<{ success: boolean; error?: string }> {
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

    if (data.sessionId !== undefined) {
      if (data.sessionId) {
        const session = await prisma.session.findFirst({
          where: { id: data.sessionId, orgId: currentUser.orgId },
        })
        if (!session) {
          return { success: false, error: 'Session not found' }
        }
      }
    }

    const updatingTeams =
      data.teamAPlayerIds !== undefined && data.teamBPlayerIds !== undefined
    if (updatingTeams) {
      const teamA = [...new Set(data.teamAPlayerIds)].filter(Boolean)
      const teamB = [...new Set(data.teamBPlayerIds)].filter(Boolean)
      if (teamA.length === 0 || teamB.length === 0) {
        return { success: false, error: 'Both teams must have at least one player' }
      }
      const inBoth = teamA.filter((id) => teamB.includes(id))
      if (inBoth.length > 0) {
        return { success: false, error: 'A player cannot be on both teams' }
      }

      const totals = await getAllPlayerTotals(currentUser.orgId)
      const allPlayerIds = [...teamA, ...teamB]
      const teamATotal = allPlayerIds
        .filter((id) => teamA.includes(id))
        .reduce((sum, id) => sum + (totals.get(id) ?? 0), 0)
      const teamBTotal = allPlayerIds
        .filter((id) => teamB.includes(id))
        .reduce((sum, id) => sum + (totals.get(id) ?? 0), 0)

      const nextScoreA =
        data.teamAScore !== undefined ? data.teamAScore : match.teamAScore
      const nextScoreB =
        data.teamBScore !== undefined ? data.teamBScore : match.teamBScore
      const fromScores = resolveWinningTeamFromScores(nextScoreA, nextScoreB)
      let winningTeamResolved: MatchTeam
      if (fromScores !== null) {
        winningTeamResolved = fromScores
      } else {
        const wt = data.winningTeam ?? match.winningTeam
        if (wt === 'DRAW') {
          return {
            success: false,
            error: 'Draw is only allowed when both team scores are entered',
          }
        }
        winningTeamResolved = wt
      }

      await prisma.playerPointEntry.deleteMany({
        where: { matchId },
      })
      await prisma.matchPlayer.deleteMany({
        where: { matchId },
      })
      await prisma.matchPlayer.createMany({
        data: [
          ...teamA.map((playerId) => ({ matchId, playerId, team: 'A' as MatchTeam })),
          ...teamB.map((playerId) => ({ matchId, playerId, team: 'B' as MatchTeam })),
        ],
      })
      await prisma.playerPointEntry.createMany({
        data: buildMatchWinPointRows(
          winningTeamResolved,
          teamA,
          teamB,
          teamATotal,
          teamBTotal,
          currentUser.orgId,
          matchId
        ),
      })
      await prisma.match.update({
        where: { id: matchId },
        data: {
          teamATotalPoints: teamATotal,
          teamBTotalPoints: teamBTotal,
          winningTeam: winningTeamResolved,
          ...(data.label !== undefined && { label: data.label?.trim() || null }),
          ...(data.sessionId !== undefined && { sessionId: data.sessionId || null }),
          ...(data.teamAScore !== undefined && { teamAScore: data.teamAScore ?? null }),
          ...(data.teamBScore !== undefined && { teamBScore: data.teamBScore ?? null }),
        },
      })
    } else {
      await prisma.match.update({
        where: { id: matchId },
        data: {
          ...(data.label !== undefined && { label: data.label?.trim() || null }),
          ...(data.sessionId !== undefined && { sessionId: data.sessionId || null }),
          ...(data.teamAScore !== undefined && { teamAScore: data.teamAScore ?? null }),
          ...(data.teamBScore !== undefined && { teamBScore: data.teamBScore ?? null }),
        },
      })
    }

    if (match.sessionId) revalidatePath(`/dashboard/sessions/${match.sessionId}`)
    if (data.sessionId) revalidatePath(`/dashboard/sessions/${data.sessionId}`)
    revalidatePath('/dashboard/matches')
    revalidatePath(`/dashboard/matches/${matchId}`)
    revalidatePath('/dashboard/leaderboard')
    return { success: true }
  } catch (error) {
    console.error('Update match error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update match',
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

    if (match.sessionId) revalidatePath(`/dashboard/sessions/${match.sessionId}`)
    revalidatePath('/dashboard/matches')
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
