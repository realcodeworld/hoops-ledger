import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export default async function PlayerMatchesPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/')

  const playerData = await prisma.player.findUnique({
    where: { id: player.id },
    include: {
      matchPlayers: {
        include: {
          match: {
            include: {
              session: { select: { id: true, name: true, startsAt: true } },
              matchPlayers: {
                include: { player: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { match: { createdAt: 'desc' as const } },
      },
    },
  })
  if (!playerData) redirect('/')

  const matchHistory = (playerData.matchPlayers ?? [])
    .map((mp) => ({
      match: mp.match,
      won: mp.match.winningTeam === mp.team,
    }))
    .sort(
      (a, b) =>
        new Date(b.match.createdAt).getTime() -
        new Date(a.match.createdAt).getTime()
    )

  const wins = matchHistory.filter((m) => m.won).length
  const losses = matchHistory.length - wins

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Match history
      </h1>
      {matchHistory.length > 0 && (
        <p className="text-gray-600 mb-6">
          {wins} wins, {losses} losses
        </p>
      )}

      {matchHistory.length === 0 ? (
        <p className="text-gray-500 text-sm">No matches yet</p>
      ) : (
        <div className="space-y-4">
          {matchHistory.map(({ match, won }) => {
            const teamAPlayers = match.matchPlayers.filter((mp) => mp.team === 'A')
            const teamBPlayers = match.matchPlayers.filter((mp) => mp.team === 'B')
            const winnerLabel = match.winningTeam === 'A' ? 'Team A' : 'Team B'
            const hasScore =
              match.teamAScore != null && match.teamBScore != null
            const scoreBracket = hasScore
              ? ` [${match.teamAScore}–${match.teamBScore}]`
              : ''
            const titleLabel = match.label ? ` ${match.label}` : ''
            const cardTitle = `Match${titleLabel}: ${winnerLabel} won${scoreBracket}`
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
                        {match.session && (
                          <>
                            {' · '}
                            {match.session.name ||
                              format(new Date(match.session.startsAt), 'dd/MM/yy')}
                          </>
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={won ? 'default' : 'secondary'}
                      className={
                        won
                          ? 'bg-green-600 hover:bg-green-600 shrink-0'
                          : 'bg-gray-500 hover:bg-gray-500 shrink-0'
                      }
                    >
                      {won ? 'Won' : 'Lost'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
