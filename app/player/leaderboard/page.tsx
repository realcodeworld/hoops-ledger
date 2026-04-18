import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentPlayer } from '@/lib/auth'
import { getLeaderboard, getPlayerTotalPoints, getWinStreaks, getAttendanceStreaks } from '@/lib/actions/leaderboard'
import { LeaderboardView } from '@/components/hoops/leaderboard-view'
import { parseLeaderboardRange } from '@/lib/leaderboard-range'

interface PlayerLeaderboardPageProps {
  searchParams: Promise<{ range?: string }>
}

export default async function PlayerLeaderboardPage({
  searchParams,
}: PlayerLeaderboardPageProps) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/')
  const params = await searchParams
  const range = parseLeaderboardRange(params.range)

  const [leaderboardResult, winStreaksResult, attendanceStreaksResult] =
    await Promise.all([
      getLeaderboard(range),
      getWinStreaks(range),
      getAttendanceStreaks(range),
    ])
  const entries = leaderboardResult.success ? leaderboardResult.data ?? [] : []
  const winStreaks = winStreaksResult.success ? winStreaksResult.data ?? [] : []
  const attendanceStreaks = attendanceStreaksResult.success
    ? attendanceStreaksResult.data ?? []
    : []
  const myPoints = await getPlayerTotalPoints(player.id, range)

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
        Leaderboard
      </h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-gray-100" role="status" aria-label="Loading leaderboard"><span className="sr-only">Loading leaderboard data</span></div>}>
        <LeaderboardView
          entries={entries}
          winStreaks={winStreaks}
          attendanceStreaks={attendanceStreaks}
          basePath="/player/leaderboard"
          currentPlayerId={player.id}
          currentPlayerPoints={myPoints}
        />
      </Suspense>
    </>
  )
}
