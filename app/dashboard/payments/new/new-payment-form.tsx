'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createManualPayment } from '@/lib/actions/payments'
import Link from 'next/link'

interface NewPaymentFormProps {
  players: Array<{ id: string; name: string }>
  currencySymbol: string
  defaultPlayerId?: string
}

export function NewPaymentForm({ players, currencySymbol, defaultPlayerId }: NewPaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setError(null)

    // Convert amount to pence
    const amount = parseFloat(formData.get('amount') as string)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    formData.set('amountPence', Math.round(amount * 100).toString())

    startTransition(async () => {
      const result = await createManualPayment(formData)

      if (result.success) {
        router.push('/dashboard/payments')
        router.refresh()
      } else {
        setError(result.error || 'Failed to create payment')
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="playerId">Player *</Label>
          <Select name="playerId" required disabled={isPending} defaultValue={defaultPlayerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a player" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({currencySymbol}) *</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="method">Payment Method *</Label>
          <Select name="method" required defaultValue="cash" disabled={isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="occurredOn">Payment Date *</Label>
          <Input
            id="occurredOn"
            name="occurredOn"
            type="date"
            required
            className="w-full"
            defaultValue={new Date().toISOString().split('T')[0]}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any additional information about this payment..."
          className="w-full"
          rows={3}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? 'Recording...' : 'Record Payment'}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto" disabled={isPending}>
          <Link href="/dashboard/payments">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
