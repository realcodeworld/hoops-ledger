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
import type { UserRole } from '@prisma/client'

interface AdminHeaderMenuProps {
  userName: string
  userRole: UserRole
}

export function AdminHeaderMenu({ userName, userRole }: AdminHeaderMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-64 sm:max-w-xs">
        <SheetHeader>
          <SheetTitle className="text-base font-medium">{userName}</SheetTitle>
          <p className="text-sm text-gray-500 capitalize">{userRole}</p>
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
