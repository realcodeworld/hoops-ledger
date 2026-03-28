/**
 * Points system constants and configuration.
 * Can later be moved to org-level settings.
 */
export const POINTS_PER_ATTENDANCE = 1
export const POINTS_PER_PAID_SESSION = 1
export const POINTS_PER_MATCH_PARTICIPATION = 1
export const BASE_WIN_POINTS = 2
export const WEIGHT_SCALE = 100
export const WEIGHT_CAP_MIN = 0.5
export const WEIGHT_CAP_MAX = 1.5

export const POINT_SOURCE_MATCH_WIN = 'match_win'

export function clampWeightFactor(factor: number): number {
  return Math.max(WEIGHT_CAP_MIN, Math.min(WEIGHT_CAP_MAX, factor))
}

/**
 * Compute weighted points for a match win.
 * factor = 1 + (opposingTotal - myTotal) / scale, clamped.
 */
export function computeMatchWinPoints(
  opposingTeamTotalPoints: number,
  winningTeamTotalPoints: number
): number {
  const pointDiff = opposingTeamTotalPoints - winningTeamTotalPoints
  const factor = clampWeightFactor(1 + pointDiff / WEIGHT_SCALE)
  return Math.round(BASE_WIN_POINTS * factor)
}

/** Half of weighted win points per player on that side (for drawn matches). */
export function halfMatchWinPoints(
  opposingTeamTotalPoints: number,
  sideTeamTotalPoints: number
): number {
  return Math.round(computeMatchWinPoints(opposingTeamTotalPoints, sideTeamTotalPoints) / 2)
}
