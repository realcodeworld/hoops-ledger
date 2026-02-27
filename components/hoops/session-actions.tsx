"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MoreVertical, Trash2, XCircle } from "lucide-react"
import { deleteSession, cancelSession } from "@/lib/actions/sessions"

interface SessionWithAttendanceCount {
  id: string
  _count?: {
    attendance: number
  }
}

export function SessionActions({ session }: { session: SessionWithAttendanceCount }) {
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  const hasAttendees = (session._count?.attendance ?? 0) > 0

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="h-9">
        <Link href={`/dashboard/sessions/${session.id}`}>
          View
        </Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:hidden"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-full max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Manage session</AlertDialogTitle>
            <AlertDialogDescription>
              Choose an action for this session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="outline"
                className="w-full justify-center h-10"
            onClick={() => {
              setIsCancelOpen(true)
            }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel session
              </Button>
          <AlertDialogAction
            className="w-full justify-center h-10 bg-red-600 hover:bg-red-700"
            disabled={hasAttendees}
            type="button"
            onClick={async () => {
              if (!hasAttendees) {
                await deleteSession(session.id)
                window.location.reload()
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete session
          </AlertDialogAction>
              {hasAttendees && (
                <p className="text-xs text-gray-500 text-center">
                  You can only delete sessions with no attendees.
                </p>
              )}
              <AlertDialogCancel className="w-full justify-center h-10">
                Close
              </AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="hidden sm:flex sm:flex-col sm:items-end sm:gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={hasAttendees}
            onClick={async () => {
              if (!hasAttendees) {
                await deleteSession(session.id)
                window.location.reload()
              }
            }}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setIsCancelOpen(true)}
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
        {hasAttendees && (
          <p className="text-xs text-gray-500">
            Cannot delete a session with attendees.
          </p>
        )}
      </div>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
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
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsCancelOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={async () => {
                  await cancelSession(session.id, cancelReason.trim() || undefined)
                  setIsCancelOpen(false)
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
    </div>
  )
}

