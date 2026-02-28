'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface Player {
  id: string
  name: string
  email: string | null
  isActive: boolean
  pricingRule?: {
    name: string
    feePence: number
  } | null
}

interface TeamPlayerSelectSheetProps {
  teamLabel: 'Team A' | 'Team B'
  /** Full player list for name lookup (e.g. for selected IDs not in availablePlayers) */
  players: Player[]
  /** Players eligible to add (e.g. not on the other team; caller filters) */
  availablePlayers: Player[]
  selectedIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (ids: string[]) => void
}

export function TeamPlayerSelectSheet({
  teamLabel,
  players,
  availablePlayers,
  selectedIds,
  open,
  onOpenChange,
  onChange,
}: TeamPlayerSelectSheetProps) {
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set(selectedIds))
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      setSelectedSet(new Set(selectedIds))
      setSearchQuery('')
    }
  }, [open, selectedIds])

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? id

  /** List to display: eligible players + any selected IDs not in eligible (so user can deselect) */
  const displayList = useMemo(() => {
    const availableIds = new Set(availablePlayers.map((p) => p.id))
    const selectedOnly = selectedIds.filter((id) => !availableIds.has(id))
    const selectedOnlyPlayers: Player[] = selectedOnly.map((id) => ({
      id,
      name: players.find((p) => p.id === id)?.name ?? id,
      email: null,
      isActive: true,
      pricingRule: null,
    }))
    return [...availablePlayers, ...selectedOnlyPlayers]
  }, [availablePlayers, selectedIds, players])

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return displayList
    const query = searchQuery.toLowerCase().trim()
    return displayList.filter((player) => {
      const nameMatch = player.name.toLowerCase().includes(query)
      const emailMatch = player.email?.toLowerCase().includes(query) || false
      const categoryMatch = player.pricingRule?.name.toLowerCase().includes(query) || false
      return nameMatch || emailMatch || categoryMatch
    })
  }, [displayList, searchQuery])

  const togglePlayer = (playerId: string) => {
    setSelectedSet((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  const selectAll = () => {
    setSelectedSet(new Set(filteredPlayers.map((p) => p.id)))
  }

  const clearSelection = () => {
    setSelectedSet(new Set())
  }

  const handleDone = () => {
    onChange(Array.from(selectedSet))
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearchQuery('')
    onOpenChange(next)
  }

  const getCategoryBadgeClass = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase()
    if (lowerName.includes('student')) return 'bg-purple-100 text-purple-800'
    if (lowerName.includes('standard')) return 'bg-orange-100 text-orange-800'
    if (lowerName.includes('guest')) return 'bg-yellow-100 text-yellow-800'
    if (lowerName.includes('junior') || lowerName.includes('u17') || lowerName.includes('u18')) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const selectedCount = selectedSet.size
  const allFilteredSelected =
    filteredPlayers.length > 0 && filteredPlayers.every((p) => selectedSet.has(p.id))

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col p-0 gap-0" aria-label={`Select players for ${teamLabel}`}>
        <SheetHeader className="px-4 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {teamLabel} {selectedCount > 0 && `(${selectedCount} selected)`}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        <div className="px-4 py-2 border-b flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={allFilteredSelected ? clearSelection : selectAll}
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 py-1"
          >
            {allFilteredSelected ? (
              <>Clear Selection</>
            ) : (
              <>Select All ({filteredPlayers.length})</>
            )}
          </button>
          {selectedCount > 0 && (
            <span className="text-sm text-gray-500">{selectedCount} selected</span>
          )}
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain min-h-0"
          role="listbox"
          aria-label={`Available players for ${teamLabel}`}
          aria-multiselectable="true"
        >
          {filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No players found' : 'No players available'}
              </p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredPlayers.map((player) => {
                const isSelected = selectedSet.has(player.id)
                return (
                  <button
                    key={player.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => togglePlayer(player.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3.5 min-h-[56px] text-left transition-colors',
                      'active:bg-gray-100',
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'border-l-4 border-l-transparent hover:bg-gray-50'
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-medium text-gray-900 truncate">{player.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          className={cn(
                            'text-xs',
                            getCategoryBadgeClass(player.pricingRule?.name || 'No Category')
                          )}
                        >
                          {player.pricingRule?.name || 'No Category'}
                        </Badge>
                        {player.pricingRule && (
                          <span className="text-xs text-gray-500 tabular-nums">
                            £{(player.pricingRule.feePence / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'bg-primary text-white' : 'bg-gray-200'
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button size="lg" className="w-full h-12 text-base min-h-[48px]" onClick={handleDone}>
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
