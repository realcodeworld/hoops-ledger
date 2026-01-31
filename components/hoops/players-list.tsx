'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Mail, Phone, Search, Users } from 'lucide-react'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { PlayerActionsDropdown } from '@/app/dashboard/players/player-actions-dropdown'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface PlayerWithBalance {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
  isActive: boolean
  isExempt: boolean
  pricingRule?: {
    name: string
    feePence: number
  } | null
  _count: {
    attendance: number
    payments: number
  }
  balance: number
  credit: number
  unpaidBalance: number
}

interface PlayersListProps {
  players: PlayerWithBalance[]
  currency: string
}

export function PlayersList({ players, currency }: PlayersListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return players
    }

    const query = searchQuery.toLowerCase().trim()
    return players.filter((player) => {
      const nameMatch = player.name.toLowerCase().includes(query)
      const emailMatch = player.email?.toLowerCase().includes(query) || false
      const phoneMatch = player.phone?.toLowerCase().includes(query) || false
      const notesMatch = player.notes?.toLowerCase().includes(query) || false
      
      return nameMatch || emailMatch || phoneMatch || notesMatch
    })
  }, [players, searchQuery])

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search players by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

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
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">
                    {searchQuery ? 'No players found matching your search' : 'No players yet'}
                  </p>
                  {!searchQuery && (
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/players/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
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
                        currency={currency}
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
                    {player.credit > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">In Credit</span>
                        <CurrencyDisplay
                          amountPence={player.credit}
                          className="text-green-600"
                        />
                      </div>
                    ) : player.unpaidBalance > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">Amount Due</span>
                        <CurrencyDisplay
                          amountPence={player.unpaidBalance}
                          className="text-red-600"
                        />
                      </div>
                    ) : (
                      <CurrencyDisplay
                        amountPence={0}
                        className="text-gray-500"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {player._count.attendance}
                  </TableCell>
                  <TableCell className="w-[100px]">
                    <PlayerActionsDropdown player={player} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery ? 'No players found matching your search' : 'No players yet'}
            </p>
            {!searchQuery && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/players/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Link>
              </Button>
            )}
          </div>
        ) : (
          filteredPlayers.map((player) => (
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
                      currency={currency}
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
                  {player.credit > 0 ? (
                    <>
                      <div className="text-gray-500">In Credit</div>
                      <div className="mt-1 font-medium">
                        <CurrencyDisplay
                          amountPence={player.credit}
                          className="text-green-600"
                        />
                      </div>
                    </>
                  ) : player.unpaidBalance > 0 ? (
                    <>
                      <div className="text-gray-500">Amount Due</div>
                      <div className="mt-1 font-medium">
                        <CurrencyDisplay
                          amountPence={player.unpaidBalance}
                          className="text-red-600"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-500">Balance</div>
                      <div className="mt-1 font-medium">
                        <CurrencyDisplay
                          amountPence={0}
                          className="text-gray-500"
                        />
                      </div>
                    </>
                  )}
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
          ))
        )}
      </div>
    </div>
  )
}
