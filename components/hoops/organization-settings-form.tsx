'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateOrganization } from '@/lib/actions/settings'
import { Building2, Save } from 'lucide-react'
import { Organization } from '@prisma/client'

interface OrganizationSettingsFormProps {
  organization: Organization
  isAdmin: boolean
}

const TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
]

const CURRENCIES = [
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
]

export function OrganizationSettingsForm({ organization, isAdmin }: OrganizationSettingsFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    if (!isAdmin) return

    setIsPending(true)
    setMessage(null)

    try {
      const result = await updateOrganization(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update organization settings' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update organization settings'
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-primary" />
          Organization Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              defaultValue={organization.name}
              required
              disabled={!isAdmin || isPending}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select name="timezone" defaultValue={organization.timezone} disabled={!isAdmin || isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((timezone) => (
                    <SelectItem key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select name="currency" defaultValue={organization.currency} disabled={!isAdmin || isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Save Changes
                </>
              )}
            </Button>
          )}

          {!isAdmin && (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <strong>View Only:</strong> Only administrators can modify organization settings.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}