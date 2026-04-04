'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPlayer } from '@/lib/actions/players'
import { UserPlus } from 'lucide-react'
import { PricingRule } from '@prisma/client'
import { getCurrencySymbol } from '@/lib/format'

interface NewPlayerFormProps {
  pricingRules: PricingRule[]
  currency: string
}

export function NewPlayerForm({ pricingRules, currency }: NewPlayerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pricingRuleId, setPricingRuleId] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await createPlayer(formData)
      
      if (result.success) {
        router.push('/dashboard/players')
        router.refresh()
      } else {
        setError(result.error || 'Failed to create player')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currencySymbol = getCurrencySymbol(currency)

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Player name"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricingRuleId">Pricing Category *</Label>
        <input type="hidden" name="pricingRuleId" value={pricingRuleId} />
        <Select
          value={pricingRuleId}
          onValueChange={setPricingRuleId}
          disabled={isSubmitting}
          required
        >
          <SelectTrigger id="pricingRuleId">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {pricingRules.map((rule) => (
              <SelectItem key={rule.id} value={rule.id}>
                {rule.name} ({currencySymbol}{(rule.feePence / 100).toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="player@email.com"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500">
          Required for player portal access
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+447700900123"
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500">
          E.164 only (e.g. +447700900123)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="openingBalancePounds">Balance carried forward (optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {currencySymbol}
          </span>
          <Input
            id="openingBalancePounds"
            name="openingBalancePounds"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            disabled={isSubmitting}
            className="pl-8"
            autoComplete="off"
          />
        </div>
        <p className="text-xs text-gray-500">
          Debt from before Hoops Ledger. It adds to session fees; recorded payments reduce the total owed.
        </p>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Creating...' : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Player
            </>
          )}
        </Button>
      </div>
    </form>
  )
}