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
import { TeamPlayerSelectSheet } from '@/components/hoops/team-player-select-sheet'
import { ReuseTeamSheet, type ReuseTeamOption } from '@/components/hoops/reuse-team-sheet'
import { Trophy, Users, X, Copy } from 'lucide-react'
import { createMatchResult } from '@/lib/actions/matches'

interface Player {
  id: string
  name: string
  email: string | null
  isActive: boolean
  pricingRule?: { name: string; feePence: number } | null
}

interface MatchResultFormProps {
  /** When provided, the new match will be linked to this session */
  sessionId?: string | null
  players: Player[]
  /** Optional: only show players who attended this session */
  attendeeIds?: string[]
  /** Optional: teams from previous matches in this session for reuse */
  previousMatches?: ReuseTeamOption[]
}

export function MatchResultForm({
  sessionId,
  players,
  attendeeIds,
  previousMatches = [],
}: MatchResultFormProps) {
  const router = useRouter()
  const [teamAIds, setTeamAIds] = useState<string[]>([])
  const [teamBIds, setTeamBIds] = useState<string[]>([])
  const [winningTeam, setWinningTeam] = useState<'A' | 'B'>('A')
  const [label, setLabel] = useState('')
  const [teamAScore, setTeamAScore] = useState<string>('')
  const [teamBScore, setTeamBScore] = useState<string>('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [teamASheetOpen, setTeamASheetOpen] = useState(false)
  const [teamBSheetOpen, setTeamBSheetOpen] = useState(false)
  const [reuseSheetOpen, setReuseSheetOpen] = useState(false)

  const showReuse = Boolean(sessionId && previousMatches.length > 0)

  const basePool = attendeeIds
    ? players.filter((p) => attendeeIds.includes(p.id))
    : players
  const availableForTeamA = basePool.filter((p) => !teamBIds.includes(p.id))
  const availableForTeamB = basePool.filter((p) => !teamAIds.includes(p.id))

  const removeFromTeamA = (playerId: string) => {
    setTeamAIds((prev) => prev.filter((id) => id !== playerId))
  }
  const removeFromTeamB = (playerId: string) => {
    setTeamBIds((prev) => prev.filter((id) => id !== playerId))
  }

  const allAssigned =
    basePool.length > 0 &&
    basePool.every((p) => teamAIds.includes(p.id) || teamBIds.includes(p.id))

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name ?? id

  const handleReuseSelect = (targetSlot: 'A' | 'B', playerIds: string[]) => {
    const ids = [...playerIds]
    if (targetSlot === 'A') {
      setTeamAIds(ids)
      setTeamBIds((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      setTeamBIds(ids)
      setTeamAIds((prev) => prev.filter((id) => !ids.includes(id)))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsPending(true)
    try {
      const scoreA = teamAScore.trim() ? parseInt(teamAScore, 10) : undefined
      const scoreB = teamBScore.trim() ? parseInt(teamBScore, 10) : undefined
      const result = await createMatchResult(
        teamAIds,
        teamBIds,
        winningTeam,
        label.trim() || undefined,
        sessionId ?? undefined,
        scoreA != null && !Number.isNaN(scoreA) ? scoreA : undefined,
        scoreB != null && !Number.isNaN(scoreB) ? scoreB : undefined
      )
      if (!result.success) {
        setError(result.error ?? 'Failed to record match')
        return
      }
      setTeamAIds([])
      setTeamBIds([])
      setWinningTeam('A')
      setLabel('')
      setTeamAScore('')
      setTeamBScore('')
      router.refresh()
      if (!sessionId && result.data?.id) {
        router.push(`/dashboard/matches/${result.data.id}`)
      }
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
          {showReuse && (
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[48px] h-12"
              onClick={() => setReuseSheetOpen(true)}
            >
              <Copy className="w-4 h-4 mr-2" />
              Reuse a team from this session
            </Button>
          )}
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
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[48px] h-12"
                onClick={() => setTeamASheetOpen(true)}
                disabled={allAssigned}
              >
                <Users className="w-4 h-4 mr-2" />
                Select players for Team A
              </Button>
              {allAssigned && (
                <p className="text-xs text-muted-foreground">
                  All eligible players are already assigned to teams
                </p>
              )}
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
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[48px] h-12"
                onClick={() => setTeamBSheetOpen(true)}
                disabled={allAssigned}
              >
                <Users className="w-4 h-4 mr-2" />
                Select players for Team B
              </Button>
              {allAssigned && (
                <p className="text-xs text-muted-foreground">
                  All eligible players are already assigned to teams
                </p>
              )}
            </div>
          </div>

          <TeamPlayerSelectSheet
            teamLabel="Team A"
            players={players}
            availablePlayers={availableForTeamA}
            selectedIds={teamAIds}
            open={teamASheetOpen}
            onOpenChange={setTeamASheetOpen}
            onChange={setTeamAIds}
          />
          <TeamPlayerSelectSheet
            teamLabel="Team B"
            players={players}
            availablePlayers={availableForTeamB}
            selectedIds={teamBIds}
            open={teamBSheetOpen}
            onOpenChange={setTeamBSheetOpen}
            onChange={setTeamBIds}
          />

          <ReuseTeamSheet
            options={previousMatches}
            open={reuseSheetOpen}
            onOpenChange={setReuseSheetOpen}
            onSelect={handleReuseSelect}
          />

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
            <div className="space-y-2 min-w-[120px]">
              <Label htmlFor="teamAScore">Team A score</Label>
              <Input
                id="teamAScore"
                type="number"
                min={0}
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2 min-w-[120px]">
              <Label htmlFor="teamBScore">Team B score</Label>
              <Input
                id="teamBScore"
                type="number"
                min={0}
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                placeholder="Optional"
              />
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
