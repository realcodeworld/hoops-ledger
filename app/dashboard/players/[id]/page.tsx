import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { prisma } from '@/lib/prisma'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  FileText
} from 'lucide-react'

interface PlayerDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerDetailsPage({ params }: PlayerDetailsPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const { id } = await params

  const player = await prisma.player.findFirst({
    where: {
      id,
      orgId: user.orgId,
    },
    include: {
      pricingRule: true,
      attendance: {
        include: {
          session: {
            select: {
              id: true,
              name: true,
              startsAt: true,
              venue: true,
            },
          },
        },
        orderBy: {
          checkedInAt: 'desc',
        },
        take: 10,
      },
      payments: {
        orderBy: {
          occurredOn: 'desc',
        },
        take: 10,
      },
      _count: {
        select: {
          attendance: true,
          payments: true,
        },
      },
    },
  })

  if (!player) {
    notFound()
  }

  // Calculate balance
  const totalFeesOwed = await prisma.attendance.aggregate({
    where: {
      playerId: player.id,
      status: { in: ['unpaid', 'paid'] },
    },
    _sum: {
      feeAppliedPence: true,
    },
  })

  const totalPayments = await prisma.payment.aggregate({
    where: {
      playerId: player.id,
    },
    _sum: {
      amountPence: true,
    },
  })

  const balance = (totalFeesOwed._sum.feeAppliedPence || 0) - (totalPayments._sum.amountPence || 0)

  return (
    <AdminLayout currentPath="/dashboard/players">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/dashboard/players">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Players
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{player.name}</h1>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/dashboard/players/${player.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Player
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-medium">{player.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <div className="mt-1">
                    <CategoryBadge
                      categoryName={player.pricingRule?.name || 'No Category'}
                      feePence={player.pricingRule?.feePence}
                      currency={user.org?.currency || 'GBP'}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <ActivityBadge isActive={player.isActive} />
                    {player.isExempt && (
                      <Badge variant="exempt">Exempt</Badge>
                    )}
                  </div>
                </div>

                {player.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{player.email}</span>
                    </div>
                  </div>
                )}

                {player.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{player.phone}</span>
                    </div>
                  </div>
                )}

                {player.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <div className="flex items-start mt-1">
                      <FileText className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <p className="text-sm text-gray-700">{player.notes}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Member Since</label>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{new Date(player.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">{player._count.attendance}</div>
                    <div className="text-sm text-gray-500">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      <CurrencyDisplay
                        amountPence={balance}
                        showSign
                        className={balance > 0 ? 'text-warning' : balance < 0 ? 'text-success' : ''}
                      />
                    </div>
                    <div className="text-sm text-gray-500">Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                {player.attendance.length > 0 ? (
                  <div className="space-y-3">
                    {player.attendance.map((attendance) => (
                      <div key={attendance.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{attendance.session.name}</div>
                          <div className="text-sm text-gray-500">
                            <div className="sm:inline">{new Date(attendance.session.startsAt).toLocaleDateString()}</div>
                            {attendance.session.venue && (
                              <>
                                <span className="hidden sm:inline"> • </span>
                                <div className="sm:inline truncate">{attendance.session.venue}</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                          <div className="font-medium">
                            <CurrencyDisplay amountPence={attendance.feeAppliedPence} />
                          </div>
                          <Badge variant={
                            attendance.status === 'paid' ? 'paid' :
                            attendance.status === 'exempt' ? 'exempt' : 'unpaid'
                          }>
                            {attendance.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No sessions attended yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {player.payments.length > 0 ? (
                  <div className="space-y-3">
                    {player.payments.map((payment) => (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            <CurrencyDisplay amountPence={payment.amountPence} />
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {payment.method} • {new Date(payment.occurredOn).toLocaleDateString()}
                          </div>
                        </div>
                        {payment.notes && (
                          <div className="text-sm text-gray-600 sm:max-w-[200px] truncate">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No payments recorded yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}