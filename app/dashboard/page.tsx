import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, CreditCard, BarChart3, Plus } from 'lucide-react'
import { getPlayers } from '@/lib/actions/players'
import { getOrganizationFinancials } from '@/lib/actions/payments'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Fetch dashboard data
  const [playersResult, financialsResult] = await Promise.all([
    getPlayers(),
    getOrganizationFinancials(),
  ])

  const players = playersResult.success ? playersResult.data : []
  const financials = financialsResult.success ? financialsResult.data : {
    outstandingAmount: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
  }

  const activePlayers = (players || []).filter(p => p.isActive)

  return (
    <AdminLayout currentPath="/dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex space-x-3">
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/dashboard/sessions/new">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlayers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <CreditCard className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amountPence={financials?.outstandingAmount || 0} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This month</CardTitle>
              <BarChart3 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amountPence={financials?.monthlyRevenue || 0} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}