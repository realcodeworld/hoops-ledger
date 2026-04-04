'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import {
  Link as LinkIcon,
  Mail,
  MailPlus,
  Phone,
  Plus,
  Search,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { CategoryBadge, ActivityBadge } from '@/components/hoops/status-badge'
import { CurrencyDisplay } from '@/components/hoops/currency-display'
import { PlayerActionsDropdown } from '@/app/dashboard/players/player-actions-dropdown'
import { Button } from '@/components/ui/button'
import { emailBulkBalanceRemindersToAdmin } from '@/lib/actions/balance-reminders'
import { generateMagicLink } from '@/lib/actions/auth'
import { SwipeableRow } from '@/components/hoops/swipeable-row'

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
  openingBalancePence?: number
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
  const [swipedPlayerOpenId, setSwipedPlayerOpenId] = useState<string | null>(null)
  const [magicPendingId, setMagicPendingId] = useState<string | null>(null)
  const [copyToast, setCopyToast] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setSwipedPlayerOpenId(null)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSwipeMagicLink(player: PlayerWithBalance) {
    if (!player.email) return
    setMagicPendingId(player.id)
    try {
      const result = await generateMagicLink(player.id)
      if (result.success) {
        const linkText = result.url || ''
        try {
          await navigator.clipboard.writeText(linkText)
          setCopyToast(`Magic link copied for ${player.name} (15 min, one use)`)
          setTimeout(() => setCopyToast(null), 3500)
        } catch {
          alert(
            `Copy failed. Magic link:\n\n${linkText}\n\nShare with ${player.name}. Expires in 15 minutes, one use.`
          )
        }
      } else {
        alert(`Failed to generate magic link: ${result.error}`)
      }
    } catch {
      alert('Failed to generate magic link')
    } finally {
      setMagicPendingId(null)
    }
    setSwipedPlayerOpenId(null)
  }

  function toggleReminderFromSwipe(playerId: string) {
    toggleSelect(playerId)
    setSwipedPlayerOpenId(null)
  }

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
      {copyToast && (
        <div
          className="md:hidden fixed bottom-20 left-1/2 z-[150] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-center text-sm text-white shadow-lg"
          role="status"
        >
          {copyToast}
        </div>
      )}
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

        {/* Mobile: select all eligible for balance reminders (phone + unpaid) */}
        {selectablePlayers.length > 0 && (
          <div className="md:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center"
              onClick={selectAllSelectable}
            >
              {selectedCount === selectablePlayers.length && selectablePlayers.length > 0
                ? `Deselect all (${selectablePlayers.length})`
                : `Select all for reminders (${selectablePlayers.length})`}
            </Button>
            <p className="text-xs text-gray-500 mt-1.5 px-0.5">
              Swipe right on a row for the same toggle. Reminders email you a summary per selected player.
            </p>
          </div>
        )}
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
            <SwipeableRow
              key={player.id}
              rowId={player.id}
              exclusiveOpenId={swipedPlayerOpenId}
              onSwipeOpen={(id) => setSwipedPlayerOpenId(id)}
              leftWidth={96}
              rightWidth={96}
              leftUnderlay={
                <div
                  className={cn(
                    'flex h-full w-full',
                    canEmailReminder(player) ? 'bg-emerald-600' : 'bg-gray-400'
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-full w-full rounded-none text-white hover:bg-black/15 hover:text-white disabled:opacity-60"
                    disabled={!canEmailReminder(player)}
                    aria-label={
                      canEmailReminder(player)
                        ? selectedIds.has(player.id)
                          ? `Remove ${player.name} from reminder selection`
                          : `Select ${player.name} for balance reminder email`
                        : 'Reminder selection needs phone and unpaid balance'
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (canEmailReminder(player)) toggleReminderFromSwipe(player.id)
                    }}
                  >
                    <Mail className="w-5 h-5" />
                  </Button>
                </div>
              }
              rightUnderlay={
                <div
                  className={cn(
                    'flex h-full w-full',
                    player.email ? 'bg-slate-700' : 'bg-gray-400'
                  )}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-full w-full rounded-none text-white hover:bg-black/15 hover:text-white disabled:opacity-60"
                    disabled={!player.email || magicPendingId === player.id}
                    aria-label={
                      player.email ? 'Generate magic link and copy to clipboard' : 'No email — magic link unavailable'
                    }
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      if (player.email) void handleSwipeMagicLink(player)
                    }}
                  >
                    <LinkIcon className="w-5 h-5" />
                  </Button>
                </div>
              }
            >
              <div
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 py-3 pl-3 pr-1 touch-pan-y bg-white',
                  selectedIds.has(player.id) && canEmailReminder(player) && 'bg-orange-50/90 ring-2 ring-inset ring-primary/30'
                )}
              >
                <Link
                  href={`/dashboard/players/${player.id}`}
                  className="flex-1 min-w-0 block active:scale-[0.99] transition-transform"
                >
                  <span className="font-medium truncate">{player.name}</span>
                </Link>

                <div className="flex items-center gap-2 shrink-0 pr-0.5">
                  <span className="tabular-nums text-sm text-right min-w-[3.5rem]">
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
                  </span>
                  <div className="relative z-20" data-action-dropdown>
                    <PlayerActionsDropdown player={player} />
                  </div>
                </div>
              </div>
            </SwipeableRow>
          ))
        )}
      </div>
    </div>
  )
}
