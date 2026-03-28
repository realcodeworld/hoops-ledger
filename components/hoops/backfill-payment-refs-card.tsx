'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { backfillPlayerPaymentRefs } from '@/lib/actions/backfill-payment-refs'
import { Hash, Loader2 } from 'lucide-react'

type Props = {
  playerCount: number
}

export function BackfillPaymentRefsCard({ playerCount }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  async function runBackfill() {
    setPending(true)
    setMessage(null)
    try {
      const result = await backfillPlayerPaymentRefs()
      setOpen(false)
      if (result.success) {
        setMessage({
          type: 'success',
          text: `Updated ${result.updated} of ${result.total} player payment references.`,
        })
        router.refresh()
      } else {
        const detail =
          result.failures && result.failures.length > 0
            ? ` ${result.failures.slice(0, 3).map((f) => `${f.name}: ${f.error}`).join('; ')}${result.failures.length > 3 ? '…' : ''}`
            : ''
        setMessage({
          type: 'error',
          text: `${result.error}${detail}`,
        })
        router.refresh()
      }
    } catch (e) {
      setOpen(false)
      setMessage({
        type: 'error',
        text: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Hash className="w-5 h-5 mr-2 text-primary" />
          Player payment references
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Regenerate bank transfer references for all {playerCount} player
          {playerCount !== 1 ? 's' : ''} in your organisation. Each reference will use the
          player&apos;s <strong>current name</strong> plus a short unique code (same format as for
          newly added players). Existing references are replaced — tell players to use the new
          value on future transfers.
        </p>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={pending || playerCount === 0}>
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Working…
                </>
              ) : (
                'Regenerate all payment references'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate all payment references?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <span>
                  This updates <strong>{playerCount}</strong> player
                  {playerCount !== 1 ? 's' : ''}. Anyone who already copied an old reference for a
                  pending transfer should use the new one shown on their profile and payments page
                  after this runs.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                disabled={pending}
                onClick={() => void runBackfill()}
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Running…
                  </>
                ) : (
                  'Yes, regenerate'
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {message && (
          <div
            className={`text-sm p-3 rounded-lg border ${
              message.type === 'success'
                ? 'text-green-800 bg-green-50 border-green-200'
                : 'text-red-800 bg-red-50 border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
