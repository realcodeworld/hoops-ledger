import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gamepad2, Plus, Calendar, Trophy } from 'lucide-react'
import { getMatches } from '@/lib/actions/matches'
import { formatMatchOutcome } from '@/lib/match-outcome'
import { formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function MatchesPage() {
  const result = await getMatches()
  const matches = result.success && result.data ? result.data : []

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Matches</h1>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/dashboard/matches/new">
              <Plus className="w-4 h-4 mr-2" />
              New match
            </Link>
          </Button>
        </div>

        {(matches?.length || 0) === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gamepad2 className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-6">No matches yet</p>
              <Button asChild size="sm" className="w-full sm:w-auto">
                <Link href="/dashboard/matches/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New match
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const teamAPlayers = match.matchPlayers.filter((mp) => mp.team === 'A')
              const teamBPlayers = match.matchPlayers.filter((mp) => mp.team === 'B')
              const winnerLabel = formatMatchOutcome(match.winningTeam)
              const hasScore = match.teamAScore != null && match.teamBScore != null
              const scoreBracket = hasScore
                ? ` [${match.teamAScore}–${match.teamBScore}]`
                : ''
              const titleLabel = match.label ? ` ${match.label}` : ''
              const outcomeSuffix =
                match.winningTeam === 'DRAW' ? '' : ' 🥇'
              const cardTitle = `Match${titleLabel}: ${winnerLabel}${outcomeSuffix}${scoreBracket}`
              return (
                <Card key={match.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center text-lg">
                          <Trophy className="w-5 h-5 mr-2 text-primary" />
                          {cardTitle}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(match.createdAt)}
                          {match.session && (
                            <>
                              {' · '}
                              <Link
                                href={`/dashboard/sessions/${match.session.id}`}
                                className="text-orange-600 hover:underline inline-flex items-center gap-1"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                {match.session.name || formatDateTime(match.session.startsAt)}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/matches/${match.id}`}>View</Link>
                      </Button>
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
    </div>
  )
}
