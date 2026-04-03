"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Clock, MapPin, Users, Trash2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, formatTime } from "@/lib/utils"
import { SwipeableRow } from "@/components/hoops/swipeable-row"
import { SessionCancelDialog } from "@/components/hoops/session-cancel-dialog"
import { SessionDeleteConfirmDialog } from "@/components/hoops/session-delete-confirm-dialog"
import { SessionActions } from "@/components/hoops/session-actions"
import { SessionMoreMenu } from "@/components/hoops/session-more-menu"

export type SessionListItem = {
  id: string
  name: string | null
  startsAt: Date | string
  endsAt: Date | string | null
  venue: string | null
  notes: string | null
  _count: { attendance: number }
}

function SessionRowBody({ session }: { session: SessionListItem }) {
  const title = session.name || formatDate(session.startsAt)
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 truncate">{title}</p>
        <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500 gap-x-4 gap-y-1">
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1 shrink-0" aria-hidden />
            {formatTime(session.startsAt)}
            {session.endsAt ? ` - ${formatTime(session.endsAt)}` : null}
          </span>
          {session.venue ? (
            <span className="flex items-center min-w-0">
              <MapPin className="w-4 h-4 mr-1 shrink-0" aria-hidden />
              <span className="truncate">{session.venue}</span>
            </span>
          ) : null}
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1 shrink-0" aria-hidden />
            {session._count.attendance} attending
          </span>
        </div>
        {session.notes ? (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            <span className="font-medium text-gray-700">Notes:</span> {session.notes}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function SessionSwipeRow({
  session,
  swipedOpenId,
  onSwipeOpen,
  onUnderlayDialogOpen,
}: {
  session: SessionListItem
  swipedOpenId: string | null
  onSwipeOpen: (id: string) => void
  onUnderlayDialogOpen: () => void
}) {
  const hasAttendees = session._count.attendance > 0
  const [swipeCancelOpen, setSwipeCancelOpen] = useState(false)
  const [swipeDeleteOpen, setSwipeDeleteOpen] = useState(false)

  const openCancelFromUnderlay = () => {
    onUnderlayDialogOpen()
    setSwipeCancelOpen(true)
  }

  const openDeleteFromUnderlay = () => {
    onUnderlayDialogOpen()
    setSwipeDeleteOpen(true)
  }

  return (
    <>
      <SwipeableRow
        rowId={session.id}
        exclusiveOpenId={swipedOpenId}
        onSwipeOpen={onSwipeOpen}
        leftUnderlay={
          <div className="flex h-full w-full bg-red-600">
            <Button
              type="button"
              variant="ghost"
              className="h-full w-full rounded-none text-white hover:bg-red-700 hover:text-white"
              disabled={hasAttendees}
              aria-label={hasAttendees ? "Cannot delete: session has attendees" : "Delete session"}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                if (!hasAttendees) openDeleteFromUnderlay()
              }}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        }
        rightUnderlay={
          <div className="flex h-full w-full bg-slate-600">
            <Button
              type="button"
              variant="ghost"
              className="h-full w-full rounded-none text-white hover:bg-slate-700 hover:text-white"
              aria-label="Cancel session"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                openCancelFromUnderlay()
              }}
            >
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        }
      >
        <div className="flex w-full min-w-0 items-stretch touch-pan-y">
          <Link
            href={`/dashboard/sessions/${session.id}`}
            className="flex-1 min-w-0 block py-3 pl-3 pr-2 active:scale-[0.99] transition-transform"
          >
            <SessionRowBody session={session} />
          </Link>
          <div className="flex items-start pt-2 pr-2 shrink-0">
            <SessionMoreMenu sessionId={session.id} hasAttendees={hasAttendees} />
          </div>
        </div>
      </SwipeableRow>
      <SessionCancelDialog open={swipeCancelOpen} onOpenChange={setSwipeCancelOpen} sessionId={session.id} />
      <SessionDeleteConfirmDialog
        open={swipeDeleteOpen}
        onOpenChange={setSwipeDeleteOpen}
        sessionId={session.id}
        disabled={hasAttendees}
      />
    </>
  )
}

export function SessionsSwipeList({ sessions }: { sessions: SessionListItem[] }) {
  const [swipedOpenId, setSwipedOpenId] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setSwipedOpenId(null)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const onUnderlayDialogOpen = () => {
    setSwipedOpenId(null)
  }

  return (
    <ul
      className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white overflow-hidden [overscroll-behavior-x:contain] touch-pan-y"
      aria-label="Sessions list"
    >
      {sessions.map((session) => (
        <li key={session.id} className="bg-white">
          <div className="hidden md:flex flex-col gap-3 py-4 px-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <SessionRowBody session={session} />
            </div>
            <SessionActions session={session} />
          </div>
          <div className="md:hidden">
            <SessionSwipeRow
              session={session}
              swipedOpenId={swipedOpenId}
              onSwipeOpen={(id) => setSwipedOpenId(id)}
              onUnderlayDialogOpen={onUnderlayDialogOpen}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
