import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getPlayers } from '@/lib/actions/players'
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
  
  // Get player balances in batch (optimized to avoid N+1 queries)
  const playerIds = (players || []).map(p => p.id)
  const { getPlayerBalancesBatch } = await import('@/lib/actions/payments')
  const balancesResult = await getPlayerBalancesBatch(playerIds, user.orgId)
  const balancesMap = balancesResult.success && balancesResult.data ? balancesResult.data : new Map()
  
  const playersWithBalances = (players || []).map((player) => {
    const balanceData = balancesMap.get(player.id) || {
      balance: 0,
      credit: 0,
      unpaidBalance: 0,
      totalFeesOwed: 0,
      openingBalancePence: 0,
      totalPaid: 0,
    }
    return {
      ...player,
      balance: balanceData.balance,
      credit: balanceData.credit,
      unpaidBalance: balanceData.unpaidBalance,
      openingBalancePence: balanceData.openingBalancePence,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Players</h1>
        <Button asChild size="sm" className="w-full sm:w-auto">
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
  )
}