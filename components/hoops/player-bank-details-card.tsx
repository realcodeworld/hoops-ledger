'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Building2, Check, ChevronDown, Copy } from 'lucide-react'

export function CopyRow({
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
}

/**
 * Collapsible bank transfer block styled like the online payment control; expands to show details.
 * Pair with `PaymentReferenceCopyField` above so the reference is visible before expanding.
 */
export function PlayerBankTransferCollapsible({
  accountName,
  sortCode,
  accountNumber,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border-2 border-[#FF4D4D] bg-white shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 min-h-[3.25rem] text-left font-semibold text-base text-[#FF4D4D] hover:bg-red-50/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D4D] focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <span className="flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6 shrink-0" aria-hidden />
          Bank transfer
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-red-100 bg-slate-50/90 px-4 py-4">
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Use the payment reference shown above this section when you pay — it helps your organiser
            match your transfer. Copy each line below into your banking app.
          </p>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-1">
            <CopyRow label="Account name" value={accountName} />
            <CopyRow label="Sort code" value={sortCode} mono />
            <CopyRow label="Account number" value={accountNumber} mono />
          </div>
        </div>
      )}
    </div>
  )
}
