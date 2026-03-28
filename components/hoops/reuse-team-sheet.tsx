'use client'

import { Users } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { ReuseTeamOption } from '@/lib/match-reuse-options'
import { squadKey } from '@/lib/match-reuse-options'

export type { ReuseTeamOption }

export interface ReuseTeamSheetPlayer {
  id: string
  name: string
}

function playerNamesLine(playerIds: string[], players: ReuseTeamSheetPlayer[]): string {
  return playerIds
    .map((id) => players.find((p) => p.id === id)?.name ?? id)
    .join(', ')
}

interface ReuseTeamSheetProps {
  options: ReuseTeamOption[]
  /** Used to show player names for each line-up */
  players: ReuseTeamSheetPlayer[]
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Which slot on the current form to fill (not the historical side). */
  onSelect: (targetSlot: 'A' | 'B', playerIds: string[]) => void
}

export function ReuseTeamSheet({
  options,
  players,
  open,
  onOpenChange,
  onSelect,
}: ReuseTeamSheetProps) {
  const handleSelect = (targetSlot: 'A' | 'B', playerIds: string[]) => {
    onSelect(targetSlot, playerIds)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 gap-0" aria-label="Reuse a team from this session">
        <SheetHeader className="px-4 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Reuse a team from this session
          </SheetTitle>
        </SheetHeader>

        <div
          className="flex-1 overflow-y-auto overscroll-contain min-h-0"
          aria-label="Previous teams"
        >
          {options.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Users className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No previous teams to reuse</p>
            </div>
          ) : (
            <div className="divide-y">
              {options.map((opt, index) => (
                <div
                  key={`${opt.label}-${opt.sourceSide}-${squadKey(opt.playerIds)}-${index}`}
                  className="px-4 py-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <span className="font-medium text-gray-900 block">
                        {opt.label} (was Team {opt.sourceSide})
                      </span>
                      <p className="text-sm text-gray-600 leading-snug break-words">
                        {playerNamesLine(opt.playerIds, players)}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 tabular-nums shrink-0 pt-0.5">
                      {opt.playerIds.length} player{opt.playerIds.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 min-h-10"
                      onClick={() => handleSelect('A', opt.playerIds)}
                    >
                      Use as Team A
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 min-h-10"
                      onClick={() => handleSelect('B', opt.playerIds)}
                    >
                      Use as Team B
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
