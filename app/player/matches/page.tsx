import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  PlayerMatchHistoryClient,
  type SerializedPlayerMatch,
} from '@/components/hoops/player-match-history-client'
import { PlayerRefreshButton } from '@/components/hoops/player-refresh-button'

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
    .map((mp) => {
      const isDraw = mp.match.winningTeam === 'DRAW'
      return {
        match: mp.match,
        won: !isDraw && mp.match.winningTeam === mp.team,
        isDraw,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.match.createdAt).getTime() -
        new Date(a.match.createdAt).getTime()
    )

  const wins = matchHistory.filter((m) => m.won).length
  const draws = matchHistory.filter((m) => m.isDraw).length
  const losses = matchHistory.length - wins - draws

  const serialized: SerializedPlayerMatch[] = matchHistory.map(
    ({ match, won, isDraw }) => ({
      id: match.id,
      createdAt: match.createdAt.toISOString(),
      won,
      isDraw,
      teamA: match.matchPlayers
        .filter((mp) => mp.team === 'A')
        .map((mp) => mp.player.name),
      teamB: match.matchPlayers
        .filter((mp) => mp.team === 'B')
        .map((mp) => mp.player.name),
      winningTeam: match.winningTeam,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      label: match.label,
      sessionName: match.session?.name ?? null,
      sessionStartsAt: match.session?.startsAt?.toISOString() ?? null,
    })
  )

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Match history
        </h1>
        <PlayerRefreshButton label="Refresh matches" />
      </div>
      {serialized.length > 0 && (
        <p className="text-gray-600 mb-6">
          {wins} wins{draws > 0 ? `, ${draws} draws` : ''}, {losses} losses
        </p>
      )}

      <PlayerMatchHistoryClient matches={serialized} />
    </>
  )
}
