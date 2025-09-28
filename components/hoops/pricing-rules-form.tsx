'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updatePricingRule } from '@/lib/actions/settings'
import { DollarSign, Save, Info } from 'lucide-react'
import { PricingRule } from '@prisma/client'

interface PricingRulesFormProps {
  pricingRule: PricingRule
  currency: string
  isAdmin: boolean
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

const formatPrice = (pence: number) => (pence / 100).toFixed(2)

export function PricingRulesForm({ pricingRule, currency, isAdmin }: PricingRulesFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const currencySymbol = getCurrencySymbol(currency)

  async function handleSubmit(formData: FormData) {
    if (!isAdmin) return

    setIsPending(true)
    setMessage(null)

    try {
      // Add the pricing rule ID to the form data
      formData.append('pricingRuleId', pricingRule.id)

      const result = await updatePricingRule(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Pricing rule updated successfully' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update pricing rules' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update pricing rules'
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-primary" />
          Pricing Rules
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Pricing Rule Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={pricingRule.name}
              required
              disabled={!isAdmin || isPending}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feePence">Fee Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {currencySymbol}
              </span>
              <Input
                id="feePence"
                name="feePence"
                type="number"
                step="0.01"
                min="0"
                max="999.99"
                defaultValue={formatPrice(pricingRule.feePence)}
                required
                disabled={!isAdmin || isPending}
                className="pl-8"
              />
            </div>
          </div>

          {/* Info about player categories */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">Player Categories:</p>
                <ul className="space-y-1">
                  <li><strong>Student:</strong> Players with student status (reduced rate)</li>
                  <li><strong>Standard:</strong> Regular adult players (full rate)</li>
                  <li><strong>Guest:</strong> Occasional visitors (often free or reduced rate)</li>
                </ul>
                <p className="mt-2">
                  <strong>Note:</strong> Players marked as "exempt" will always pay {currencySymbol}0.00 regardless of these settings.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`text-sm p-3 rounded-lg border ${
              message.type === 'success'
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-red-700 bg-red-50 border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {isAdmin && (
            <Button
              type="submit"
              disabled={isPending}
              className="w-full md:w-auto"
            >
              {isPending ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Pricing
                </>
              )}
            </Button>
          )}

          {!isAdmin && (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <strong>View Only:</strong> Only administrators can modify pricing rules.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}