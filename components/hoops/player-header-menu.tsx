'use client'

import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { logout } from '@/lib/actions/auth'

interface PlayerHeaderMenuProps {
  playerName: string
}

export function PlayerHeaderMenu({ playerName }: PlayerHeaderMenuProps) {
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    setOpen(false)
    await logout()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-64 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">{playerName}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-gray-700"
              onClick={() => setOpen(false)}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
