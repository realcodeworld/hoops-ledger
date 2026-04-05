import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Wallet } from 'lucide-react'
import { WhatsappBrandIcon } from '@/components/hoops/whatsapp-brand-icon'
import { PlayerPaymentSupportFooter } from '@/components/hoops/player-payment-support-footer'
import { PlayerBankTransferCollapsible } from '@/components/hoops/player-bank-details-card'
import { prisma } from '@/lib/prisma'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { computeNetBalancePence } from '@/lib/player-balance'
import { buildMonzoPaymentUrl } from '@/lib/monzo-pay-url'
import { PlayerBalanceBreakdown } from '@/components/hoops/player-balance-breakdown'
import { PlayerBalanceDueBanner } from '@/components/hoops/player-balance-due-banner'
import { PlayerRefreshButton } from '@/components/hoops/player-refresh-button'
import {
  PlayerPaymentsHistory,
  type HistoryItem,
} from '@/components/hoops/player-payments-history'

export default async function PlayerPaymentsPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/')

  const playerData = await prisma.player.findUnique({
    where: { id: player.id },
    include: {
      org: true,
      attendance: {
        include: { session: true },
        orderBy: { checkedInAt: 'desc' as const },
      },
      payments: { orderBy: { occurredOn: 'desc' as const } },
    },
  })
  if (!playerData) redirect('/')

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
  const totalSessionFeesPence = totalOwed._sum.feeAppliedPence || 0
  const totalPaidAmount = totalPaid._sum.amountPence || 0
  const openingBalancePence = playerData.openingBalancePence ?? 0
  const { amountDue: unpaid, credit } = computeNetBalancePence({
    totalSessionFeesPence,
    openingBalancePence,
    totalPaidPence: totalPaidAmount,
  })
  const hasUnpaidBalance = unpaid > 0

  const whatsappNumber = playerData.org.whatsappSupportNumber
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=Hi%2C%20I%20have%20a%20question%20about%20my%20payments`
    : null

  type MergedItem =
    | {
        type: 'session'
        id: string
        date: Date
        sessionName: string | null
        feePence: number
        status: string
        notes?: string | null
      }
    | {
        type: 'payment'
        id: string
        date: Date
        method: string
        amountPence: number
        notes?: string | null
      }

  const merged: MergedItem[] = [
    ...playerData.attendance.map((a) => ({
      type: 'session' as const,
      id: a.id,
      date: a.session.startsAt,
      sessionName: a.session.name,
      feePence: a.feeAppliedPence,
      status: a.status,
      notes: a.notes,
    })),
    ...playerData.payments.map((p) => ({
      type: 'payment' as const,
      id: p.id,
      date: p.occurredOn,
      method: p.method,
      amountPence: p.amountPence,
      notes: p.notes,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const org = playerData.org
  const monzoPayHref =
    hasUnpaidBalance && org.monzoPayUrl
      ? buildMonzoPaymentUrl(org.monzoPayUrl, unpaid, playerData.paymentRef)
      : null

  const historyItems: HistoryItem[] = merged.map((item) =>
    item.type === 'session'
      ? {
          type: 'session',
          id: item.id,
          dateIso: new Date(item.date).toISOString(),
          sessionName: item.sessionName,
          feePence: item.feePence,
          status: item.status,
          notes: item.notes,
        }
      : {
          type: 'payment',
          id: item.id,
          dateIso: new Date(item.date).toISOString(),
          method: item.method,
          amountPence: item.amountPence,
          notes: item.notes,
        }
  )

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Payments
      </h1>

      <PlayerBalanceDueBanner playerId={player.id} amountDuePence={unpaid} />

      <Card
        className={
          hasUnpaidBalance
            ? 'mb-6 overflow-hidden border-amber-200 bg-gradient-to-b from-amber-50/80 to-white shadow-md'
            : 'mb-6 shadow-sm'
        }
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center text-lg">
              <CreditCard
                className={`w-5 h-5 mr-2 shrink-0 ${hasUnpaidBalance ? 'text-amber-600' : 'text-primary'}`}
              />
              Balance
            </CardTitle>
            <div className="flex items-center gap-2 shrink-0">
              <PlayerRefreshButton label="Refresh balance" />
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#25D366] ring-1 ring-[#25D366]/25 hover:bg-[#25D366]/25 active:scale-95 transition-all"
                  aria-label="Chat on WhatsApp about payments"
                >
                  <WhatsappBrandIcon className="h-7 w-7" />
                </a>
              )}
            </div>
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

          <PlayerBalanceBreakdown
            totalSessionFeesPence={totalSessionFeesPence}
            openingBalancePence={openingBalancePence}
            totalPaidPence={totalPaidAmount}
            amountDuePence={unpaid}
            creditPence={credit}
          />

          {monzoPayHref && (
            <a
              href={monzoPayHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF4D4D] px-4 py-3.5 text-base font-semibold text-white shadow-md hover:bg-[#e84545] active:scale-[0.99] transition-all min-h-[3.25rem] ring-1 ring-[#FF4D4D]/20"
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
          <p className="text-sm text-gray-600">
            {hasUnpaidBalance
              ? 'Below is everything that affects your balance. Pay online or by bank transfer if available, then your organiser will record cash or transfer payments.'
              : 'Your session fees and recorded payments appear below.'}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
            Your balance updates when your organiser records a payment. After you pay, it may take up
            to 24 hours to show here while they reconcile.
          </p>
        </CardContent>
      </Card>

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Session and payment history
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Unpaid sessions count toward your balance; payments your organiser has recorded appear here too.
        </p>
        <PlayerPaymentsHistory items={historyItems} />
      </section>

      <PlayerPaymentSupportFooter whatsappHref={whatsappHref} />
    </>
  )
}
