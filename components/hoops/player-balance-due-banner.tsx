'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const storageKey = (playerId: string) => `hl-player-balance-banner-${playerId}`

export function PlayerBalanceDueBanner({
  playerId,
  amountDuePence,
}: {
  playerId: string
  amountDuePence: number
}) {
  const [ready, setReady] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setReady(true)
    try {
      if (sessionStorage.getItem(storageKey(playerId)) === '1') {
        setDismissed(true)
      }
    } catch {
      /* ignore */
    }
  }, [playerId])

  if (!ready || amountDuePence <= 0 || dismissed) return null

  function dismiss() {
    try {
      sessionStorage.setItem(storageKey(playerId), '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      role="region"
      aria-label="Balance reminder"
      className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between animate-in fade-in-50 duration-300"
    >
      <p className="text-sm text-amber-950">
        You have{' '}
        <strong className="tabular-nums">
          <CurrencyDisplay amountPence={amountDuePence} />
        </strong>{' '}
        outstanding. Pay online or by bank transfer, or view the breakdown.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm" variant="default" className="bg-amber-700 hover:bg-amber-800">
          <Link href="/player/payments">View breakdown</Link>
        </Button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-2 text-amber-800 hover:bg-amber-100/80 transition-colors"
          aria-label="Dismiss reminder"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
