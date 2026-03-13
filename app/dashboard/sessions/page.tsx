import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock, MapPin, Users } from 'lucide-react'
import { getSessions } from '@/lib/actions/sessions'
import { formatTime, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { SessionActions } from '@/components/hoops/session-actions'

export default async function SessionsPage() {
  const sessionsResult = await getSessions()
  const sessions = sessionsResult.success ? sessionsResult.data : []

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sessions</h1>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/dashboard/sessions/new">
              <Plus className="w-4 h-4 mr-2" />
              New session
            </Link>
          </Button>
        </div>
        <div className="grid gap-6">
          {(sessions?.length || 0) === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-6">No sessions yet</p>
                <Button asChild size="sm" className="w-full sm:w-auto">
                  <Link href="/dashboard/sessions/new">
                    <Plus className="w-4 h-4 mr-2" />
                    New session
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            sessions?.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-primary shrink-0" />
                        <span className="truncate">
                          {session.name || formatDate(session.startsAt)}
                        </span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center mt-2 text-sm text-gray-500 gap-x-4 gap-y-1">
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
                    <SessionActions session={session} />
                  </div>
                </CardHeader>
                {session.notes && (
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      <strong>Notes:</strong> {session.notes}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
  )
}