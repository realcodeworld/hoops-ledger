"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Trash2, XCircle } from "lucide-react"
import { SessionCancelDialog } from "@/components/hoops/session-cancel-dialog"
import { SessionDeleteConfirmDialog } from "@/components/hoops/session-delete-confirm-dialog"
import { cn } from "@/lib/utils"

type SessionMoreMenuProps = {
  sessionId: string
  hasAttendees: boolean
  triggerClassName?: string
  /** e.g. hide on desktop when row uses other chrome */
  className?: string
}

export function SessionMoreMenu({ sessionId, hasAttendees, triggerClassName, className }: SessionMoreMenuProps) {
  const [manageOpen, setManageOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className={cn(className)}>
      <AlertDialog open={manageOpen} onOpenChange={setManageOpen}>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("h-9 w-9 shrink-0", triggerClassName)}
            aria-label="More session actions"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-full max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Manage session</AlertDialogTitle>
            <AlertDialogDescription>Choose an action for this session.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center h-10"
                onClick={() => {
                  setManageOpen(false)
                  setCancelOpen(true)
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel session
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                disabled={hasAttendees}
                onClick={() => {
                  setManageOpen(false)
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete session
              </Button>
              {hasAttendees && (
                <p className="text-xs text-gray-500 text-center">You can only delete sessions with no attendees.</p>
              )}
              <AlertDialogCancel className="w-full justify-center h-10 mt-0">Close</AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SessionCancelDialog open={cancelOpen} onOpenChange={setCancelOpen} sessionId={sessionId} />
      <SessionDeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        sessionId={sessionId}
        disabled={hasAttendees}
      />
    </div>
  )
}
