import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, ArrowLeft, Clock, MapPin, Users, CreditCard, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getSessionDetail } from '@/lib/actions/sessions'
import { getPlayers } from '@/lib/actions/players'
import { getSessionMatches } from '@/lib/actions/matches'
import { formatTime, formatDate } from '@/lib/utils'
import { AttendanceManager } from '@/components/hoops/attendance-manager'
import { MatchResultForm } from '@/components/hoops/match-result-form'
import { MatchList } from '@/components/hoops/match-list'
import { getOrganizationSettings } from '@/lib/actions/settings'

interface SessionDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  const { id } = await params

  const [sessionResult, playersResult, matchesResult, orgSettings] = await Promise.all([
    getSessionDetail(id),
    getPlayers(),
    getSessionMatches(id),
    getOrganizationSettings()
  ])

  if (!sessionResult.success) {
    notFound()
  }

  const session = sessionResult.data!
  const players = playersResult.success ? playersResult.data : []
  const matches = matchesResult.success && matchesResult.data ? matchesResult.data : []
  const pricingRules = orgSettings?.pricingRules || []
  const attendeeIds = (session.attendance ?? []).map((a) => a.playerId)

  const totalAttending = session.attendance?.length || 0
  const paidCount = session.attendance?.filter(a => a.status === 'paid').length || 0
  const unpaidCount = session.attendance?.filter(a => a.status === 'unpaid').length || 0
  const waivedCount = session.attendance?.filter(a => a.status === 'waived').length || 0

  const totalFees = session.attendance?.reduce((sum, a) => sum + a.feeAppliedPence, 0) || 0
  const totalPaid = session.attendance
    ?.filter(a => a.status === 'paid')
    .reduce((sum, a) => sum + a.feeAppliedPence, 0) || 0

  return (
    <AdminLayout currentPath={`/dashboard/sessions/${id}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/dashboard/sessions">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sessions
            </Link>
          </Button>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                {session.name || `Training Session - ${formatDate(session.startsAt!)}`}
              </h1>
              {session.status === 'cancelled' && (
                <Badge variant="outline" className="border-red-500 text-red-600 bg-red-50">
                  Cancelled
                </Badge>
              )}
            </div>
            {session.status === 'cancelled' && session.cancelledReason && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                <span className="font-medium">Cancellation note:</span> {session.cancelledReason}
              </p>
            )}
          </div>
        </div>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                <span className="truncate">
                  {formatTime(session.startsAt!)}
                  {session.endsAt && ` - ${formatTime(session.endsAt)}`}
                </span>
              </div>
              {session.venue && (
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                  <span className="truncate">{session.venue}</span>
                </div>
              )}
              <div className="flex items-center text-sm">
                <Users className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                <span>
                  {totalAttending} attending
                </span>
              </div>
              <div className="flex items-center text-sm">
                <CreditCard className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                <span className="tabular-nums">
                  £{(totalPaid / 100).toFixed(2)} / £{(totalFees / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            {session.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {session.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{paidCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Paid</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{unpaidCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Unpaid</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{waivedCount}</div>
                <div className="text-xs sm:text-sm text-gray-500">Waived</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 tabular-nums">
                  £{(totalFees / 100).toFixed(2)}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Total Fees</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match results */}
        <MatchList sessionId={id} matches={matches} />

        {/* Attendance Management */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance & Payment Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceManager
              sessionId={id}
              attendance={session.attendance || []}
              availablePlayers={players || []}
              pricingRules={pricingRules}
            />
          </CardContent>
        </Card>

        {/* Record match result */}
        <MatchResultForm
          sessionId={id}
          players={players || []}
          attendeeIds={attendeeIds}
        />
      </div>
    </AdminLayout>
  )
}