import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { getSessions } from '@/lib/actions/sessions'
import Link from 'next/link'
import { SessionsSwipeList } from '@/components/hoops/sessions-swipe-list'

export default async function SessionsPage() {
  const sessionsResult = await getSessions()
  const sessions = (sessionsResult.success ? sessionsResult.data : []) ?? []

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
        <SessionsSwipeList sessions={sessions} />
      )}
    </div>
  )
}
