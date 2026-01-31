'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, Check } from 'lucide-react'
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

interface SearchablePlayerSelectProps {
  players: Player[]
  placeholder?: string
  onSelect: (playerId: string) => void | Promise<void>
  className?: string
}

export function SearchablePlayerSelect({ 
  players, 
  placeholder = "Select a player to add to session",
  onSelect,
  className 
}: SearchablePlayerSelectProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery, filteredPlayers.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      inputRef.current?.focus()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = async (playerId: string) => {
    if (playerId) {
      await onSelect(playerId)
      setSearchQuery('')
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredPlayers[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredPlayers[selectedIndex].id)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredPlayers.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn("text-left", !searchQuery && "text-muted-foreground")}>
          {searchQuery || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-8 h-8"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredPlayers.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-gray-500">
                {searchQuery ? 'No players found' : 'No players available'}
              </div>
            ) : (
              filteredPlayers.map((player, index) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleSelect(player.id)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-50 focus:bg-gray-100",
                    index === selectedIndex && "bg-gray-100"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {index === selectedIndex && <Check className="h-4 w-4" />}
                  </span>
                  {player.name} ({player.pricingRule?.name || 'No Category'})
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
