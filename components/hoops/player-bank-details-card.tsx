'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, Check, Copy } from 'lucide-react'

function CopyRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p
          className={`mt-0.5 text-sm font-semibold text-gray-900 break-words ${mono ? 'font-mono tabular-nums tracking-tight' : ''}`}
        >
          {value}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 h-9 px-2.5"
        onClick={copy}
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </Button>
    </div>
  )
}

type Props = {
  accountName: string
  sortCode: string
  accountNumber: string
  paymentReference: string
}

export function PlayerBankDetailsCard({
  accountName,
  sortCode,
  accountNumber,
  paymentReference,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 ring-1 ring-slate-200/60">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="h-4 w-4 text-slate-600 shrink-0" aria-hidden />
        <h3 className="text-sm font-semibold text-gray-900">Pay by bank transfer</h3>
      </div>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        Use{' '}
        <span className="font-semibold text-gray-800">{paymentReference}</span> as the payment
        reference so your organiser can match your payment.
      </p>
      <div className="rounded-xl border border-gray-200 bg-white px-3 py-1">
        <CopyRow label="Account name" value={accountName} />
        <CopyRow label="Sort code" value={sortCode} mono />
        <CopyRow label="Account number" value={accountNumber} mono />
      </div>
    </div>
  )
}
