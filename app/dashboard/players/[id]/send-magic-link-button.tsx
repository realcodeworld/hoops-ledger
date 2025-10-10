'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sendMagicLink } from '@/lib/actions/magic-link'
import { Mail } from 'lucide-react'

interface SendMagicLinkButtonProps {
  playerId: string
  playerEmail: string | null
}

export function SendMagicLinkButton({ playerId, playerEmail }: SendMagicLinkButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleClick() {
    if (!playerEmail) {
      setMessage({ type: 'error', text: 'Player has no email address on file' })
      return
    }

    setIsPending(true)
    setMessage(null)

    const result = await sendMagicLink(playerId)

    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Magic link sent' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send magic link' })
    }

    setIsPending(false)

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleClick}
        variant="outline"
        className="w-full sm:w-auto"
        disabled={isPending || !playerEmail}
      >
        <Mail className="w-4 h-4 mr-2" />
        {isPending ? 'Sending...' : 'Send Magic Link'}
      </Button>
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
