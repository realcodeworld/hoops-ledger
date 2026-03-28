'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { generatePlayerPaymentRef } from '@/lib/generate-player-payment-ref'

const MAX_ATTEMPTS_PER_PLAYER = 32

export type BackfillPaymentRefsResult =
  | {
      success: true
      updated: number
      total: number
    }
  | {
      success: false
      error: string
      updated?: number
      total?: number
      failures?: { id: string; name: string; error: string }[]
    }

/**
 * Regenerates every player’s bank payment reference in this organisation using their
 * current name and a new short suffix (same rules as new player signup).
 * Admin only. Overwrites existing references.
 */
export async function backfillPlayerPaymentRefs(): Promise<BackfillPaymentRefsResult> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return { success: false, error: 'Only administrators can run this.' }
  }

  const players = await prisma.player.findMany({
    where: { orgId: user.orgId },
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })

  let updated = 0
  const failures: { id: string; name: string; error: string }[] = []

  for (const p of players) {
    let ok = false
    for (let a = 0; a < MAX_ATTEMPTS_PER_PLAYER; a++) {
      try {
        await prisma.player.update({
          where: { id: p.id, orgId: user.orgId },
          data: { paymentRef: generatePlayerPaymentRef(p.name) },
        })
        updated++
        ok = true
        break
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue
        }
        failures.push({
          id: p.id,
          name: p.name,
          error: e instanceof Error ? e.message : 'Unknown error',
        })
        break
      }
    }
    if (!ok && !failures.some((f) => f.id === p.id)) {
      failures.push({
        id: p.id,
        name: p.name,
        error: 'Could not assign a unique payment reference',
      })
    }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/players')
  revalidatePath('/player/dashboard')
  revalidatePath('/player/payments')

  if (failures.length > 0) {
    const error =
      updated > 0
        ? `Updated ${updated} of ${players.length}, but ${failures.length} could not be updated.`
        : `${failures.length} player(s) could not be updated.`
    return {
      success: false,
      error,
      updated,
      total: players.length,
      failures,
    }
  }

  return { success: true, updated, total: players.length }
}
