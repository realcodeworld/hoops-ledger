'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CopyRow } from '@/components/hoops/player-bank-details-card'

export function MagicLinkResultDialog({
  open,
  onOpenChange,
  url,
  playerName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  playerName: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Magic link ready</DialogTitle>
          <DialogDescription>
            Share this link with {playerName}. It expires in 15 minutes and can only be used once.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-gray-200 bg-slate-50/90 px-3 py-1">
          <CopyRow label="Magic link" value={url} mono breakAll />
        </div>
      </DialogContent>
    </Dialog>
  )
}
