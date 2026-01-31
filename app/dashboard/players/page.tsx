import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getPlayers } from '@/lib/actions/players'
import { getPlayerBalance } from '@/lib/actions/payments'
import Link from 'next/link'
import { PlayersList } from '@/components/hoops/players-list'

export default async function PlayersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Fetch players data
  const playersResult = await getPlayers()
  const players = playersResult.success ? playersResult.data : []
  
  // Get player balances (in parallel for performance)
  const playersWithBalances = await Promise.all(
    (players || []).map(async (player) => {
      const balanceResult = await getPlayerBalance(player.id)
      const balance = balanceResult.success ? balanceResult.data?.balance || 0 : 0
      const credit = balanceResult.success ? balanceResult.data?.credit || 0 : 0
      const unpaidBalance = balanceResult.success ? balanceResult.data?.unpaidBalance || 0 : 0
      return { ...player, balance, credit, unpaidBalance }
    })
  )

  return (
    <AdminLayout currentPath="/dashboard/players">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Players</h1>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/players/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <PlayersList 
              players={playersWithBalances} 
              currency={user.org?.currency || 'GBP'}
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}