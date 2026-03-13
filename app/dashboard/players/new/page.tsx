import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { NewPlayerForm } from './new-player-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getOrganizationSettings } from '@/lib/actions/settings'

export default async function NewPlayerPage() {
  const organization = await getOrganizationSettings()

  if (!organization) {
    redirect('/auth')
  }

  return (
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

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add player</h1>

      <Card>
        <CardContent className="pt-6">
          <NewPlayerForm
            pricingRules={organization.pricingRules}
            currency={organization.currency}
          />
        </CardContent>
      </Card>
    </div>
  )
}