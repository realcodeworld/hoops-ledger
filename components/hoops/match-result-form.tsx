'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchablePlayerSelect } from '@/components/hoops/searchable-player-select'
import { Trophy, Plus, X } from 'lucide-react'
import { createMatchResult } from '@/lib/actions/matches'

interface Player {
  id: string
  name: string
  email: string | null
  isActive: boolean
  pricingRule?: { name: string; feePence: number } | null
}

interface MatchResultFormProps {
  sessionId: string
  players: Player[]
  /** Optional: only show players who attended this session */
  attendeeIds?: string[]
}

export function MatchResultForm({
  sessionId,
  players,
  attendeeIds,
}: MatchResultFormProps) {
  const router = useRouter()
  const [teamAIds, setTeamAIds] = useState<string[]>([])
  const [teamBIds, setTeamBIds] = useState<string[]>([])
  const [winningTeam, setWinningTeam] = useState<'A' | 'B'>('A')
  const [label, setLabel] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedIds = [...teamAIds, ...teamBIds]
  const availablePlayers = attendeeIds
    ? players.filter((p) => attendeeIds.includes(p.id) && !selectedIds.includes(p.id))
    : players.filter((p) => !selectedIds.includes(p.id))

  const addToTeamA = (playerId: string) => {
    if (!teamAIds.includes(playerId) && !teamBIds.includes(playerId)) {
      setTeamAIds((prev) => [...prev, playerId])
    }
  }
  const addToTeamB = (playerId: string) => {
    if (!teamAIds.includes(playerId) && !teamBIds.includes(playerId)) {
      setTeamBIds((prev) => [...prev, playerId])
    }
  }
  const removeFromTeamA = (playerId: string) => {
    setTeamAIds((prev) => prev.filter((id) => id !== playerId))
  }
  const removeFromTeamB = (playerId: string) => {
    setTeamBIds((prev) => prev.filter((id) => id !== playerId))
  }

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? id

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const result = await createMatchResult(
        sessionId,
        teamAIds,
        teamBIds,
        winningTeam,
        label.trim() || undefined
      )
      if (!result.success) {
        setError(result.error ?? 'Failed to record match')
        return
      }
      setTeamAIds([])
      setTeamBIds([])
      setWinningTeam('A')
      setLabel('')
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-primary" />
          Record match result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Team A</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {teamAIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                  >
                    {getPlayerName(id)}
                    <button
                      type="button"
                      onClick={() => removeFromTeamA(id)}
                      className="hover:bg-blue-200 rounded p-0.5"
                      aria-label={`Remove ${getPlayerName(id)} from Team A`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <SearchablePlayerSelect
                players={availablePlayers}
                placeholder="Add to Team A"
                onSelect={addToTeamA}
              />
            </div>
            <div className="space-y-2">
              <Label>Team B</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {teamBIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-sm"
                  >
                    {getPlayerName(id)}
                    <button
                      type="button"
                      onClick={() => removeFromTeamB(id)}
                      className="hover:bg-amber-200 rounded p-0.5"
                      aria-label={`Remove ${getPlayerName(id)} from Team B`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <SearchablePlayerSelect
                players={availablePlayers}
                placeholder="Add to Team B"
                onSelect={addToTeamB}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-[140px]">
              <Label htmlFor="winner">Winner</Label>
              <Select
                value={winningTeam}
                onValueChange={(v) => setWinningTeam(v as 'A' | 'B')}
              >
                <SelectTrigger id="winner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Team A</SelectItem>
                  <SelectItem value="B">Team B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 min-w-[160px]">
              <Label htmlFor="label">Label (e.g. Game 1)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isPending || teamAIds.length === 0 || teamBIds.length === 0}>
            {isPending ? 'Saving...' : 'Save match result'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
