'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trophy, Flame, CalendarCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
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

const PAGE_SIZE = 10

function parseTab(t: string | null): TabValue {
  if (t === TAB_POINTS || t === TAB_ATTENDANCE) return t
  if (t === TAB_WIN || t === 'streaks') return TAB_WIN
  return TAB_POINTS
}

function parsePage(p: string | null): number {
  const num = parseInt(p ?? '1', 10)
  return isNaN(num) || num < 1 ? 1 : num
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  basePath: string
  tab: string | null
}

function Pagination({ currentPage, totalPages, totalItems, basePath, tab }: PaginationProps) {
  if (totalPages <= 1) return null

  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (tab && tab !== TAB_POINTS) params.set('tab', tab)
    if (p > 1) params.set('page', String(p))
    const queryString = params.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
  }

  const startItem = (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, totalItems)

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push('ellipsis')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push('ellipsis')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-4">
      <p className="text-sm text-gray-500">
        Showing {startItem}-{endItem} of {totalItems} players
      </p>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(currentPage - 1)}
          className={cn(currentPage <= 1 && 'pointer-events-none')}
          aria-disabled={currentPage <= 1}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <Link key={page} href={buildHref(page)}>
              <Button
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="h-8 w-8 p-0"
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            </Link>
          )
        )}

        <Link
          href={buildHref(currentPage + 1)}
          className={cn(currentPage >= totalPages && 'pointer-events-none')}
          aria-disabled={currentPage >= totalPages}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
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
  const page = parsePage(searchParams.get('page'))

  const myEntry = currentPlayerId ? entries.find((e) => e.playerId === currentPlayerId) : null
  const myWin = currentPlayerId ? winStreaks.find((e) => e.playerId === currentPlayerId) : null
  const myAtt = currentPlayerId ? attendanceStreaks.find((e) => e.playerId === currentPlayerId) : null

  const pointsTotalPages = Math.ceil(entries.length / PAGE_SIZE)
  const winTotalPages = Math.ceil(winStreaks.length / PAGE_SIZE)
  const attendanceTotalPages = Math.ceil(attendanceStreaks.length / PAGE_SIZE)

  const pointsPage = Math.min(page, Math.max(1, pointsTotalPages))
  const winPage = Math.min(page, Math.max(1, winTotalPages))
  const attendancePage = Math.min(page, Math.max(1, attendanceTotalPages))

  const paginatedEntries = entries.slice((pointsPage - 1) * PAGE_SIZE, pointsPage * PAGE_SIZE)
  const paginatedWinStreaks = winStreaks.slice((winPage - 1) * PAGE_SIZE, winPage * PAGE_SIZE)
  const paginatedAttendance = attendanceStreaks.slice((attendancePage - 1) * PAGE_SIZE, attendancePage * PAGE_SIZE)

  const tabClass = (t: TabValue) =>
    tab === t
      ? 'bg-orange-500 text-white border border-b-0 border-orange-500 -mb-px shadow-sm rounded-t-md'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-transparent rounded-t-md'

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
      <div className="flex gap-2 border-b border-gray-200" role="tablist" aria-label="Leaderboard categories">
        <Link
          href={basePath}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tabClass(TAB_POINTS)}`}
          role="tab"
          aria-selected={tab === TAB_POINTS}
          aria-controls="tabpanel-points"
        >
          Points
        </Link>
        <Link
          href={`${basePath}?tab=win`}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tabClass(TAB_WIN)}`}
          role="tab"
          aria-selected={tab === TAB_WIN}
          aria-controls="tabpanel-win"
        >
          Game stats
        </Link>
        <Link
          href={`${basePath}?tab=attendance`}
          className={`px-4 py-2 text-sm font-medium transition-colors ${tabClass(TAB_ATTENDANCE)}`}
          role="tab"
          aria-selected={tab === TAB_ATTENDANCE}
          aria-controls="tabpanel-attendance"
        >
          Attendance streak
        </Link>
      </div>

      {tab === TAB_POINTS && (
        <Card role="tabpanel" id="tabpanel-points" aria-labelledby="tab-points">
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
              <>
                <Table className="min-w-[280px]">
                  <TableHeader>
                    <TableRow className="border-b">
                      <TableHead className={headClass}>#</TableHead>
                      <TableHead className={headClass}>Player</TableHead>
                      <TableHead className={`${headClass} text-right`}>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => (
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
                <Pagination
                  currentPage={pointsPage}
                  totalPages={pointsTotalPages}
                  totalItems={entries.length}
                  basePath={basePath}
                  tab={null}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === TAB_WIN && (
        <Card role="tabpanel" id="tabpanel-win" aria-labelledby="tab-win">
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
              <>
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
                    {paginatedWinStreaks.map((entry) => (
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
                <Pagination
                  currentPage={winPage}
                  totalPages={winTotalPages}
                  totalItems={winStreaks.length}
                  basePath={basePath}
                  tab={TAB_WIN}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {tab === TAB_ATTENDANCE && (
        <Card role="tabpanel" id="tabpanel-attendance" aria-labelledby="tab-attendance">
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
              <>
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
                    {paginatedAttendance.map((entry) => (
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
                <Pagination
                  currentPage={attendancePage}
                  totalPages={attendanceTotalPages}
                  totalItems={attendanceStreaks.length}
                  basePath={basePath}
                  tab={TAB_ATTENDANCE}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
