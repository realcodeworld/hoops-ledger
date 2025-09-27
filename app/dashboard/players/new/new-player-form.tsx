'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { createPlayer } from '@/lib/actions/players'
import { UserPlus, Mail, Phone, Users, Shield, FileText } from 'lucide-react'
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
        router.refresh() // Refresh to show new data
      } else {
        setError(result.error || 'Failed to create player')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Enter player's full name"
                required
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <p className="text-sm text-gray-600">
          Contact information is optional but recommended for communication and portal access.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="player@email.com"
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required for player portal access via magic links
            </p>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+44 7700 900123"
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Player Category and Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Player Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pricingRuleId" className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Category *
            </label>
            <select
              id="pricingRuleId"
              name="pricingRuleId"
              required
              className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              <option value="">Select a pricing category</option>
              {pricingRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name} ({getCurrencySymbol(currency)}{(rule.feePence / 100).toFixed(2)} per session)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 pt-8">
            <input
              id="isExempt"
              name="isExempt"
              type="checkbox"
              value="true"
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-gray-400 mr-2" />
              <label htmlFor="isExempt" className="text-sm font-medium text-gray-700">
                Mark as Exempt
              </label>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          Exempt players are always charged {getCurrencySymbol(currency)}0.00, regardless of their category.
        </p>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Additional Notes</h3>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any additional information about this player..."
              className="flex w-full rounded-2xl border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <div className="p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="tap-target"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="tap-target"
        >
          {isSubmitting ? (
            'Creating Player...'
          ) : (
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