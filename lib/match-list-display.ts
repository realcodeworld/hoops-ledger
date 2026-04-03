import type { MatchTeam } from '@prisma/client'
import { formatMatchOutcome } from '@/lib/match-outcome'

export type MatchListPlayerEntry = {
  id: string
  team: MatchTeam
  player: { id: string; name: string }
}

export type MatchForListDisplay = {
  winningTeam: MatchTeam
  teamAScore: number | null
  teamBScore: number | null
  label: string | null
  matchPlayers: MatchListPlayerEntry[]
}

/**
 * @param gameIndex — when set (session context), use "Game N" if label is empty
 */
export function formatMatchCardTitle(match: MatchForListDisplay, gameIndex?: number): string {
  const winnerLabel = formatMatchOutcome(match.winningTeam)
  const hasScore = match.teamAScore != null && match.teamBScore != null
  const scoreBracket = hasScore ? ` [${match.teamAScore}–${match.teamBScore}]` : ''
  const titleLabel = match.label
    ? ` ${match.label}`
    : gameIndex !== undefined
      ? ` Game ${gameIndex + 1}`
      : ''
  const outcomeSuffix = match.winningTeam === 'DRAW' ? '' : ' 🥇'
  return `Match${titleLabel}: ${winnerLabel}${outcomeSuffix}${scoreBracket}`
}
