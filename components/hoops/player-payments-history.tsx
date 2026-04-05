'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Calendar, ChevronDown } from 'lucide-react'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

const INITIAL = 8

export type HistoryItem =
  | {
      type: 'session'
      id: string
      dateIso: string
      sessionName: string | null
      feePence: number
      status: string
      notes?: string | null
    }
  | {
      type: 'payment'
      id: string
      dateIso: string
      method: string
      amountPence: number
      notes?: string | null
    }

function methodLabel(method: string) {
  if (method === 'cash') return 'Cash'
  if (method === 'bank_transfer') return 'Bank transfer'
  return 'Other'
}

export function PlayerPaymentsHistory({ items }: { items: HistoryItem[] }) {
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
      ),
    [items]
  )

  const visible = expanded ? sorted : sorted.slice(0, INITIAL)
  const hasMore = sorted.length > INITIAL

  if (sorted.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-2">No sessions or payments yet</p>
    )
  }

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {visible.map((item) =>
          item.type === 'session' ? (
            <li
              key={`s-${item.id}`}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.sessionName || 'Session'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.dateIso), 'dd/MM/yy')}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CurrencyDisplay amountPence={item.feePence} />
                <Badge variant={item.status as 'paid' | 'unpaid' | 'waived' | 'exempt'}>
                  {item.status}
                </Badge>
              </div>
            </li>
          ) : (
            <li
              key={`p-${item.id}`}
              className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <CreditCard className="w-4 h-4 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {methodLabel(item.method)} payment
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(item.dateIso), 'dd/MM/yy')}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>
                  )}
                </div>
              </div>
              <p className="font-semibold text-green-600 shrink-0">
                <CurrencyDisplay amountPence={item.amountPence} />
              </p>
            </li>
          )
        )}
      </ul>
      {hasMore && (
        <Button
          type="button"
          variant="ghost"
          className="w-full gap-1 text-gray-600 hover:text-gray-900"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show fewer' : `Show ${sorted.length - INITIAL} more`}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </Button>
      )}
    </div>
  )
}
