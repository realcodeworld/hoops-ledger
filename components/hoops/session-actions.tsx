"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trash2, XCircle } from "lucide-react"
import { deleteSession } from "@/lib/actions/sessions"
import { SessionCancelDialog } from "@/components/hoops/session-cancel-dialog"
import { SessionMoreMenu } from "@/components/hoops/session-more-menu"

interface SessionWithAttendanceCount {
  id: string
  _count?: {
    attendance: number
  }
}

export function SessionActions({ session }: { session: SessionWithAttendanceCount }) {
  const [isCancelOpen, setIsCancelOpen] = useState(false)

  const hasAttendees = (session._count?.attendance ?? 0) > 0

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="h-9">
        <Link href={`/dashboard/sessions/${session.id}`}>View</Link>
      </Button>

      <SessionMoreMenu sessionId={session.id} hasAttendees={hasAttendees} className="sm:hidden" />

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
          <Button variant="outline" size="sm" className="h-9" onClick={() => setIsCancelOpen(true)}>
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
        {hasAttendees && <p className="text-xs text-gray-500">Cannot delete a session with attendees.</p>}
      </div>

      <SessionCancelDialog open={isCancelOpen} onOpenChange={setIsCancelOpen} sessionId={session.id} />
    </div>
  )
}
