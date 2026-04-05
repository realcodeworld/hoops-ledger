import { subMonths, startOfMonth, format } from 'date-fns'

export type BalanceChartPoint = {
  label: string
  amountPence: number
}

/**
 * Sum session fees by calendar month for the last 6 months (for player activity chart).
 */
export function buildLast6MonthsSessionFees(
  attendances: { session: { startsAt: Date }; feeAppliedPence: number }[]
): BalanceChartPoint[] {
  const now = new Date()
  const months: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = startOfMonth(subMonths(now, i))
    months.push({
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMM yy'),
    })
  }
  const agg = new Map<string, number>()
  for (const a of attendances) {
    const k = format(new Date(a.session.startsAt), 'yyyy-MM')
    agg.set(k, (agg.get(k) ?? 0) + a.feeAppliedPence)
  }
  return months.map(({ key, label }) => ({
    label,
    amountPence: agg.get(key) ?? 0,
  }))
}
