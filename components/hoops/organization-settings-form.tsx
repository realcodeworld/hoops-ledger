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
        setMessage({ type: 'success', text: result.message || 'Organisation settings updated successfully' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update organisation settings' })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update organisation settings'
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
          Organisation Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Organisation Name</Label>
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

          <div className="space-y-2">
            <Label htmlFor="whatsappSupportNumber">WhatsApp support number</Label>
            <Input
              id="whatsappSupportNumber"
              name="whatsappSupportNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+447XXXXXXXXX"
              defaultValue={organization.whatsappSupportNumber ?? ''}
              disabled={!isAdmin || isPending}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Optional. Players see the WhatsApp icon on the Balance card (dashboard and payments) and
              a &quot;Chat on WhatsApp&quot; link at the bottom of those pages. Leave blank to hide. Use
              international format (e.g. +44 for UK).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monzoPayUrl">Online payment link</Label>
            <Input
              id="monzoPayUrl"
              name="monzoPayUrl"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://monzo.me/…"
              defaultValue={organization.monzoPayUrl ?? ''}
              disabled={!isAdmin || isPending}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Optional. Players see an &quot;Online payment&quot; button on the Balance card (dashboard
              and payments). Paste the full https link from your provider (e.g. Monzo.me). Amount and
              reference are set in that app when you create the link. Must be monzo.me or monzo.com.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <p className="text-sm font-medium text-gray-900">Bank transfer (optional)</p>
            <p className="text-xs text-gray-500 -mt-2">
              If you fill these in, players see them on the Balance card to pay by transfer. Leave all
              three blank to hide. UK sort code (6 digits) and account number (6–8 digits).
            </p>
            <div className="space-y-2">
              <Label htmlFor="bankAccountName">Account name</Label>
              <Input
                id="bankAccountName"
                name="bankAccountName"
                type="text"
                autoComplete="organization"
                placeholder="e.g. Hoops Club"
                defaultValue={organization.bankAccountName ?? ''}
                disabled={!isAdmin || isPending}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankSortCode">Sort code</Label>
                <Input
                  id="bankSortCode"
                  name="bankSortCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="12-34-56"
                  defaultValue={organization.bankSortCode ?? ''}
                  disabled={!isAdmin || isPending}
                  className="w-full font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccountNumber">Account number</Label>
                <Input
                  id="bankAccountNumber"
                  name="bankAccountNumber"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="12345678"
                  defaultValue={organization.bankAccountNumber ?? ''}
                  disabled={!isAdmin || isPending}
                  className="w-full font-mono"
                />
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
              size="lg"
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
              <strong>View Only:</strong> Only administrators can modify organisation settings.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}