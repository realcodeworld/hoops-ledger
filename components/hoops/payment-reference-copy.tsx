'use client'

import { CopyRow } from '@/components/hoops/player-bank-details-card'

export function PaymentReferenceCopyField({
  paymentRef,
  className,
}: {
  paymentRef: string
  className?: string
}) {
  return (
    <div
      className={
        className ??
        'rounded-xl border border-gray-200 bg-slate-50/90 px-3 py-1'
      }
    >
      <CopyRow label="Payment reference" value={paymentRef} mono />
    </div>
  )
}
