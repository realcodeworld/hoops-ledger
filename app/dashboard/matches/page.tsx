import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Gamepad2, Plus } from 'lucide-react'
import { getMatches } from '@/lib/actions/matches'
import Link from 'next/link'
import { MatchesIndexList } from '@/components/hoops/matches-index-list'

export default async function MatchesPage() {
  const result = await getMatches()
  const matches = (result.success && result.data ? result.data : []) ?? []

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
        <MatchesIndexList matches={matches} />
      )}
    </div>
  )
}
