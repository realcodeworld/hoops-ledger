import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewPlayerForm } from './new-player-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getOrganizationSettings } from '@/lib/actions/settings'

export default async function NewPlayerPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const organization = await getOrganizationSettings()

  if (!organization) {
    redirect('/auth')
  }

  return (
    <AdminLayout currentPath="/dashboard/players">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/players">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Player</h1>
          <p className="mt-2 text-gray-600">
            Create a new player profile for your basketball club.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Player Information</CardTitle>
            <CardDescription>
              Fill out the player's details below. Email address is optional but required 
              for players to access their personal portal via magic links.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewPlayerForm
              pricingRules={organization.pricingRules}
              currency={organization.currency}
            />
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-blue-900 mb-2">Pricing Categories</h3>
            <div className="text-sm text-blue-700 space-y-1">
              {organization.pricingRules.map((rule) => (
                <p key={rule.id}>
                  <strong>{rule.name}:</strong> {organization.currency === 'GBP' ? '£' : organization.currency}{(rule.feePence / 100).toFixed(2)} per session
                </p>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-sm text-blue-700">
                <strong>Exempt players</strong> are automatically charged £0.00 for all sessions,
                regardless of their category. This is useful for coaches, volunteers, or sponsored players.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}