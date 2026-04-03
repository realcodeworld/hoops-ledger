"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cancelSession } from "@/lib/actions/sessions"

type SessionCancelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}

export function SessionCancelDialog({ open, onOpenChange, sessionId }: SessionCancelDialogProps) {
  const [cancelReason, setCancelReason] = useState("")

  useEffect(() => {
    if (!open) setCancelReason("")
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Cancel session</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You can optionally add a note explaining why this session is cancelled.
          </p>
          <Textarea
            name="reason"
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={async () => {
                await cancelSession(sessionId, cancelReason.trim() || undefined)
                onOpenChange(false)
                setCancelReason("")
                window.location.reload()
              }}
            >
              Mark as cancelled
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
