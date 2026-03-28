import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Trophy, Gamepad2, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import {
  getLeaderboard,
  getPlayerTotalPoints,
  getWinStreaks,
} from '@/lib/actions/leaderboard'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { format } from 'date-fns'

export default async function PlayerDashboardPage() {
  const player = await getCurrentPlayer()

  if (!player) {
    redirect('/')
  }

  const playerData = await prisma.player.findUnique({
    where: { id: player.id },
    include: {
      org: true,
      attendance: {
        include: { session: true },
        orderBy: { checkedInAt: 'desc' as const },
      },
      payments: { orderBy: { occurredOn: 'desc' as const } },
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
        orderBy: { match: { createdAt: 'desc' as const } },
        take: 20,
      },
    },
  })

  if (!playerData) {
    redirect('/')
  }

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
  const hasUnpaidBalance = unpaid > 0

  const matchHistory = (playerData.matchPlayers ?? [])
    .map((mp) => {
      const isDraw = mp.match.winningTeam === 'DRAW'
      return {
        match: mp.match,
        playerTeam: mp.team,
        won: !isDraw && mp.match.winningTeam === mp.team,
        isDraw,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.match.createdAt).getTime() -
        new Date(a.match.createdAt).getTime()
    )

  const wins = matchHistory.filter((m) => m.won).length
  const draws = matchHistory.filter((m) => m.isDraw).length
  const losses = matchHistory.length - wins - draws
  const lastMatch = matchHistory[0]

  const [leaderboardResult, winStreaksResult] = await Promise.all([
    getLeaderboard(),
    getWinStreaks(),
  ])
  const leaderboardEntries = leaderboardResult.success ? leaderboardResult.data ?? [] : []
  const winStreaks = winStreaksResult.success ? winStreaksResult.data ?? [] : []
  const myPoints = await getPlayerTotalPoints(player.id)

  const myPointsEntry = leaderboardEntries.find((e) => e.playerId === player.id)
  const myWinEntry = winStreaks.find((e) => e.playerId === player.id)
  const pointsRank = myPointsEntry?.rank ?? null
  const maxStreak = myWinEntry?.maxWinStreak ?? 0

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Your dashboard
      </h1>

      {/* Personalized: balance first if they owe */}
      {hasUnpaidBalance && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="w-5 h-5 mr-2 text-amber-600" />
              Amount due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              <CurrencyDisplay amountPence={unpaid} />
            </p>
            <Button asChild>
              <Link href="/player/payments">
                View payments
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Match summary */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <Gamepad2 className="w-5 h-5 mr-2 text-primary" />
            Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchHistory.length === 0 ? (
            <p className="text-gray-500 text-sm mb-3">No matches yet</p>
          ) : (
            <>
              <p className="text-sm text-gray-700 mb-1">
                Record: <span className="font-semibold">{wins} W</span>
                {draws > 0 && (
                  <>
                    {' '}
                    – <span className="font-semibold">{draws} D</span>
                  </>
                )}
                {' '}
                – <span className="font-semibold">{losses} L</span>
              </p>
              {lastMatch && (
                <p className="text-sm text-gray-600 mb-3">
                  Last match:{' '}
                  <span
                    className={
                      lastMatch.isDraw
                        ? 'text-slate-600 font-medium'
                        : lastMatch.won
                          ? 'text-green-600 font-medium'
                          : 'text-gray-600'
                    }
                  >
                    {lastMatch.isDraw ? 'Draw' : lastMatch.won ? 'Won' : 'Lost'}
                  </span>
                  {' · '}
                  {format(new Date(lastMatch.match.createdAt), 'dd/MM/yy')}
                </p>
              )}
            </>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/player/matches">
              View match history
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Compact leaderboard widget */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <Trophy className="w-5 h-5 mr-2 text-primary" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pointsRank != null ? (
            <p className="text-sm text-gray-700 mb-1">
              You&apos;re #{pointsRank} on points
              {myPoints != null && ` (${myPoints} pts)`}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-1">Record matches to appear on the leaderboard</p>
          )}
          {maxStreak > 0 && (
            <p className="text-sm text-gray-600 mb-3">Best win streak: {maxStreak}</p>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/player/leaderboard">
              See full leaderboard
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Optional: quick link to payments when no balance due */}
      {!hasUnpaidBalance && (
        <p className="text-sm text-gray-500">
          <Link href="/player/payments" className="text-primary hover:underline">
            View payment history
          </Link>
        </p>
      )}
    </>
  )
}
