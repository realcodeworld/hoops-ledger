import type { MatchTeam } from '@prisma/client'

/** One past line-up from a session match (sourceSide is for display only). */
export interface ReuseTeamOption {
  label: string
  sourceSide: 'A' | 'B'
  playerIds: string[]
}

type MatchPlayerRow = { team: MatchTeam; playerId: string }

type MatchForReuse = {
  id: string
  label?: string | null
  matchPlayers: MatchPlayerRow[]
}

export function squadKey(playerIds: string[]): string {
  return [...playerIds].sort().join('|')
}

/** Keep first label when the same set of player ids appears more than once. */
export function dedupeReuseTeamOptions(options: ReuseTeamOption[]): ReuseTeamOption[] {
  const seen = new Set<string>()
  const out: ReuseTeamOption[] = []
  for (const opt of options) {
    const key = squadKey(opt.playerIds)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(opt)
  }
  return out
}

/**
 * Flatten session matches into reuse rows (one per historical A/B line-up), then dedupe identical squads.
 */
export function buildReuseOptionsFromMatches(
  matches: MatchForReuse[],
  opts?: { excludeMatchId?: string }
): ReuseTeamOption[] {
  const filtered = opts?.excludeMatchId
    ? matches.filter((m) => m.id !== opts.excludeMatchId)
    : matches

  const raw: ReuseTeamOption[] = filtered.flatMap((match, index) => {
    const label = match.label?.trim() || `Game ${index + 1}`
    const teamAPlayerIds = (match.matchPlayers ?? [])
      .filter((mp) => mp.team === 'A')
      .map((mp) => mp.playerId)
    const teamBPlayerIds = (match.matchPlayers ?? [])
      .filter((mp) => mp.team === 'B')
      .map((mp) => mp.playerId)
    const row: ReuseTeamOption[] = []
    if (teamAPlayerIds.length > 0) {
      row.push({ label, sourceSide: 'A', playerIds: teamAPlayerIds })
    }
    if (teamBPlayerIds.length > 0) {
      row.push({ label, sourceSide: 'B', playerIds: teamBPlayerIds })
    }
    return row
  })

  return dedupeReuseTeamOptions(raw)
}
