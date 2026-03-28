import type { MatchTeam } from '@prisma/client'

/**
 * When both scores are set (finite numbers), outcome follows scores (tie = DRAW).
 * Otherwise returns null — caller must use manual A/B only.
 */
export function resolveWinningTeamFromScores(
  teamAScore: number | null | undefined,
  teamBScore: number | null | undefined
): Extract<MatchTeam, 'A' | 'B' | 'DRAW'> | null {
  if (teamAScore == null || teamBScore == null) return null
  const a = Number(teamAScore)
  const b = Number(teamBScore)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  if (a > b) return 'A'
  if (b > a) return 'B'
  return 'DRAW'
}

export function formatMatchOutcome(winningTeam: MatchTeam): string {
  if (winningTeam === 'DRAW') return 'Draw'
  return winningTeam === 'A' ? 'Team A' : 'Team B'
}
