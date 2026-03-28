'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TeamPlayerSelectSheet } from '@/components/hoops/team-player-select-sheet'
import { ReuseTeamSheet, type ReuseTeamOption } from '@/components/hoops/reuse-team-sheet'
import { updateMatch } from '@/lib/actions/matches'
import { formatDate } from '@/lib/utils'
import { X, Users, Copy } from 'lucide-react'
import type { MatchTeam } from '@prisma/client'

interface Session {
  id: string
  name: string | null
  startsAt: Date
}

interface Player {
  id: string
  name: string
  email: string | null
  isActive: boolean
  pricingRule?: { name: string; feePence: number } | null
}

interface MatchEditFormProps {
  matchId: string
  currentLabel: string | null
  currentSessionId: string | null
  currentTeamAScore: number | null
  currentTeamBScore: number | null
  currentWinningTeam: MatchTeam
  currentTeamAPlayerIds: string[]
  currentTeamBPlayerIds: string[]
  sessions: Session[]
  players: Player[]
  /** Other matches in the same session (when editing a session-linked match) */
  previousMatches?: ReuseTeamOption[]
}

export function MatchEditForm({
  matchId,
  currentLabel,
  currentSessionId,
  currentTeamAScore,
  currentTeamBScore,
  currentWinningTeam,
  currentTeamAPlayerIds,
  currentTeamBPlayerIds,
  sessions,
  players,
  previousMatches = [],
}: MatchEditFormProps) {
  const router = useRouter()
  const [label, setLabel] = useState(currentLabel ?? '')
  const [sessionId, setSessionId] = useState(currentSessionId ?? '')
  const [teamAScore, setTeamAScore] = useState(
    currentTeamAScore != null ? String(currentTeamAScore) : ''
  )
  const [teamBScore, setTeamBScore] = useState(
    currentTeamBScore != null ? String(currentTeamBScore) : ''
  )
  const [teamAIds, setTeamAIds] = useState<string[]>(currentTeamAPlayerIds)
  const [teamBIds, setTeamBIds] = useState<string[]>(currentTeamBPlayerIds)
  const [winningTeam, setWinningTeam] = useState<MatchTeam>(currentWinningTeam)
  const [teamASheetOpen, setTeamASheetOpen] = useState(false)
  const [teamBSheetOpen, setTeamBSheetOpen] = useState(false)
  const [reuseSheetOpen, setReuseSheetOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const showReuse = previousMatches.length > 0

  const availableForTeamA = players.filter((p) => !teamBIds.includes(p.id))
  const availableForTeamB = players.filter((p) => !teamAIds.includes(p.id))
  const allAssigned =
    players.length > 0 &&
    players.every((p) => teamAIds.includes(p.id) || teamBIds.includes(p.id))

  const removeFromTeamA = (playerId: string) => {
    setTeamAIds((prev) => prev.filter((id) => id !== playerId))
  }
  const removeFromTeamB = (playerId: string) => {
    setTeamBIds((prev) => prev.filter((id) => id !== playerId))
  }

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
      const scoreA = teamAScore.trim() ? parseInt(teamAScore, 10) : null
      const scoreB = teamBScore.trim() ? parseInt(teamBScore, 10) : null
      const result = await updateMatch(matchId, {
        label: label.trim() || null,
        sessionId: sessionId || null,
        teamAScore: scoreA != null && !Number.isNaN(scoreA) ? scoreA : null,
        teamBScore: scoreB != null && !Number.isNaN(scoreB) ? scoreB : null,
        teamAPlayerIds: teamAIds,
        teamBPlayerIds: teamBIds,
        winningTeam,
      })
      if (!result.success) {
        setError(result.error ?? 'Failed to update match')
        return
      }
      router.push(`/dashboard/matches/${matchId}`)
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showReuse && (
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[48px] h-12"
              onClick={() => setReuseSheetOpen(true)}
              disabled={isPending}
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
                onValueChange={(v) => setWinningTeam(v as MatchTeam)}
                disabled={isPending}
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
            <div className="space-y-2">
              <Label htmlFor="label">Label (e.g. Game 1)</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Optional"
                disabled={isPending}
                className="min-w-[160px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamAScore">Team A score</Label>
              <Input
                id="teamAScore"
                type="number"
                min={0}
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                placeholder="Optional"
                disabled={isPending}
                className="min-w-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamBScore">Team B score</Label>
              <Input
                id="teamBScore"
                type="number"
                min={0}
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                placeholder="Optional"
                disabled={isPending}
                className="min-w-[100px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionId">Session (optional)</Label>
            <select
              id="sessionId"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">None</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || formatDate(s.startsAt)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">Link this match to a session or leave as standalone.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={isPending || teamAIds.length === 0 || teamBIds.length === 0}
          >
            {isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
