import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getPlayers } from '@/lib/actions/players'
import { MatchResultForm } from '@/components/hoops/match-result-form'

export default async function NewMatchPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth')
  }

  const playersResult = await getPlayers()
  const players = playersResult.success ? playersResult.data : []

  return (
    <AdminLayout currentPath="/dashboard/matches">
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
    </AdminLayout>
  )
}
