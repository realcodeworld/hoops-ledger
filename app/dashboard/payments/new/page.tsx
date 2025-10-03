import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getOrganizationSettings } from '@/lib/actions/settings'
import { NewPaymentForm } from './new-payment-form'

interface NewPaymentPageProps {
  searchParams: Promise<{ playerId?: string }>
}

export default async function NewPaymentPage({ searchParams }: NewPaymentPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const { playerId } = await searchParams

  const organization = await getOrganizationSettings()

  if (!organization) {
    redirect('/auth')
  }

  // Get all active players
  const players = await prisma.player.findMany({
    where: {
      orgId: user.orgId,
      isActive: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const formatPrice = (pence: number) => (pence / 100).toFixed(2)
  const getCurrencySymbol = (currency: string) => {
    switch (currency) {
      case 'GBP': return '£'
      case 'EUR': return '€'
      case 'USD': return '$'
      case 'AUD': return 'A$'
      default: return currency
    }
  }

  const currencySymbol = getCurrencySymbol(organization.currency)

  return (
    <AdminLayout currentPath="/dashboard/payments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/dashboard/payments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Record New Payment</h1>
          </div>
        </div>

        {/* Create Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-primary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NewPaymentForm
              players={players}
              currencySymbol={currencySymbol}
              defaultPlayerId={playerId}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
