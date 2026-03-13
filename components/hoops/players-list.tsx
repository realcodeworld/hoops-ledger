'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Phone, Search, Users, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, X } from 'lucide-react'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { PlayerActionsDropdown } from '@/app/dashboard/players/player-actions-dropdown'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, MailPlus } from 'lucide-react'
import { emailBulkBalanceRemindersToAdmin } from '@/lib/actions/balance-reminders'

type SortKey = 'name' | 'category' | 'status' | 'balance' | 'sessions'
type SortDir = 'asc' | 'desc'

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
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bulkPending, setBulkPending] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const router = useRouter()

  const activeFilterCount = [
    statusFilter !== 'all',
    categoryFilter !== 'all',
  ].filter(Boolean).length

  const categoryOptions = useMemo(() => {
    const names = new Set(players.map((p) => p.pricingRule?.name ?? 'No Category').filter(Boolean))
    return Array.from(names).sort()
  }, [players])

  const filteredPlayers = useMemo(() => {
    let result = players

    if (statusFilter !== 'all') {
      result = result.filter((p) =>
        statusFilter === 'active' ? p.isActive : !p.isActive
      )
    }
    if (categoryFilter !== 'all') {
      const label = categoryFilter === 'No Category' ? '' : categoryFilter
      result = result.filter((p) => (p.pricingRule?.name ?? 'No Category') === categoryFilter)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((player) => {
        const nameMatch = player.name.toLowerCase().includes(query)
        const emailMatch = player.email?.toLowerCase().includes(query) || false
        const phoneMatch = player.phone?.toLowerCase().includes(query) || false
        const notesMatch = player.notes?.toLowerCase().includes(query) || false
        return nameMatch || emailMatch || phoneMatch || notesMatch
      })
    }

    const sorted = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          break
        case 'category':
          cmp = (a.pricingRule?.name ?? '').localeCompare(b.pricingRule?.name ?? '', undefined, { sensitivity: 'base' })
          break
        case 'status':
          cmp = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0)
          break
        case 'balance':
          cmp = (a.unpaidBalance - a.credit) - (b.unpaidBalance - b.credit)
          break
        case 'sessions':
          cmp = (a._count?.attendance ?? 0) - (b._count?.attendance ?? 0)
          break
        default:
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [players, searchQuery, statusFilter, categoryFilter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortHeader({
    columnKey,
    children,
    className,
  }: {
    columnKey: SortKey
    children: React.ReactNode
    className?: string
  }) {
    const isActive = sortKey === columnKey
    return (
      <button
        type="button"
        onClick={() => handleSort(columnKey)}
        className={`flex items-center gap-1 font-medium hover:text-gray-900 transition-colors ${className ?? ''}`}
      >
        {children}
        {isActive ? (
          sortDir === 'asc' ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )
        ) : (
          <ArrowUpDown className="w-4 h-4 opacity-50" />
        )}
      </button>
    )
  }

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
      {/* Bulk actions bar - only show when players are selected */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">{selectedCount} selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkEmailReminders}
            disabled={bulkPending}
          >
            <MailPlus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{bulkPending ? 'Sending...' : 'Email reminders'}</span>
            <span className="sm:hidden">{bulkPending ? '...' : 'Email'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkPending}
          >
            Clear
          </Button>
          {bulkMessage && (
            <p className={`text-sm ${bulkMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {bulkMessage.text}
            </p>
          )}
        </div>
      )}

      {/* Search and filters */}
      <div className="space-y-3">
        {/* Search row with filter toggle on mobile */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Filter toggle - mobile only */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden relative shrink-0"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filters - always visible on desktop, toggleable on mobile */}
        <div className={cn(
          "flex flex-wrap items-center gap-3",
          !showFilters && "hidden md:flex"
        )}>
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm text-gray-500 whitespace-nowrap">
              Status
            </Label>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}
            >
              <SelectTrigger id="status-filter" className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="category-filter" className="text-sm text-gray-500 whitespace-nowrap">
              Category
            </Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category-filter" className="w-[130px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categoryOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Clear filters button - only show when filters are active */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter('all')
                setCategoryFilter('all')
              }}
              className="text-gray-500 h-8"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
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
              <TableHead>
                <SortHeader columnKey="name">Player</SortHeader>
              </TableHead>
              <TableHead>
                <SortHeader columnKey="category">Category</SortHeader>
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>
                <SortHeader columnKey="status">Status</SortHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortHeader columnKey="balance" className="justify-end">
                  Balance
                </SortHeader>
              </TableHead>
              <TableHead className="text-right">
                <SortHeader columnKey="sessions" className="justify-end">
                  Sessions
                </SortHeader>
              </TableHead>
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
      <div className="md:hidden divide-y divide-gray-100">
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
              className="flex items-center gap-3 py-3 cursor-pointer active:bg-gray-50"
              onClick={(e) => {
                const target = e.target as HTMLElement
                if (target.closest('[data-action-dropdown]') || target.closest('[data-reminder-checkbox]')) {
                  return
                }
                router.push(`/dashboard/players/${player.id}`)
              }}
            >
              {canEmailReminder(player) && (
                <div
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                  data-reminder-checkbox
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(player.id)}
                    onChange={() => toggleSelect(player.id)}
                    className="rounded border-gray-300 w-4 h-4"
                    aria-label={`Select ${player.name} for reminder`}
                  />
                </div>
              )}

              <span className="flex-1 min-w-0 font-medium truncate">{player.name}</span>

              <div className="shrink-0 tabular-nums">
                {player.credit > 0 ? (
                  <span className="text-green-600">
                    +<CurrencyDisplay amountPence={player.credit} />
                  </span>
                ) : player.unpaidBalance > 0 ? (
                  <span className="text-red-600">
                    <CurrencyDisplay amountPence={player.unpaidBalance} />
                  </span>
                ) : (
                  <span className="text-gray-400">–</span>
                )}
              </div>

              <div 
                className="shrink-0 -mr-2"
                onClick={(e) => e.stopPropagation()}
                data-action-dropdown
              >
                <PlayerActionsDropdown player={player} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
