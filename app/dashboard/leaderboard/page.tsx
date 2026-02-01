import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { getLeaderboard, getWinStreaks, getAttendanceStreaks } from '@/lib/actions/leaderboard'
import { LeaderboardView } from '@/components/hoops/leaderboard-view'

export default async function LeaderboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const [leaderboardResult, winStreaksResult, attendanceStreaksResult] = await Promise.all([
    getLeaderboard(),
    getWinStreaks(),
    getAttendanceStreaks(),
  ])
  const entries = leaderboardResult.success ? leaderboardResult.data ?? [] : []
  const winStreaks = winStreaksResult.success ? winStreaksResult.data ?? [] : []
  const attendanceStreaks = attendanceStreaksResult.success
    ? attendanceStreaksResult.data ?? []
    : []

  return (
    <AdminLayout currentPath="/dashboard/leaderboard">
      <div className="space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Leaderboard
        </h1>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" />}>
          <LeaderboardView
            entries={entries}
            winStreaks={winStreaks}
            attendanceStreaks={attendanceStreaks}
            basePath="/dashboard/leaderboard"
          />
        </Suspense>
      </div>
    </AdminLayout>
  )
}
