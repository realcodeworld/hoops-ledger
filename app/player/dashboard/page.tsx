import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Logo } from '@/components/hoops/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/actions/auth'
import { LogOut, Calendar, CreditCard, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { format } from 'date-fns'

export default async function PlayerDashboardPage() {
  const player = await getCurrentPlayer()

  if (!player) {
    redirect('/')
  }

  // Get player with attendance and payment data
  const playerData = await prisma.player.findUnique({
    where: { id: player.id },
    include: {
      org: true,
      attendance: {
        include: {
          session: true,
        },
        orderBy: {
          checkedInAt: 'desc',
        },
      },
      payments: {
        orderBy: {
          occurredOn: 'desc',
        },
      },
    },
  })

  if (!playerData) {
    redirect('/')
  }

  // Calculate financial summary
  const totalOwed = await prisma.attendance.aggregate({
    where: {
      playerId: player.id,
      status: { in: ['unpaid', 'paid'] },
    },
    _sum: { feeAppliedPence: true },
  })

  const totalPaid = await prisma.payment.aggregate({
    where: { playerId: player.id },
    _sum: { amountPence: true },
  })

  const totalOwedAmount = totalOwed._sum.feeAppliedPence || 0
  const totalPaidAmount = totalPaid._sum.amountPence || 0
  const balanceDifference = totalOwedAmount - totalPaidAmount
  const unpaid = Math.max(0, balanceDifference)
  const credit = Math.max(0, -balanceDifference)

  const sessionsAttended = playerData.attendance.filter(a => a.checkedInAt).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="sm" />
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {player.name}
              </span>
              <form action={logout}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="mt-2 text-gray-600">
            View your attendance history, balances, and session analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Sessions Attended</p>
                <p className="text-2xl font-bold text-gray-900">{sessionsAttended}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center">
              <CreditCard className="w-8 h-8 text-success" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{credit > 0 ? 'In Credit' : 'Unpaid'}</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amountPence={credit > 0 ? credit : unpaid} />
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  <CurrencyDisplay amountPence={totalPaidAmount} />
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session History */}
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {playerData.attendance.length === 0 ? (
                <p className="text-gray-500 text-sm">No sessions attended yet</p>
              ) : (
                <div className="space-y-3">
                  {playerData.attendance.map((attendance) => (
                    <div
                      key={attendance.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {attendance.session.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(attendance.session.startsAt), 'PPP')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <CurrencyDisplay amountPence={attendance.feeAppliedPence} />
                        </div>
                        <Badge variant={attendance.status}>
                          {attendance.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {playerData.payments.length === 0 ? (
                <p className="text-gray-500 text-sm">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {playerData.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {payment.method === 'cash' ? 'Cash Payment' :
                           payment.method === 'bank_transfer' ? 'Bank Transfer' :
                           'Other Payment'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(payment.occurredOn), 'PPP')}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-gray-400 mt-1">{payment.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          <CurrencyDisplay amountPence={payment.amountPence} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}