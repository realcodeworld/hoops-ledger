import { Suspense } from 'react'
import { getLeaderboard, getWinStreaks, getAttendanceStreaks } from '@/lib/actions/leaderboard'
import { LeaderboardView } from '@/components/hoops/leaderboard-view'
import { parseLeaderboardRange } from '@/lib/leaderboard-range'

interface LeaderboardPageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function LeaderboardPage({
  searchParams,
}: LeaderboardPageProps) {
  const params = await searchParams
  const range = parseLeaderboardRange(params.range)
  const [leaderboardResult, winStreaksResult, attendanceStreaksResult] = await Promise.all([
    getLeaderboard(range),
    getWinStreaks(range),
    getAttendanceStreaks(range),
  ])
  const entries = leaderboardResult.success ? leaderboardResult.data ?? [] : []
  const winStreaks = winStreaksResult.success ? winStreaksResult.data ?? [] : []
  const attendanceStreaks = attendanceStreaksResult.success
    ? attendanceStreaksResult.data ?? []
    : []

  return (
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
  )
}
