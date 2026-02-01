import { redirect, notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, ArrowLeft, Calendar, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getMatchDetail } from '@/lib/actions/matches'
import { formatDateTime } from '@/lib/utils'
import { DeleteMatchButton } from './delete-match-button'

interface MatchDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const { id } = await params
  const result = await getMatchDetail(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const match = result.data
  const teamAPlayers = match.matchPlayers.filter((mp) => mp.team === 'A')
  const teamBPlayers = match.matchPlayers.filter((mp) => mp.team === 'B')
  const winnerLabel = match.winningTeam === 'A' ? 'Team A' : 'Team B'
  const hasScore = match.teamAScore != null && match.teamBScore != null
  const scoreBracket = hasScore
    ? ` [${match.teamAScore}–${match.teamBScore}]`
    : ''
  const titleLabel = match.label ? ` ${match.label}` : ''
  const pageTitle = `Match${titleLabel}: ${winnerLabel} 🥇${scoreBracket}`

  return (
    <AdminLayout currentPath="/dashboard/matches">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/dashboard/matches">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matches
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/matches/${match.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
            <DeleteMatchButton matchId={match.id} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Trophy className="w-8 h-8 mr-2 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{formatDateTime(match.createdAt)}</p>
          {match.session && (
            <p className="text-sm mt-2">
              <Link
                href={`/dashboard/sessions/${match.session.id}`}
                className="text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <Calendar className="w-4 h-4" />
                {match.session.name || formatDateTime(match.session.startsAt)}
              </Link>
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium text-blue-700 mb-2">Team A</p>
                <p className="text-gray-600">
                  {teamAPlayers.map((mp) => mp.player.name).join(', ')}
                </p>
              </div>
              <div>
                <p className="font-medium text-amber-700 mb-2">Team B</p>
                <p className="text-gray-600">
                  {teamBPlayers.map((mp) => mp.player.name).join(', ')}
                </p>
              </div>
            </div>
            <p className="mt-4 font-medium text-green-700">Winner: {winnerLabel}</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
