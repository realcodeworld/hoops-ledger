'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { createPlayer } from '@/lib/actions/players'
import { UserPlus } from 'lucide-react'
import { PricingRule } from '@prisma/client'

interface NewPlayerFormProps {
  pricingRules: PricingRule[]
  currency: string
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'GBP': return '£'
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'AUD': return 'A$'
    default: return currency
  }
}

export function NewPlayerForm({ pricingRules, currency }: NewPlayerFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        <select
          id="pricingRuleId"
          name="pricingRuleId"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting}
        >
          <option value="">Select category</option>
          {pricingRules.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {rule.name} ({currencySymbol}{(rule.feePence / 100).toFixed(2)})
            </option>
          ))}
        </select>
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