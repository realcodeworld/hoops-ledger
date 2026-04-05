'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import { format } from 'date-fns'
import type { MatchTeam } from '@prisma/client'
import { formatMatchOutcome } from '@/lib/match-outcome'
import { cn } from '@/lib/utils'

export type SerializedPlayerMatch = {
  id: string
  createdAt: string
  won: boolean
  isDraw: boolean
  teamA: string[]
  teamB: string[]
  winningTeam: string
  teamAScore: number | null
  teamBScore: number | null
  label: string | null
  sessionName: string | null
  sessionStartsAt: string | null
}

type Filter = 'all' | 'wins' | 'losses' | 'draws'

const tabs: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'wins', label: 'Wins' },
  { id: 'losses', label: 'Losses' },
  { id: 'draws', label: 'Draws' },
]

export function PlayerMatchHistoryClient({
  matches,
}: {
  matches: SerializedPlayerMatch[]
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return matches
    if (filter === 'wins') return matches.filter((m) => m.won)
    if (filter === 'losses') return matches.filter((m) => !m.won && !m.isDraw)
    return matches.filter((m) => m.isDraw)
  }, [matches, filter])

  if (matches.length === 0) {
    return <p className="text-gray-500 text-sm">No matches yet</p>
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Filter matches"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={filter === t.id}
            onClick={() => setFilter(t.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              filter === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {t.label}
            {t.id !== 'all' && (
              <span className="ml-1 tabular-nums opacity-80">
                (
                {t.id === 'wins'
                  ? matches.filter((m) => m.won).length
                  : t.id === 'losses'
                    ? matches.filter((m) => !m.won && !m.isDraw).length
                    : matches.filter((m) => m.isDraw).length}
                )
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 py-4">No matches in this filter.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((match) => {
            const outcomeLabel = formatMatchOutcome(match.winningTeam as MatchTeam)
            const hasScore =
              match.teamAScore != null && match.teamBScore != null
            const scoreBracket = hasScore
              ? ` [${match.teamAScore}–${match.teamBScore}]`
              : ''
            const titleLabel = match.label ? ` ${match.label}` : ''
            const resultPhrase = match.isDraw
              ? 'Draw'
              : `${outcomeLabel} won`
            const cardTitle = `Match${titleLabel}: ${resultPhrase}${scoreBracket}`
            return (
              <Card key={match.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="flex items-center text-lg">
                        <Trophy className="w-5 h-5 mr-2 text-primary shrink-0" />
                        <span className="truncate">{cardTitle}</span>
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(match.createdAt), 'dd/MM/yy')}
                        {match.sessionName || match.sessionStartsAt ? (
                          <>
                            {' · '}
                            {match.sessionName ||
                              (match.sessionStartsAt
                                ? format(new Date(match.sessionStartsAt), 'dd/MM/yy')
                                : '')}
                          </>
                        ) : null}
                      </p>
                    </div>
                    <Badge
                      variant={
                        match.isDraw ? 'secondary' : match.won ? 'default' : 'secondary'
                      }
                      className={
                        match.isDraw
                          ? 'bg-slate-600 hover:bg-slate-600 shrink-0'
                          : match.won
                            ? 'bg-green-600 hover:bg-green-600 shrink-0'
                            : 'bg-gray-500 hover:bg-gray-500 shrink-0'
                      }
                    >
                      {match.isDraw ? 'Draw' : match.won ? 'Won' : 'Lost'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-blue-700">Team A</p>
                      <p className="text-gray-600">{match.teamA.join(', ')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-amber-700">Team B</p>
                      <p className="text-gray-600">{match.teamB.join(', ')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
