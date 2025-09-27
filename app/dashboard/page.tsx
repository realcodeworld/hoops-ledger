import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CreditCard, BarChart3, Plus, Clock } from 'lucide-react'
import { getPlayers } from '@/lib/actions/players'
import { getTodaySessions } from '@/lib/actions/sessions'
import { getOrganizationFinancials } from '@/lib/actions/payments'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { formatTime } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Fetch dashboard data
  const [playersResult, sessionsResult, financialsResult] = await Promise.all([
    getPlayers(),
    getTodaySessions(),
    getOrganizationFinancials(),
  ])

  const players = playersResult.success ? playersResult.data : []
  const todaySessions = sessionsResult.success ? sessionsResult.data : []
  const financials = financialsResult.success ? financialsResult.data : {
    outstandingAmount: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
  }

  const activePlayers = (players || []).filter(p => p.isActive)

  return (
    <AdminLayout currentPath="/dashboard">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user.name}. Here's what's happening with {user.org.name} today.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Button asChild size="sm">
              <Link href="/dashboard/sessions/new">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlayers.length}</div>
              <p className="text-xs text-muted-foreground">
                {(players?.length || 0) - activePlayers.length} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySessions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today
              </p>
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
              <p className="text-xs text-muted-foreground">
                Unpaid fees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <BarChart3 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay amountPence={financials?.monthlyRevenue || 0} />
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue collected
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Today's Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(todaySessions?.length || 0) === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No sessions scheduled for today</p>
                  <Button asChild size="sm">
                    <Link href="/dashboard/sessions/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Schedule Session
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {(todaySessions || []).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-xl">
                      <div>
                        <h3 className="font-medium">{session.name || 'Training Session'}</h3>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>{formatTime(session.startsAt)}</span>
                          {session.venue && <span>• {session.venue}</span>}
                          <span>• {session._count.attendance} attending</span>
                        </div>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/sessions/${session.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <Button asChild variant="outline" className="justify-start tap-target">
                  <Link href="/dashboard/players/new">
                    <Users className="w-4 h-4 mr-3" />
                    Add New Player
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start tap-target">
                  <Link href="/dashboard/sessions/new">
                    <Calendar className="w-4 h-4 mr-3" />
                    Create Session
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start tap-target">
                  <Link href="/dashboard/payments/new">
                    <CreditCard className="w-4 h-4 mr-3" />
                    Record Payment
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="justify-start tap-target">
                  <Link href="/dashboard/reports">
                    <BarChart3 className="w-4 h-4 mr-3" />
                    View Reports
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Activity feed will show recent player additions, payments, and session updates</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/audit">
                  View Audit Logs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}