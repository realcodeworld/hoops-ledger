"use client"

import { useRouter } from "next/navigation"
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
import { deleteMatch } from "@/lib/actions/matches"

type MatchDeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  matchId: string
}

export function MatchDeleteConfirmDialog({ open, onOpenChange, matchId }: MatchDeleteConfirmDialogProps) {
  const router = useRouter()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-full max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this match?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the match result and the points awarded to the winning team. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={async () => {
              const result = await deleteMatch(matchId)
              if (!result.success) {
                alert(result.error || "Failed to delete match")
                return
              }
              onOpenChange(false)
              router.refresh()
            }}
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Delete match
          </Button>
          <AlertDialogCancel className="w-full mt-0">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
