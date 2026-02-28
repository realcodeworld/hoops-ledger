'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trophy, Flame, CalendarCheck } from 'lucide-react'
import type {
  LeaderboardEntry,
  WinStreakEntry,
  AttendanceStreakEntry,
} from '@/lib/actions/leaderboard'

const cellClass = 'px-2 py-2 sm:px-4 tabular-nums'
const headClass = 'px-2 py-2 sm:px-4 text-muted-foreground font-medium'

const TAB_POINTS = 'points'
const TAB_WIN = 'win'
const TAB_ATTENDANCE = 'attendance'
const TABS = [TAB_POINTS, TAB_WIN, TAB_ATTENDANCE] as const
type TabValue = (typeof TABS)[number]

function parseTab(t: string | null): TabValue {
  if (t === TAB_POINTS || t === TAB_ATTENDANCE) return t
  if (t === TAB_WIN || t === 'streaks') return TAB_WIN
  return TAB_POINTS
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[]
  winStreaks: WinStreakEntry[]
  attendanceStreaks: AttendanceStreakEntry[]
  /** Base path for tab links (e.g. /dashboard/leaderboard or /player/dashboard). Tabs use ?tab= */
  basePath: string
  /** When set, highlights this player's row and shows "(you)" + optional subtitle */
  currentPlayerId?: string | null
  /** When currentPlayerId is set and they have points, show in Points tab subtitle (e.g. from getPlayerTotalPoints) */
  currentPlayerPoints?: number | null
}

export function LeaderboardView({
  entries,
  winStreaks,
  attendanceStreaks,
  basePath,
  currentPlayerId = null,
  currentPlayerPoints = null,
}: LeaderboardViewProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab = parseTab(tabParam)

  const myEntry = currentPlayerId ? entries.find((e) => e.playerId === currentPlayerId) : null
  const myWin = currentPlayerId ? winStreaks.find((e) => e.playerId === currentPlayerId) : null
  const myAtt = currentPlayerId ? attendanceStreaks.find((e) => e.playerId === currentPlayerId) : null

  const tabClass = (t: TabValue) =>
    tab === t
      ? 'border border-b-0 border-gray-200 -mb-px shadow-sm rounded-t-md'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent'

  const rowClass = (playerId: string) =>
    currentPlayerId && playerId === currentPlayerId
      ? 'bg-orange-50 ring-1 ring-orange-200'
      : 'bg-gray-50 hover:bg-gray-100'

  const nameClass = (playerId: string) =>
    currentPlayerId && playerId === currentPlayerId ? 'text-orange-800' : 'text-gray-900'

  const youSuffix = (playerId: string) =>
    currentPlayerId && playerId === currentPlayerId ? ' (you)' : ''

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200">
        <Link
          href={basePath}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${tabClass(TAB_POINTS)}`}
          style={tab === TAB_POINTS ? { backgroundColor: '#ea580c', color: '#fff' } : undefined}
        >
          Points
        </Link>
        <Link
          href={`${basePath}?tab=win`}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${tabClass(TAB_WIN)}`}
          style={tab === TAB_WIN ? { backgroundColor: '#ea580c', color: '#fff' } : undefined}
        >
          Game stats
        </Link>
        <Link
          href={`${basePath}?tab=attendance`}
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${tabClass(TAB_ATTENDANCE)}`}
          style={tab === TAB_ATTENDANCE ? { backgroundColor: '#ea580c', color: '#fff' } : undefined}
        >
          Attendance streak
        </Link>
      </div>

      {tab === TAB_POINTS && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center flex-wrap gap-2">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Points ranking
              {currentPlayerId && (
                myEntry ? (
                  <span className="text-base font-normal text-gray-500">
                    You&apos;re #{myEntry.rank} ({myEntry.totalPoints} pts)
                  </span>
                ) : (
                  currentPlayerPoints != null && (
                    <span className="text-base font-normal text-gray-500">
                      Your points: {currentPlayerPoints} pts
                    </span>
                  )
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-gray-500 text-sm">No players on the leaderboard yet.</p>
            ) : (
              <Table className="min-w-[280px]">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className={headClass}>#</TableHead>
                    <TableHead className={headClass}>Player</TableHead>
                    <TableHead className={`${headClass} text-right`}>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow
                      key={entry.playerId}
                      className={`border-b ${rowClass(entry.playerId)}`}
                    >
                      <TableCell className={`${cellClass} w-10 text-gray-500`}>
                        {entry.rank}
                      </TableCell>
                      <TableCell className={`${cellClass} ${nameClass(entry.playerId)}`}>
                        <span className="font-medium truncate block">
                          {entry.name}
                          {youSuffix(entry.playerId)}
                        </span>
                      </TableCell>
                      <TableCell className={`${cellClass} text-right font-semibold text-gray-900`}>
                        {entry.totalPoints} pts
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === TAB_WIN && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center flex-wrap gap-2">
              <Flame className="w-5 h-5 mr-2 text-orange-500" />
              Game stats
              {currentPlayerId && myWin && (
                <span className="text-base font-normal text-gray-500">
                  You&apos;re #{myWin.rank} · {myWin.gamesPlayed} games, {myWin.wins} W, {myWin.losses} L · Current: {myWin.currentWinStreak} · Max: {myWin.maxWinStreak}
                </span>
              )}
              {currentPlayerId && !myWin && (
                <span className="text-base font-normal text-gray-500">
                  Record match results to see game stats.
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Games played, wins, losses, and streaks (by match date)
            </p>
          </CardHeader>
          <CardContent>
            {winStreaks.length === 0 ? (
              <p className="text-gray-500 text-sm">No match results yet. Record match results to see game stats.</p>
            ) : (
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className={headClass}>#</TableHead>
                    <TableHead className={headClass}>Player</TableHead>
                    <TableHead className={`${headClass} text-right`}>GP</TableHead>
                    <TableHead className={`${headClass} text-right`}>W</TableHead>
                    <TableHead className={`${headClass} text-right`}>L</TableHead>
                    <TableHead className={`${headClass} text-right`}>Cur</TableHead>
                    <TableHead className={`${headClass} text-right`}>Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {winStreaks.map((entry) => (
                    <TableRow
                      key={entry.playerId}
                      className={`border-b ${rowClass(entry.playerId)}`}
                    >
                      <TableCell className={`${cellClass} w-10 text-gray-500`}>
                        {entry.rank}
                      </TableCell>
                      <TableCell className={`${cellClass} ${nameClass(entry.playerId)}`}>
                        <span className="font-medium truncate block">
                          {entry.name}
                          {youSuffix(entry.playerId)}
                        </span>
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.gamesPlayed}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.wins}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.losses}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.currentWinStreak}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right font-semibold text-gray-900`}>
                        {entry.maxWinStreak}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {tab === TAB_ATTENDANCE && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center flex-wrap gap-2">
              <CalendarCheck className="w-5 h-5 mr-2 text-green-600" />
              Session stats
              {currentPlayerId && myAtt && (
                <span className="text-base font-normal text-gray-500">
                  You&apos;re #{myAtt.rank} · {myAtt.sessionsAttended} attended, {myAtt.sessionsMissed} missed · Current: {myAtt.currentStreak} · Max: {myAtt.maxStreak}
                </span>
              )}
              {currentPlayerId && !myAtt && (
                <span className="text-base font-normal text-gray-500">
                  Attend sessions to appear here.
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Sessions attended, missed, and streaks (by session date)
            </p>
          </CardHeader>
          <CardContent>
            {attendanceStreaks.length === 0 ? (
              <p className="text-gray-500 text-sm">No attendance yet. Attend sessions to see session stats.</p>
            ) : (
              <Table className="min-w-[400px]">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className={headClass}>#</TableHead>
                    <TableHead className={headClass}>Player</TableHead>
                    <TableHead className={`${headClass} text-right`}>Attended</TableHead>
                    <TableHead className={`${headClass} text-right`}>Missed</TableHead>
                    <TableHead className={`${headClass} text-right`}>Cur</TableHead>
                    <TableHead className={`${headClass} text-right`}>Max</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceStreaks.map((entry) => (
                    <TableRow
                      key={entry.playerId}
                      className={`border-b ${rowClass(entry.playerId)}`}
                    >
                      <TableCell className={`${cellClass} w-10 text-gray-500`}>
                        {entry.rank}
                      </TableCell>
                      <TableCell className={`${cellClass} ${nameClass(entry.playerId)}`}>
                        <span className="font-medium truncate block">
                          {entry.name}
                          {youSuffix(entry.playerId)}
                        </span>
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.sessionsAttended}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.sessionsMissed}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right text-gray-700`}>
                        {entry.currentStreak}
                      </TableCell>
                      <TableCell className={`${cellClass} text-right font-semibold text-gray-900`}>
                        {entry.maxStreak}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
