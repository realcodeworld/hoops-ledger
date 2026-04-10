'use client'

import { useState, useMemo } from 'react'
import { PricingRuleVersion } from '@prisma/client'
import { Search, Check, Users, Loader2 } from 'lucide-react'
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
import { addMultiplePlayersToSession } from '@/lib/actions/attendance'
import { resolveFeePenceFromVersionsAt } from '@/lib/pricing-rule-version-shared'
import { cn } from '@/lib/utils'
import { getCategoryBadgeClass } from '@/lib/format'

interface Player {
  id: string
  name: string
  email: string | null
  isActive: boolean
  pricingRule?: {
    name: string
    feePence: number
    versions?: PricingRuleVersion[]
  } | null
}

interface BulkAddPlayersSheetProps {
  sessionId: string
  sessionStartsAt: Date
  players: Player[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkAddPlayersSheet({
  sessionId,
  sessionStartsAt,
  players,
  open,
  onOpenChange,
}: BulkAddPlayersSheetProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return players
    }
    const query = searchQuery.toLowerCase().trim()
    return players.filter((player) => {
      const nameMatch = player.name.toLowerCase().includes(query)
      const emailMatch = player.email?.toLowerCase().includes(query) || false
      const categoryMatch = player.pricingRule?.name.toLowerCase().includes(query) || false
      return nameMatch || emailMatch || categoryMatch
    })
  }, [players, searchQuery])

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredPlayers.map((p) => p.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return

    setIsSubmitting(true)
    try {
      const result = await addMultiplePlayersToSession(sessionId, Array.from(selectedIds))
      if (result.success) {
        onOpenChange(false)
        setSelectedIds(new Set())
        setSearchQuery('')
        window.location.reload()
      } else {
        console.error('Failed to add players:', result.error)
      }
    } catch (error) {
      console.error('Failed to add players:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedIds(new Set())
      setSearchQuery('')
    }
    onOpenChange(open)
  }

  const selectedCount = selectedIds.size
  const allFilteredSelected = filteredPlayers.length > 0 && 
    filteredPlayers.every((p) => selectedIds.has(p.id))

  const getProjectedFeePence = (player: Player) => {
    if (!player.pricingRule) return null
    return resolveFeePenceFromVersionsAt(
      player.pricingRule.versions,
      new Date(sessionStartsAt),
      player.pricingRule.feePence
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col p-0 gap-0">
        <SheetHeader className="px-4 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Add Players
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
            <span className="text-sm text-gray-500">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          role="listbox"
          aria-label="Available players"
          aria-multiselectable="true"
        >
          {filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No players found' : 'No players available'}
              </p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredPlayers.map((player) => {
                const isSelected = selectedIds.has(player.id)
                return (
                  <button
                    key={player.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => togglePlayer(player.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 min-h-[56px] text-left transition-colors",
                      "active:bg-gray-100",
                      isSelected 
                        ? "bg-primary/10 border-l-4 border-l-primary" 
                        : "border-l-4 border-l-transparent hover:bg-gray-50"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-medium text-gray-900 truncate">
                        {player.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={cn("text-xs", getCategoryBadgeClass(player.pricingRule?.name || 'No Category'))}>
                          {player.pricingRule?.name || 'No Category'}
                        </Badge>
                        {player.pricingRule && (
                          <span className="text-xs text-gray-500 tabular-nums">
                            £{((getProjectedFeePence(player) ?? player.pricingRule.feePence) / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isSelected 
                        ? "bg-primary text-white" 
                        : "bg-gray-200"
                    )}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            size="lg"
            className="w-full h-12 text-base"
            disabled={selectedCount === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Players...
              </>
            ) : selectedCount === 0 ? (
              'Select players to add'
            ) : (
              `Add ${selectedCount} Player${selectedCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
