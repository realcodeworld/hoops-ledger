import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AdminLayout } from '@/components/hoops/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Plus, Search, Mail, Phone, Shield, Link as LinkIcon } from 'lucide-react'
import { getPlayers } from '@/lib/actions/players'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { getPlayerBalance } from '@/lib/actions/payments'
import Link from 'next/link'
import { PlayerActionsDropdown } from './player-actions-dropdown'

export default async function PlayersPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Fetch players data
  const playersResult = await getPlayers()
  const players = playersResult.success ? playersResult.data : []
  
  // Calculate summary stats
  const totalPlayers = players?.length || 0
  const activePlayers = players?.filter(p => p.isActive).length || 0
  const playersWithEmail = players?.filter(p => p.email).length || 0
  const exemptPlayers = players?.filter(p => p.isExempt).length || 0

  // Get player balances (in parallel for performance)
  const playersWithBalances = await Promise.all(
    (players || []).map(async (player) => {
      const balanceResult = await getPlayerBalance(player.id)
      const balance = balanceResult.success ? balanceResult.data?.balance || 0 : 0
      return { ...player, balance }
    })
  )

  return (
    <AdminLayout currentPath="/dashboard/players">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Players</h1>
          </div>
          <div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/players/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Link>
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlayers}</div>
              <p className="text-xs text-muted-foreground">
                {activePlayers} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playersWithEmail}</div>
              <p className="text-xs text-muted-foreground">
                Can receive magic links
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exempt Players</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{exemptPlayers}</div>
              <p className="text-xs text-muted-foreground">
                No fees charged
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Student:</span>
                  <span>{(players || []).filter(p => p.pricingRule?.name?.toLowerCase().includes('student')).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard:</span>
                  <span>{(players || []).filter(p => p.pricingRule?.name?.toLowerCase().includes('standard')).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span>{(players || []).filter(p => p.pricingRule?.name?.toLowerCase().includes('guest')).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <CardTitle>Player Directory</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search players..."
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playersWithBalances.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {player.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {player.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <CategoryBadge
                            categoryName={player.pricingRule?.name || 'No Category'}
                            feePence={player.pricingRule?.feePence}
                            currency={user.org?.currency || 'GBP'}
                          />
                          {player.isExempt && (
                            <Badge variant="exempt">Exempt</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {player.email ? (
                            <div className="flex items-center text-sm">
                              <Mail className="w-3 h-3 mr-1" />
                              <span className="truncate max-w-[150px]">{player.email}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">No email</div>
                          )}
                          {player.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-3 h-3 mr-1" />
                              <span>{player.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActivityBadge isActive={player.isActive} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <CurrencyDisplay
                          amountPence={player.balance}
                          showSign
                          className={player.balance > 0 ? 'text-warning' : player.balance < 0 ? 'text-success' : ''}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {player._count.attendance}
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <PlayerActionsDropdown player={player} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {playersWithBalances.map((player) => (
                <div key={player.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{player.name}</h3>
                      {player.notes && (
                        <p className="text-sm text-gray-500 truncate">{player.notes}</p>
                      )}
                    </div>
                    <PlayerActionsDropdown player={player} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Category</div>
                      <div className="flex items-center space-x-1 mt-1">
                        <CategoryBadge
                          categoryName={player.pricingRule?.name || 'No Category'}
                          feePence={player.pricingRule?.feePence}
                          currency={user.org?.currency || 'GBP'}
                        />
                        {player.isExempt && (
                          <Badge variant="exempt">Exempt</Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500">Status</div>
                      <div className="mt-1">
                        <ActivityBadge isActive={player.isActive} />
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500">Balance</div>
                      <div className="mt-1 font-medium">
                        <CurrencyDisplay
                          amountPence={player.balance}
                          showSign
                          className={player.balance > 0 ? 'text-warning' : player.balance < 0 ? 'text-success' : ''}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500">Sessions</div>
                      <div className="mt-1 font-medium">{player._count.attendance}</div>
                    </div>
                  </div>

                  {(player.email || player.phone) && (
                    <div className="pt-2 border-t">
                      <div className="text-gray-500 text-sm mb-1">Contact</div>
                      <div className="space-y-1">
                        {player.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-2" />
                            <span className="truncate">{player.email}</span>
                          </div>
                        )}
                        {player.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-2" />
                            <span>{player.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {(players?.length || 0) === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No players yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start building your club by adding your first player.
                </p>
                <Button asChild>
                  <Link href="/dashboard/players/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Player
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}