"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteSession } from "@/lib/actions/sessions"

type SessionDeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  disabled?: boolean
}

export function SessionDeleteConfirmDialog({
  open,
  onOpenChange,
  sessionId,
  disabled = false,
}: SessionDeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete session?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Only sessions with no attendees can be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={disabled}
            onClick={async () => {
              if (!disabled) {
                await deleteSession(sessionId)
                onOpenChange(false)
                window.location.reload()
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Delete session
          </Button>
          <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
