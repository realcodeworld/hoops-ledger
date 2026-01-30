'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { deletePayment } from '@/lib/actions/payments'

type DeletePaymentButtonProps = {
  paymentId: string
  playerName: string
}

export function DeletePaymentButton({ paymentId, playerName }: DeletePaymentButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePayment(paymentId)

      if (result.success) {
        router.refresh()
      } else {
        alert(`Failed to delete payment: ${result.error}`)
      }
    })
  }

  if (showConfirm) {
    return (
      <Button
        variant="destructive"
        size="sm"
        className="h-8 w-20"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? 'Deleting...' : 'Confirm?'}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={() => setShowConfirm(true)}
      disabled={isPending}
      title={`Delete payment for ${playerName}`}
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">Delete</span>
    </Button>
  )
}
