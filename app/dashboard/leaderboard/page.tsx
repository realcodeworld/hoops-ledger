import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'
import { getLeaderboard } from '@/lib/actions/leaderboard'

export default async function LeaderboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const result = await getLeaderboard()
  const entries = result.success ? result.data ?? [] : []

  return (
    <AdminLayout currentPath="/dashboard/leaderboard">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Leaderboard
        </h1>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Points ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-gray-500 text-sm">No players on the leaderboard yet.</p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.playerId}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500 w-8 tabular-nums">
                        #{entry.rank}
                      </span>
                      <span className="font-medium text-gray-900">{entry.name}</span>
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
      </div>
    </AdminLayout>
  )
}
