"use client"

import { useState } from "react"
import Link from "next/link"
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
import { Edit, MoreVertical, Trash2 } from "lucide-react"
import { MatchDeleteConfirmDialog } from "@/components/hoops/match-delete-confirm-dialog"
import { cn } from "@/lib/utils"

type MatchMoreMenuProps = {
  matchId: string
  triggerClassName?: string
  className?: string
}

export function MatchMoreMenu({ matchId, triggerClassName, className }: MatchMoreMenuProps) {
  const [manageOpen, setManageOpen] = useState(false)
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
            aria-label="More match actions"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-full max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Manage match</AlertDialogTitle>
            <AlertDialogDescription>Choose an action for this match.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <Button variant="outline" className="w-full justify-center h-10" asChild>
                <Link href={`/dashboard/matches/${matchId}/edit`} onClick={() => setManageOpen(false)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit match
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-center h-10 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => {
                  setManageOpen(false)
                  setDeleteOpen(true)
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete match
              </Button>
              <AlertDialogCancel className="w-full justify-center h-10 mt-0">Close</AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <MatchDeleteConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} matchId={matchId} />
    </div>
  )
}
