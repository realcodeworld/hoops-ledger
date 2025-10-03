import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, Calendar, CreditCard, DollarSign } from 'lucide-react'
import { getOrganizationReport } from '@/lib/actions/reports'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { prisma } from '@/lib/prisma'

export default async function ReportsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch report data
  const reportResult = await getOrganizationReport(30)
  const report = reportResult.success ? reportResult.data : null

  // Fetch payment methods breakdown
  const paymentsByMethod = await prisma.payment.groupBy({
    where: { orgId: user.orgId },
    by: ['method'],
    _sum: { amountPence: true },
    _count: true,
  })

  // Fetch top players by attendance
  const topPlayers = await prisma.player.findMany({
    where: {
      orgId: user.orgId,
      isActive: true,
    },
    include: {
      _count: {
        select: {
          attendance: {
            where: {
              checkedInAt: { not: null },
            },
          },
        },
      },
    },
    orderBy: {
      attendance: {
        _count: 'desc',
      },
    },
    take: 10,
  })

  // Fetch pricing rules for category mix
  const pricingRules = await prisma.pricingRule.findMany({
    where: { orgId: user.orgId },
  })

  const categoryMixWithNames = report?.categoryMix.map(item => {
    const rule = pricingRules.find(r => r.id === item.pricingRuleId)
    return {
      name: rule?.name || 'Unknown',
      count: item.count,
    }
  })

  return (
    <AdminLayout currentPath="/dashboard/reports">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600 text-sm sm:text-base">Financial reports and attendance analytics for the last 30 days.</p>
        </div>

        {!report ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6 text-center">
              <p className="text-red-800">Failed to load report data</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue (30 days)</CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <CurrencyDisplay amountPence={report.revenueInPeriod} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Collected in period
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
                    <CurrencyDisplay amountPence={report.totalOutstanding} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unpaid fees
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.sessionsInPeriod}</div>
                  <p className="text-xs text-muted-foreground">
                    In last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Attendance</CardTitle>
                  <Users className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.attendanceInPeriod}</div>
                  <p className="text-xs text-muted-foreground">
                    Check-ins
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Revenue Trend (6 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.monthlyRevenue.map((item) => {
                      const date = new Date(item.month + '-01')
                      const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' })
                      const maxRevenue = Math.max(...report.monthlyRevenue.map(r => r.revenue))
                      const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0

                      return (
                        <div key={item.month} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{monthName}</span>
                            <span className="text-gray-600">
                              <CurrencyDisplay amountPence={item.revenue} />
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentsByMethod.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No payments recorded yet</p>
                    ) : (
                      paymentsByMethod.map((method) => {
                        const total = paymentsByMethod.reduce((acc, m) => acc + (m._sum.amountPence || 0), 0)
                        const percentage = total > 0 ? ((method._sum.amountPence || 0) / total) * 100 : 0
                        const methodName = method.method === 'bank_transfer' ? 'Bank Transfer' :
                                         method.method.charAt(0).toUpperCase() + method.method.slice(1)

                        return (
                          <div key={method.method} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{methodName}</p>
                                <p className="text-sm text-gray-500">{method._count} payments</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">
                                  <CurrencyDisplay amountPence={method._sum.amountPence || 0} />
                                </p>
                                <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Player Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Active Players by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {!categoryMixWithNames || categoryMixWithNames.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No active players</p>
                    ) : (
                      categoryMixWithNames.map((cat) => {
                        const total = categoryMixWithNames.reduce((acc, c) => acc + c.count, 0)
                        const percentage = total > 0 ? (cat.count / total) * 100 : 0

                        return (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{cat.name}</span>
                              <span className="text-gray-600">{cat.count} players ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Top Players by Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPlayers.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No attendance data</p>
                    ) : (
                      topPlayers.map((player, index) => {
                        const maxAttendance = topPlayers[0]?._count.attendance || 1
                        const percentage = (player._count.attendance / maxAttendance) * 100

                        return (
                          <div key={player.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400 w-6">#{index + 1}</span>
                                <span className="font-medium">{player.name}</span>
                              </div>
                              <span className="text-gray-600">{player._count.attendance} sessions</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 ml-8">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}