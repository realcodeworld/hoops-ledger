'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteUser } from '@/lib/actions/users'
import { useRouter } from 'next/navigation'

interface DeleteUserButtonProps {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'Failed to delete user')
        setShowConfirm(false)
      }
    })
  }

  return (
    <>
      {!showConfirm ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? 'Deleting...' : 'Confirm?'}
        </Button>
      )}
    </>
  )
}
