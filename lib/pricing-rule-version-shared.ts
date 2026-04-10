export type PricingRuleVersionLike = {
  feePence: number
  effectiveFrom: Date | string
}

export function resolveFeePenceFromVersionsAt(
  versions: PricingRuleVersionLike[] | undefined,
  at: Date,
  fallbackFeePence: number
) {
  if (!versions || versions.length === 0) return fallbackFeePence

  const targetTs = at.getTime()
  let bestFee: number | null = null
  let bestTs = Number.NEGATIVE_INFINITY

  for (const version of versions) {
    const ts = new Date(version.effectiveFrom).getTime()
    if (Number.isNaN(ts)) continue
    if (ts <= targetTs && ts > bestTs) {
      bestTs = ts
      bestFee = version.feePence
    }
  }

  return bestFee ?? fallbackFeePence
}
