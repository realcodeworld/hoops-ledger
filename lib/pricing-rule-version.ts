import type { Prisma } from '@prisma/client'
import { toDate } from 'date-fns-tz'
import { prisma } from '@/lib/prisma'

type Db = Prisma.TransactionClient | typeof prisma

/**
 * Fee for a category at session start (UTC). Uses the latest version with effectiveFrom <= at.
 */
export async function getFeePenceForRuleAt(
  pricingRuleId: string | null | undefined,
  sessionStartsAt: Date,
  db: Db = prisma
): Promise<number> {
  if (!pricingRuleId) return 0

  const v = await db.pricingRuleVersion.findFirst({
    where: {
      pricingRuleId,
      effectiveFrom: { lte: sessionStartsAt },
    },
    orderBy: { effectiveFrom: 'desc' },
    select: { feePence: true },
  })
  if (v) return v.feePence

  const rule = await db.pricingRule.findUnique({
    where: { id: pricingRuleId },
    select: { feePence: true },
  })
  return rule?.feePence ?? 0
}

/**
 * Batch resolve fees for many rules at one session instant (fewer round-trips).
 */
export async function getFeePenceMapForRulesAt(
  ruleIds: (string | null | undefined)[],
  sessionStartsAt: Date,
  db: Db = prisma
): Promise<Map<string, number>> {
  const unique = [...new Set(ruleIds.filter(Boolean) as string[])]
  const out = new Map<string, number>()
  if (unique.length === 0) return out

  const rows = await db.pricingRuleVersion.findMany({
    where: {
      pricingRuleId: { in: unique },
      effectiveFrom: { lte: sessionStartsAt },
    },
    select: {
      pricingRuleId: true,
      feePence: true,
      effectiveFrom: true,
    },
  })

  let best = new Map<string, { feePence: number; effectiveFrom: Date }>()
  for (const r of rows) {
    const cur = best.get(r.pricingRuleId)
    if (!cur || r.effectiveFrom.getTime() > cur.effectiveFrom.getTime()) {
      best.set(r.pricingRuleId, {
        feePence: r.feePence,
        effectiveFrom: r.effectiveFrom,
      })
    }
  }

  const missing = unique.filter((id) => !best.has(id))
  if (missing.length > 0) {
    const rules = await db.pricingRule.findMany({
      where: { id: { in: missing } },
      select: { id: true, feePence: true },
    })
    for (const ru of rules) {
      best.set(ru.id, {
        feePence: ru.feePence,
        effectiveFrom: new Date(0),
      })
    }
  }

  for (const id of unique) {
    out.set(id, best.get(id)?.feePence ?? 0)
  }
  return out
}

/**
 * Parses "YYYY-MM-DDTHH:mm" as organisation wall time and returns UTC Date.
 */
export function parseOrgLocalDateTimeToUtc(
  isoLocal: string | null | undefined,
  orgTimezone: string,
  fallbackUtc: Date
): Date {
  if (!isoLocal || !isoLocal.trim()) return fallbackUtc
  const normalized = isoLocal.includes('T') ? isoLocal.replace('T', ' ') : isoLocal
  const parsed = toDate(normalized, { timeZone: orgTimezone })
  if (Number.isNaN(parsed.getTime())) return fallbackUtc
  return parsed
}

/**
 * Recompute feeAppliedPence for unpaid rows booked under this category from effectiveFrom onward.
 */
export async function recomputeUnpaidFeesForRuleFrom(
  pricingRuleId: string,
  effectiveFrom: Date,
  orgId: string,
  db: Db = prisma
): Promise<number> {
  const rows = await db.attendance.findMany({
    where: {
      pricingRuleId,
      status: 'unpaid',
      session: {
        orgId,
        startsAt: { gte: effectiveFrom },
      },
    },
    include: {
      session: { select: { startsAt: true } },
      player: { select: { isExempt: true } },
    },
  })

  let updated = 0
  for (const row of rows) {
    const fee = row.player.isExempt
      ? 0
      : await getFeePenceForRuleAt(pricingRuleId, row.session.startsAt, db)
    if (fee !== row.feeAppliedPence) {
      await db.attendance.update({
        where: { id: row.id },
        data: { feeAppliedPence: fee },
      })
      updated++
    }
  }
  return updated
}
