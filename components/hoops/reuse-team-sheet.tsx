'use client'

import { Users } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface ReuseTeamOption {
  /** e.g. "Game 1" */
  label: string
  team: 'A' | 'B'
  playerIds: string[]
}

interface ReuseTeamSheetProps {
  options: ReuseTeamOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (team: 'A' | 'B', playerIds: string[]) => void
}

export function ReuseTeamSheet({
  options,
  open,
  onOpenChange,
  onSelect,
}: ReuseTeamSheetProps) {
  const handleSelect = (team: 'A' | 'B', playerIds: string[]) => {
    onSelect(team, playerIds)
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
          role="listbox"
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
                <button
                  key={`${opt.label}-${opt.team}-${index}`}
                  type="button"
                  role="option"
                  onClick={() => handleSelect(opt.team, opt.playerIds)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 min-h-[56px] text-left transition-colors',
                    'active:bg-gray-100 hover:bg-gray-50 border-l-4 border-l-transparent'
                  )}
                >
                  <span className="font-medium text-gray-900">
                    {opt.label} – Team {opt.team}
                  </span>
                  <span className="text-sm text-gray-500 tabular-nums">
                    {opt.playerIds.length} player{opt.playerIds.length !== 1 ? 's' : ''}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
