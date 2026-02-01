'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trophy, Trash2 } from 'lucide-react'
import { deleteMatch } from '@/lib/actions/matches'
import { useRouter } from 'next/navigation'
import type { MatchTeam } from '@prisma/client'

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

export function MatchList({ sessionId, matches }: MatchListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(matchId: string) {
    setDeletingId(matchId)
    try {
      await deleteMatch(matchId)
      router.refresh()
    } finally {
      setDeletingId(null)
    }
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
      <CardContent>
        <div className="space-y-4">
          {matches.map((match, index) => {
            const teamAPlayers = match.matchPlayers.filter((mp) => mp.team === 'A')
            const teamBPlayers = match.matchPlayers.filter((mp) => mp.team === 'B')
            const winnerLabel = match.winningTeam === 'A' ? 'Team A' : 'Team B'
            const hasScore = match.teamAScore != null && match.teamBScore != null
            const scoreBracket = hasScore
              ? ` [${match.teamAScore}–${match.teamBScore}]`
              : ''
            const titleLabel = match.label ? ` ${match.label}` : ` Game ${index + 1}`
            const cardTitle = `Match${titleLabel}: ${winnerLabel} 🥇${scoreBracket}`

            return (
              <div
                key={match.id}
                className="p-4 rounded-lg border bg-gray-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{cardTitle}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deletingId === match.id}
                      >
                        {deletingId === match.id ? (
                          'Deleting...'
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this match?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the match result and the points
                          awarded to the winning team. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(match.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-blue-700">Team A</p>
                    <p className="text-gray-600">
                      {teamAPlayers.map((mp) => mp.player.name).join(', ')}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Team B</p>
                    <p className="text-gray-600">
                      {teamBPlayers.map((mp) => mp.player.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
