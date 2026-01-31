'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { updatePayment } from '@/lib/actions/payments'
import Link from 'next/link'
import { format } from 'date-fns'

interface EditPaymentFormProps {
  payment: {
    id: string
    amountPence: number
    method: string
    occurredOn: Date
    notes: string | null
    player: {
      id: string
      name: string
    }
  }
}

export function EditPaymentForm({ payment }: EditPaymentFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    // Convert amount to pence
    const amount = parseFloat(formData.get('amount') as string)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const amountPence = Math.round(amount * 100)
    const method = formData.get('method') as 'cash' | 'bank_transfer' | 'other'
    const occurredOn = formData.get('occurredOn') as string
    const notes = (formData.get('notes') as string) || null

    startTransition(async () => {
      const result = await updatePayment(payment.id, {
        amountPence,
        method,
        occurredOn,
        notes,
      })

      if (result.success) {
        setSuccess('Payment updated successfully!')
        setTimeout(() => {
          router.push('/dashboard/payments')
          router.refresh()
        }, 1000)
      } else {
        setError(result.error || 'Failed to update payment')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="player">Player</Label>
          <Input
            id="player"
            value={payment.player.name}
            disabled
            className="bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500">Player cannot be changed after payment is recorded</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (£) *</Label>
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
            defaultValue={(payment.amountPence / 100).toFixed(2)}
          />
          <p className="text-xs text-gray-500">Changing amount will reallocate to unpaid sessions</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="method">Payment Method *</Label>
          <Select name="method" required defaultValue={payment.method} disabled={isPending}>
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
            defaultValue={format(new Date(payment.occurredOn), 'yyyy-MM-dd')}
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
          defaultValue={payment.notes || ''}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isPending}>
          {isPending ? 'Updating...' : 'Update Payment'}
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto" disabled={isPending}>
          <Link href="/dashboard/payments">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}
