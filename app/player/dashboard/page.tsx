import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Trophy, Gamepad2, ArrowRight, Wallet } from 'lucide-react'
import { WhatsappBrandIcon } from '@/components/hoops/whatsapp-brand-icon'
import { PlayerPaymentSupportFooter } from '@/components/hoops/player-payment-support-footer'
import { PlayerBankTransferCollapsible } from '@/components/hoops/player-bank-details-card'
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

  const whatsappNumber = playerData.org.whatsappSupportNumber
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=Hi%2C%20I%20have%20a%20question%20about%20my%20payments`
    : null

  const monzoPayUrl = playerData.org.monzoPayUrl
  const org = playerData.org
  const hasBankDetails =
    !!org.bankAccountName && !!org.bankSortCode && !!org.bankAccountNumber

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

      <Card
        className={
          hasUnpaidBalance
            ? 'mb-6 overflow-hidden border-amber-200 bg-gradient-to-b from-amber-50/80 to-white shadow-md'
            : 'mb-6 shadow-sm'
        }
      >
        <CardHeader className="pb-2 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center text-lg">
                <CreditCard
                  className={`w-5 h-5 mr-2 shrink-0 ${hasUnpaidBalance ? 'text-amber-600' : 'text-primary'}`}
                />
                Balance
              </CardTitle>
              <p className="text-xs text-gray-500 mt-2 max-w-md leading-relaxed">
                {hasUnpaidBalance
                  ? 'You owe fees for one or more sessions. Pay online or check the breakdown below.'
                  : credit > 0
                    ? 'You are in credit — thank you.'
                    : 'You are up to date.'}
              </p>
            </div>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#25D366] ring-1 ring-[#25D366]/25 hover:bg-[#25D366]/25 transition-colors"
                aria-label="Chat on WhatsApp about payments"
              >
                <WhatsappBrandIcon className="h-7 w-7" />
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
              {credit > 0 ? 'In credit' : hasUnpaidBalance ? 'Amount due' : 'Balance'}
            </p>
            <p
              className={`font-bold tracking-tight text-gray-900 ${hasUnpaidBalance ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'}`}
            >
              <CurrencyDisplay amountPence={credit > 0 ? credit : unpaid} />
            </p>
          </div>

          {monzoPayUrl && (
            <a
              href={monzoPayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF4D4D] px-4 py-3.5 text-base font-semibold text-white shadow-md hover:bg-[#e84545] active:scale-[0.99] transition-all min-h-[3.25rem]"
            >
              <Wallet className="h-6 w-6 shrink-0" aria-hidden />
              Online payment
            </a>
          )}

          {org.bankAccountName &&
            org.bankSortCode &&
            org.bankAccountNumber && (
              <PlayerBankTransferCollapsible
                accountName={org.bankAccountName}
                sortCode={org.bankSortCode}
                accountNumber={org.bankAccountNumber}
                paymentRef={playerData.paymentRef}
              />
            )}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {hasUnpaidBalance ? (
              <Button
                asChild
                size="lg"
                variant={monzoPayUrl || hasBankDetails ? 'outline' : 'default'}
                className="w-full sm:w-auto"
              >
                <Link href="/player/payments">
                  View payment breakdown
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/player/payments">
                  View payment history
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
            Your balance updates when your organiser records a payment. After you pay online or by
            transfer, it may take up to 24 hours to appear here while they reconcile.
          </p>
        </CardContent>
      </Card>

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

      <PlayerPaymentSupportFooter whatsappHref={whatsappHref} />
    </>
  )
}
