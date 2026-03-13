import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { SendMagicLinkButton } from './send-magic-link-button'
import { EmailBalanceReminderButton } from './email-balance-reminder-button'
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
  FileText,
  Plus,
  Gamepad2,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

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
      matchPlayers: {
        include: {
          match: {
            include: {
              session: { select: { id: true, name: true, startsAt: true } },
              matchPlayers: {
                include: { player: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { match: { createdAt: 'desc' } },
        take: 20,
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

  // Calculate balance - combine queries for better performance
  const [totalFeesOwed, totalPayments] = await Promise.all([
    prisma.attendance.aggregate({
      where: {
        playerId: player.id,
        status: { in: ['unpaid', 'paid'] },
      },
      _sum: {
        feeAppliedPence: true,
      },
    }),
    prisma.payment.aggregate({
      where: {
        playerId: player.id,
      },
      _sum: {
        amountPence: true,
      },
    }),
  ])

  const totalOwed = totalFeesOwed._sum.feeAppliedPence || 0
  const totalPaid = totalPayments._sum.amountPence || 0
  const balanceDifference = totalOwed - totalPaid
  const unpaid = Math.max(0, balanceDifference)
  const credit = Math.max(0, -balanceDifference)

  // Match history: one entry per match (player's matchPlayers), sorted by match date desc
  const matchHistory = (player.matchPlayers ?? [])
    .map((mp) => ({
      match: mp.match,
      playerTeam: mp.team,
      won: mp.match.winningTeam === mp.team,
    }))
    .sort(
      (a, b) =>
        new Date(b.match.createdAt).getTime() - new Date(a.match.createdAt).getTime()
    )

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/dashboard/players">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Players
            </Link>
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <SendMagicLinkButton playerId={player.id} playerEmail={player.email} />
            <EmailBalanceReminderButton
              playerId={player.id}
              playerPhone={player.phone}
              unpaidBalancePence={unpaid}
            />
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/dashboard/payments/new?playerId=${player.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Record Payment
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/dashboard/players/${player.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Player
              </Link>
            </Button>
          </div>
        </div>

        {/* Player Name */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{player.name}</h1>
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
                    <span>{new Date(player.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
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
                <div className="grid grid-cols-3 gap-4">
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
                      <CurrencyDisplay amountPence={totalPaid} />
                    </div>
                    <div className="text-sm text-gray-500">Total Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className={`w-5 h-5 ${credit > 0 ? 'text-green-500' : 'text-orange-500'}`} />
                    </div>
                    <div className="text-2xl font-bold">
                      <CurrencyDisplay
                        amountPence={credit > 0 ? credit : unpaid}
                        className={unpaid > 0 ? 'text-warning' : credit > 0 ? 'text-success' : ''}
                      />
                    </div>
                    <div className="text-sm text-gray-500">{credit > 0 ? 'In Credit' : 'Unpaid'}</div>
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
                            <div className="sm:inline">{new Date(attendance.session.startsAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
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

            {/* Match history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gamepad2 className="w-5 h-5 mr-2 text-primary" />
                  Match history
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {matchHistory.map(({ match, playerTeam, won }) => {
                      const teamAPlayers = match.matchPlayers.filter((mp) => mp.team === 'A')
                      const teamBPlayers = match.matchPlayers.filter((mp) => mp.team === 'B')
                      const teamLabel = playerTeam === 'A' ? 'Team A' : 'Team B'
                      const winnerLabel = match.winningTeam === 'A' ? 'Team A' : 'Team B'
                      const hasScore =
                        match.teamAScore != null && match.teamBScore != null
                      const scoreBracket = hasScore
                        ? ` [${match.teamAScore}–${match.teamBScore}]`
                        : ''
                      const titleLabel = match.label ? ` ${match.label}` : ''
                      const cardTitle = `Match${titleLabel}: ${winnerLabel} 🥇${scoreBracket}`
                      return (
                        <Link
                          key={match.id}
                          href={`/dashboard/matches/${match.id}`}
                          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{cardTitle}</div>
                            <div className="text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0">
                              <span>{formatDateTime(match.createdAt)}</span>
                              {match.session && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">
                                    {match.session.name || formatDateTime(match.session.startsAt)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-sm">
                              <div>
                                <span className="font-medium text-blue-700">Team A:</span>{' '}
                                <span className="text-gray-600">
                                  {teamAPlayers.map((mp) => mp.player.name).join(', ')}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-amber-700">Team B:</span>{' '}
                                <span className="text-gray-600">
                                  {teamBPlayers.map((mp) => mp.player.name).join(', ')}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm mt-1">
                              <span className={playerTeam === 'A' ? 'text-blue-700' : 'text-amber-700'}>
                                {teamLabel}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant={won ? 'default' : 'secondary'}
                            className={
                              won
                                ? 'bg-green-600 hover:bg-green-600 shrink-0'
                                : 'bg-gray-500 hover:bg-gray-500 shrink-0'
                            }
                          >
                            {won ? 'Won' : 'Lost'}
                          </Badge>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No matches yet
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
                            {payment.method} • {new Date(payment.occurredOn).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
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
  )
}