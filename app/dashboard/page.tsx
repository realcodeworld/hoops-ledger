import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, CreditCard, BarChart3, Plus, LineChart } from 'lucide-react'
import { getPlayers } from '@/lib/actions/players'
import { getOrganizationFinancials } from '@/lib/actions/payments'
import { getDashboardAttendanceSeries } from '@/lib/actions/dashboard'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { AttendanceOverTimeChart } from '@/components/hoops/attendance-over-time-chart'
import Link from 'next/link'

export default async function DashboardPage() {
  // Fetch dashboard data
  const [playersResult, financialsResult, attendanceSeriesResult] = await Promise.all([
    getPlayers(),
    getOrganizationFinancials(),
    getDashboardAttendanceSeries(36),
  ])

  const players = playersResult.success ? playersResult.data : []
  const financials = financialsResult.success ? financialsResult.data : {
    outstandingAmount: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
  }

  const activePlayers = (players || []).filter(p => p.isActive)
  const attendanceSeries =
    attendanceSeriesResult.success ? attendanceSeriesResult.data : []

  return (
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

        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Attendance over time</CardTitle>
                <CardDescription className="mt-1">
                  Headcount per session (up to the 36 most recent sessions)
                </CardDescription>
              </div>
              <LineChart className="h-8 w-8 text-primary shrink-0 hidden sm:block" aria-hidden />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <AttendanceOverTimeChart data={attendanceSeries} />
          </CardContent>
        </Card>
    </div>
  )
}