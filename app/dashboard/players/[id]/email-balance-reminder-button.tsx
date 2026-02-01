'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { emailBalanceReminderToAdmin } from '@/lib/actions/balance-reminders'
import { Mail } from 'lucide-react'

interface EmailBalanceReminderButtonProps {
  playerId: string
  playerPhone: string | null
  unpaidBalancePence: number
}

export function EmailBalanceReminderButton({
  playerId,
  playerPhone,
  unpaidBalancePence,
}: EmailBalanceReminderButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const hasPhone = !!playerPhone
  const hasUnpaid = unpaidBalancePence > 0
  const disabled = isPending || !hasPhone || !hasUnpaid

  async function handleClick() {
    if (!hasPhone) {
      setMessage({ type: 'error', text: 'Add phone number to send reminder' })
      return
    }
    if (!hasUnpaid) {
      setMessage({ type: 'error', text: 'No unpaid balance to remind' })
      return
    }

    setIsPending(true)
    setMessage(null)

    const result = await emailBalanceReminderToAdmin(playerId)

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Balance reminder emailed to you' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to email reminder' })
    }

    setIsPending(false)

    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        variant="outline"
        className="w-full sm:w-auto"
        disabled={disabled}
        title={
          !hasPhone
            ? 'Add phone number to send reminder'
            : !hasUnpaid
              ? 'No unpaid balance to remind'
              : undefined
        }
      >
        <Mail className="w-4 h-4 mr-2" />
        {isPending ? 'Sending...' : 'Email balance reminder to me'}
      </Button>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
