import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getPlayers } from '@/lib/actions/players'
import { MatchResultForm } from '@/components/hoops/match-result-form'

export default async function NewMatchPage() {
  const playersResult = await getPlayers()
  const players = playersResult.success ? playersResult.data : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/matches">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">New match</h1>

      <MatchResultForm players={players || []} />
    </div>
  )
}
