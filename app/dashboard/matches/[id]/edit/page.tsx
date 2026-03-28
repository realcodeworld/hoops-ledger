import { notFound } from 'next/navigation'
import { getMatchDetail, getSessionMatches } from '@/lib/actions/matches'
import { buildReuseOptionsFromMatches, type ReuseTeamOption } from '@/lib/match-reuse-options'
import { getSessions } from '@/lib/actions/sessions'
import { getPlayers } from '@/lib/actions/players'
import { MatchEditForm } from './match-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface MatchEditPageProps {
  params: Promise<{ id: string }>
}

export default async function MatchEditPage({ params }: MatchEditPageProps) {
  const { id } = await params
  const matchResult = await getMatchDetail(id)

  if (!matchResult.success || !matchResult.data) {
    notFound()
  }

  const match = matchResult.data

  const [sessionsResult, playersResult] = await Promise.all([
    getSessions(),
    getPlayers(),
  ])

  const sessions = sessionsResult.success ? sessionsResult.data ?? [] : []
  const players = playersResult.success ? playersResult.data ?? [] : []

  let previousMatches: ReuseTeamOption[] = []
  if (match.sessionId) {
    const sessionMatchesResult = await getSessionMatches(match.sessionId)
    if (sessionMatchesResult.success && sessionMatchesResult.data) {
      previousMatches = buildReuseOptionsFromMatches(sessionMatchesResult.data, {
        excludeMatchId: match.id,
      })
    }
  }
  const teamAPlayerIds = match.matchPlayers
    .filter((mp) => mp.team === 'A')
    .map((mp) => mp.playerId)
  const teamBPlayerIds = match.matchPlayers
    .filter((mp) => mp.team === 'B')
    .map((mp) => mp.playerId)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/matches/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Match
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit match</h1>

      <MatchEditForm
        matchId={match.id}
        currentLabel={match.label}
        currentSessionId={match.sessionId}
        currentTeamAScore={match.teamAScore}
        currentTeamBScore={match.teamBScore}
        currentWinningTeam={match.winningTeam}
        currentTeamAPlayerIds={teamAPlayerIds}
        currentTeamBPlayerIds={teamBPlayerIds}
        sessions={sessions}
        players={players}
        previousMatches={previousMatches}
      />
    </div>
  )
}
