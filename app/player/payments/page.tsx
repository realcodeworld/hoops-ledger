import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Calendar, MessageCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { format } from 'date-fns'

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
  const totalOwedAmount = totalOwed._sum.feeAppliedPence || 0
  const totalPaidAmount = totalPaid._sum.amountPence || 0
  const balanceDifference = totalOwedAmount - totalPaidAmount
  const unpaid = Math.max(0, balanceDifference)
  const credit = Math.max(0, -balanceDifference)

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

  const methodLabel = (method: string) =>
    method === 'cash'
      ? 'Cash'
      : method === 'bank_transfer'
        ? 'Bank transfer'
        : 'Other'

  const whatsappNumber = playerData.org.whatsappSupportNumber

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Payments
      </h1>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-lg">
            <CreditCard className="w-5 h-5 mr-2 text-primary" />
            Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-1">
            {credit > 0 ? 'In credit' : 'Unpaid'}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            <CurrencyDisplay amountPence={credit > 0 ? credit : unpaid} />
          </p>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Session & payment history
        </h2>
        {merged.length === 0 ? (
          <p className="text-gray-500 text-sm">No sessions or payments yet</p>
        ) : (
          <ul className="space-y-3">
            {merged.map((item) =>
              item.type === 'session' ? (
                <li
                  key={`s-${item.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.sessionName || 'Session'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(item.date), 'dd/MM/yy')}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CurrencyDisplay amountPence={item.feePence} />
                    <Badge variant={item.status as 'paid' | 'unpaid' | 'waived' | 'exempt'}>
                      {item.status}
                    </Badge>
                  </div>
                </li>
              ) : (
                <li
                  key={`p-${item.id}`}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CreditCard className="w-4 h-4 text-green-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">
                        {methodLabel(item.method)} payment
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(item.date), 'dd/MM/yy')}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-green-600 shrink-0">
                    <CurrencyDisplay amountPence={item.amountPence} />
                  </p>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {whatsappNumber && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 mb-2">
            Have a query about your payments?
          </p>
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=Hi%2C%20I%20have%20a%20question%20about%20my%20payments`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      )}
    </>
  )
}
