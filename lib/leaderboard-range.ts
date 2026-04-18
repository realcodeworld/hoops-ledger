export const LEADERBOARD_RANGES = ['week', 'month', 'year'] as const

export type LeaderboardRange = (typeof LEADERBOARD_RANGES)[number]

export const DEFAULT_LEADERBOARD_RANGE: LeaderboardRange = 'month'

const DAY_IN_MS = 24 * 60 * 60 * 1000

export function parseLeaderboardRange(
  value: string | null | undefined
): LeaderboardRange {
  if (value === 'week' || value === 'year') return value
  return DEFAULT_LEADERBOARD_RANGE
}

export function getRollingWindowUtc(
  range: LeaderboardRange,
  end: Date = new Date()
): { start: Date; end: Date } {
  const days = range === 'week' ? 7 : range === 'year' ? 365 : 30
  return {
    start: new Date(end.getTime() - days * DAY_IN_MS),
    end,
  }
}

export function getLeaderboardRangeLabel(range: LeaderboardRange): string {
  if (range === 'week') return 'Last 7 days'
  if (range === 'year') return 'Last 365 days'
  return 'Last 30 days'
}
