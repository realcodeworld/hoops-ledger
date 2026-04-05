'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { cn } from '@/lib/utils'

type Props = {
  totalSessionFeesPence: number
  openingBalancePence: number
  totalPaidPence: number
  amountDuePence: number
  creditPence: number
}

export function PlayerBalanceBreakdown({
  totalSessionFeesPence,
  openingBalancePence,
  totalPaidPence,
  amountDuePence,
  creditPence,
}: Props) {
  const [open, setOpen] = useState(false)
  const totalOwed =
    totalSessionFeesPence + openingBalancePence

  return (
    <div className="rounded-xl border border-gray-200 bg-white/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-gray-900 hover:bg-gray-50/80 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-expanded={open}
      >
        <span>How your balance is calculated</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200',
            open && 'rotate-180'
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 px-3 py-3 space-y-2.5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Session fees (recorded)</span>
            <span className="font-medium tabular-nums text-gray-900">
              <CurrencyDisplay amountPence={totalSessionFeesPence} />
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Carried forward</span>
            <span className="font-medium tabular-nums text-gray-900">
              <CurrencyDisplay amountPence={openingBalancePence} />
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
            <span className="text-gray-800 font-medium">Total owed</span>
            <span className="font-semibold tabular-nums">
              <CurrencyDisplay amountPence={totalOwed} />
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Payments recorded</span>
            <span className="font-medium tabular-nums text-green-700">
              <CurrencyDisplay amountPence={totalPaidPence} />
            </span>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
            <span className="font-medium text-gray-900">
              {creditPence > 0 ? 'In credit' : 'Amount due'}
            </span>
            <span
              className={cn(
                'font-semibold tabular-nums',
                amountDuePence > 0 ? 'text-amber-700' : creditPence > 0 ? 'text-green-700' : 'text-gray-700'
              )}
            >
              <CurrencyDisplay
                amountPence={creditPence > 0 ? creditPence : amountDuePence}
              />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
