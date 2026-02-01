import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Logo } from '@/components/hoops/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { logout } from '@/lib/actions/auth'
import { LogOut, Calendar, CreditCard, Trophy, Gamepad2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getLeaderboard, getPlayerTotalPoints } from '@/lib/actions/leaderboard'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { format } from 'date-fns'

export default async function PlayerDashboardPage() {
  const player = await getCurrentPlayer()

  if (!player) {
    redirect('/')
  }

  // Get player with attendance, payment, and match data
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
    },
  })

  if (!playerData) {
    redirect('/')
  }

  // Calculate financial summary - combine queries for better performance
  const [totalOwed, totalPaid] = await Promise.all([
    prisma.attendance.aggregate({
      where: {
        playerId: player.id,
        status: { in: ['unpaid', 'paid'] },
      },
      _sum: { feeAppliedPence: true },
    }),
    prisma.payment.aggregate({
      where: { playerId: player.id },
      _sum: { amountPence: true },
    }),
  ])

  const totalOwedAmount = totalOwed._sum.feeAppliedPence || 0
  const totalPaidAmount = totalPaid._sum.amountPence || 0
  const balanceDifference = totalOwedAmount - totalPaidAmount
  const unpaid = Math.max(0, balanceDifference)
  const credit = Math.max(0, -balanceDifference)

  const sessionsAttended = playerData.attendance.length

  const leaderboardResult = await getLeaderboard()
  const leaderboardEntries = leaderboardResult.success ? leaderboardResult.data ?? [] : []
  const myRank = leaderboardEntries.find((e) => e.playerId === player.id)?.rank ?? null
  const myPoints = await getPlayerTotalPoints(player.id)

  // Match history: one entry per match, sorted by match date desc
  const matchHistory = (playerData.matchPlayers ?? [])
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Your dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
        </div>

        {/* Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center flex-wrap gap-2">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Leaderboard
              {myRank != null ? (
                <span className="text-base font-normal text-gray-500">
                  You&apos;re #{myRank} ({myPoints} pts)
                </span>
              ) : (
                <span className="text-base font-normal text-gray-500">
                  Your points: {myPoints} pts
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboardEntries.length === 0 ? (
              <p className="text-gray-500 text-sm">No leaderboard yet.</p>
            ) : (
              <div className="space-y-2">
                {leaderboardEntries.map((entry) => (
                  <div
                    key={entry.playerId}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                      entry.playerId === player.id ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-8 tabular-nums">
                        #{entry.rank}
                      </span>
                      <span className={`font-medium ${entry.playerId === player.id ? 'text-orange-800' : 'text-gray-900'}`}>
                        {entry.name}
                        {entry.playerId === player.id ? ' (you)' : ''}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {entry.totalPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
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
                      {attendance.notes && (
                        <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          Note: {attendance.notes}
                        </p>
                      )}
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

        {/* Match history */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gamepad2 className="w-5 h-5 mr-2 text-primary" />
              Match history
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No matches yet</p>
            ) : (
              <div className="space-y-4">
                {matchHistory.map(({ match, won }) => {
                  const teamAPlayers = match.matchPlayers.filter((mp) => mp.team === 'A')
                  const teamBPlayers = match.matchPlayers.filter((mp) => mp.team === 'B')
                  const winnerLabel = match.winningTeam === 'A' ? 'Team A' : 'Team B'
                  const hasScore =
                    match.teamAScore != null && match.teamBScore != null
                  const scoreBracket = hasScore
                    ? ` [${match.teamAScore}–${match.teamBScore}]`
                    : ''
                  const titleLabel = match.label ? ` ${match.label}` : ''
                  const cardTitle = `Match${titleLabel}: ${winnerLabel} 🥇${scoreBracket}`
                  return (
                    <Card key={match.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="flex items-center text-lg">
                              <Trophy className="w-5 h-5 mr-2 text-primary shrink-0" />
                              <span className="truncate">{cardTitle}</span>
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              {format(new Date(match.createdAt), 'PPP')}
                              {match.session && (
                                <>
                                  {' · '}
                                  {match.session.name ||
                                    format(new Date(match.session.startsAt), 'PPP')}
                                </>
                              )}
                            </p>
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
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-blue-700">Team A</p>
                            <p className="text-gray-600">
                              {teamAPlayers.map((mp) => mp.player.name).join(', ')}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-amber-700">Team B</p>
                            <p className="text-gray-600">
                              {teamBPlayers.map((mp) => mp.player.name).join(', ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}