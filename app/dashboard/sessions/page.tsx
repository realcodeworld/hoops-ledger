import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock, MapPin, Users } from 'lucide-react'
import { getSessions } from '@/lib/actions/sessions'
import { formatTime, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function SessionsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Fetch sessions data
  const sessionsResult = await getSessions()
  const sessions = sessionsResult.success ? sessionsResult.data : []

  return (
    <AdminLayout currentPath="/dashboard/sessions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
            <p className="mt-2 text-gray-600">
              Manage training sessions and track attendance.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button asChild>
              <Link href="/dashboard/sessions/new">
                <Plus className="w-4 h-4 mr-2" />
                New Session
              </Link>
            </Button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="grid gap-6">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sessions yet
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  Create your first training session to start tracking attendance.
                </p>
                <Button asChild>
                  <Link href="/dashboard/sessions/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Session
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-primary" />
                        {session.name || `Training Session - ${formatDate(session.startsAt)}`}
                      </CardTitle>
                      <div className="flex items-center mt-2 text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(session.startsAt)}
                          {session.endsAt && ` - ${formatTime(session.endsAt)}`}
                        </div>
                        {session.venue && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {session.venue}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {session._count.attendance} attending
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/sessions/${session.id}`}>
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {(session.notes || session.capacity) && (
                  <CardContent>
                    {session.capacity && (
                      <div className="text-sm text-gray-600">
                        <strong>Capacity:</strong> {session.capacity} players
                      </div>
                    )}
                    {session.notes && (
                      <div className="text-sm text-gray-600 mt-1">
                        <strong>Notes:</strong> {session.notes}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Future Features Preview */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-blue-900 mb-2">📅 Sessions Management - Ready to Build</h3>
            <div className="text-sm text-blue-700 space-y-2">
              <p>✅ <strong>Session Creation:</strong> Create training sessions with date, time, venue, and capacity</p>
              <p>✅ <strong>Live Attendance:</strong> Fast mobile interface for marking player attendance</p>
              <p>✅ <strong>Fee Management:</strong> Apply pricing rules and handle exemptions</p>
              <p>✅ <strong>Payment Processing:</strong> Mark payments and track balances in real-time</p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-blue-600">
                All server actions are implemented. UI components ready to be built next.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}