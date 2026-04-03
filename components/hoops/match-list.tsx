'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Trophy } from 'lucide-react'
import type { MatchTeam } from '@prisma/client'
import { SwipeableRow } from '@/components/hoops/swipeable-row'
import { MatchDeleteConfirmDialog } from '@/components/hoops/match-delete-confirm-dialog'
import { MatchMoreMenu } from '@/components/hoops/match-more-menu'
import { MatchRowTeams } from '@/components/hoops/match-row-teams'
import { formatMatchCardTitle } from '@/lib/match-list-display'

interface MatchPlayer {
  id: string
  team: MatchTeam
  player: { id: string; name: string }
}

interface MatchWithPlayers {
  id: string
  winningTeam: MatchTeam
  teamATotalPoints: number
  teamBTotalPoints: number
  teamAScore: number | null
  teamBScore: number | null
  label: string | null
  createdAt: Date
  matchPlayers: MatchPlayer[]
}

interface MatchListProps {
  sessionId: string
  matches: MatchWithPlayers[]
}

export function MatchList({ sessionId: _sessionId, matches }: MatchListProps) {
  const [swipedOpenId, setSwipedOpenId] = useState<string | null>(null)
  const [swipeDeleteOpen, setSwipeDeleteOpen] = useState(false)
  const [swipeDeleteMatchId, setSwipeDeleteMatchId] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setSwipedOpenId(null)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openDeleteFromSwipe = (matchId: string) => {
    setSwipedOpenId(null)
    setSwipeDeleteMatchId(matchId)
    setSwipeDeleteOpen(true)
  }

  if (matches.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-primary" />
          Match results ({matches.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul
          className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden [overscroll-behavior-x:contain] touch-pan-y"
          aria-label="Match results list"
        >
          {matches.map((match, index) => {
            const cardTitle = formatMatchCardTitle(match, index)
            return (
              <li key={match.id} className="bg-white">
                <div className="hidden md:block p-4 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-medium text-gray-900">{cardTitle}</p>
                      <MatchRowTeams matchPlayers={match.matchPlayers} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm" className="h-9">
                        <Link href={`/dashboard/matches/${match.id}`}>View</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="h-9">
                        <Link href={`/dashboard/matches/${match.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setSwipeDeleteMatchId(match.id)
                          setSwipeDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="md:hidden">
                  <SwipeableRow
                    rowId={match.id}
                    exclusiveOpenId={swipedOpenId}
                    onSwipeOpen={(id) => setSwipedOpenId(id)}
                    leftUnderlay={
                      <div className="flex h-full w-full bg-red-600">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-full w-full rounded-none text-white hover:bg-red-700 hover:text-white"
                          aria-label="Delete match"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            openDeleteFromSwipe(match.id)
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    }
                    rightUnderlay={
                      <div className="flex h-full w-full bg-slate-600">
                        <Button variant="ghost" className="h-full w-full rounded-none p-0 hover:bg-slate-700" asChild>
                          <Link
                            href={`/dashboard/matches/${match.id}/edit`}
                            className="flex items-center justify-center text-white"
                            aria-label="Edit match"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Pencil className="w-5 h-5" />
                          </Link>
                        </Button>
                      </div>
                    }
                  >
                    <div className="flex w-full min-w-0 items-stretch touch-pan-y">
                      <Link
                        href={`/dashboard/matches/${match.id}`}
                        className="flex-1 min-w-0 block py-3 pl-3 pr-2 active:scale-[0.99] transition-transform space-y-2"
                      >
                        <p className="font-medium text-gray-900">{cardTitle}</p>
                        <MatchRowTeams matchPlayers={match.matchPlayers} />
                      </Link>
                      <div className="flex items-start pt-2 pr-2 shrink-0">
                        <MatchMoreMenu matchId={match.id} />
                      </div>
                    </div>
                  </SwipeableRow>
                </div>
              </li>
            )
          })}
        </ul>
        {swipeDeleteMatchId ? (
          <MatchDeleteConfirmDialog
            open={swipeDeleteOpen}
            onOpenChange={(open) => {
              setSwipeDeleteOpen(open)
              if (!open) setSwipeDeleteMatchId(null)
            }}
            matchId={swipeDeleteMatchId}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
