'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Mail, Phone, Search, Users } from 'lucide-react'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { PlayerActionsDropdown } from '@/app/dashboard/players/player-actions-dropdown'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, MailPlus } from 'lucide-react'
import { emailBulkBalanceRemindersToAdmin } from '@/lib/actions/balance-reminders'

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

function canEmailReminder(player: PlayerWithBalance): boolean {
  return !!(player.phone && player.unpaidBalance > 0)
}

export function PlayersList({ players, currency }: PlayersListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bulkPending, setBulkPending] = useState(false)
  const router = useRouter()

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

  const selectablePlayers = useMemo(
    () => filteredPlayers.filter(canEmailReminder),
    [filteredPlayers]
  )
  const selectedCount = selectedIds.size

  function toggleSelect(playerId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  function selectAllSelectable() {
    if (selectedIds.size === selectablePlayers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(selectablePlayers.map((p) => p.id)))
    }
  }

  async function handleBulkEmailReminders() {
    if (selectedCount === 0) return
    setBulkPending(true)
    setBulkMessage(null)
    const result = await emailBulkBalanceRemindersToAdmin([...selectedIds])
    setBulkPending(false)
    if (result.success) {
      setBulkMessage({ type: 'success', text: result.message || `Emailed ${result.results?.filter((r) => r.included).length ?? 0} reminder(s) to you` })
      setSelectedIds(new Set())
    } else {
      setBulkMessage({ type: 'error', text: result.error || 'Failed to email reminders' })
    }
    setTimeout(() => setBulkMessage(null), 5000)
  }

  return (
    <div className="space-y-4">
      {/* Bulk actions bar */}
      {selectablePlayers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEmailReminders}
            disabled={bulkPending || selectedCount === 0}
          >
            <MailPlus className="w-4 h-4 mr-2" />
            {bulkPending ? 'Sending...' : `Email reminders to me${selectedCount > 0 ? ` (${selectedCount})` : ''}`}
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkPending}
            >
              Clear selection
            </Button>
          )}
          {bulkMessage && (
            <p className={`text-sm ${bulkMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {bulkMessage.text}
            </p>
          )}
        </div>
      )}

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
              <TableHead className="w-12">
                {selectablePlayers.length > 0 && (
                  <input
                    type="checkbox"
                    checked={selectedCount === selectablePlayers.length && selectablePlayers.length > 0}
                    onChange={selectAllSelectable}
                    className="rounded border-gray-300"
                    aria-label="Select all with phone and unpaid balance"
                  />
                )}
              </TableHead>
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
                <TableCell colSpan={8} className="text-center py-12">
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
                <TableRow 
                  key={player.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('[data-action-dropdown]') || target.closest('[data-reminder-checkbox]')) {
                      return
                    }
                    router.push(`/dashboard/players/${player.id}`)
                  }}
                >
                  <TableCell
                    className="w-12"
                    onClick={(e) => e.stopPropagation()}
                    data-reminder-checkbox
                  >
                    {canEmailReminder(player) ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(player.id)}
                        onChange={() => toggleSelect(player.id)}
                        className="rounded border-gray-300"
                        aria-label={`Select ${player.name} for reminder`}
                      />
                    ) : null}
                  </TableCell>
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
                  <TableCell 
                    className="w-[100px]"
                    onClick={(e) => e.stopPropagation()}
                    data-action-dropdown
                  >
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
            <div 
              key={player.id} 
              className="border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('[data-action-dropdown]') || target.closest('[data-reminder-checkbox]')) {
                  return
                }
                router.push(`/dashboard/players/${player.id}`)
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {canEmailReminder(player) && (
                    <div
                      className="flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      data-reminder-checkbox
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(player.id)}
                        onChange={() => toggleSelect(player.id)}
                        className="rounded border-gray-300"
                        aria-label={`Select ${player.name} for reminder`}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{player.name}</h3>
                  {player.notes && (
                    <p className="text-sm text-gray-500 truncate">{player.notes}</p>
                  )}
                  </div>
                </div>
                <div 
                  onClick={(e) => e.stopPropagation()}
                  data-action-dropdown
                >
                  <PlayerActionsDropdown player={player} />
                </div>
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
