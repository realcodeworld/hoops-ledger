'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, Gamepad2, Trophy, MoreHorizontal, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { logout } from '@/lib/actions/auth'

interface PlayerBottomNavProps {
  playerName: string
}

const items = [
  { href: '/player/dashboard', label: 'Home', icon: Home },
  { href: '/player/payments', label: 'Payments', icon: CreditCard },
  { href: '/player/matches', label: 'Matches', icon: Gamepad2 },
  { href: '/player/leaderboard', label: 'Leaderboard', icon: Trophy },
] as const

export function PlayerBottomNav({ playerName }: PlayerBottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:relative md:bottom-auto md:border-t-0 md:bg-transparent"
        aria-label="Player navigation"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-around px-2 md:justify-start md:gap-1 md:px-4">
          {items.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-w-[72px] flex-col items-center justify-center gap-1.5 py-2 text-[11px] transition-colors md:min-w-0 md:flex-row md:gap-2 md:rounded-md md:px-3 md:py-2 md:text-sm',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-7 w-7 shrink-0 md:h-4 md:w-4" />
                <span>{label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className="flex min-w-[72px] flex-col items-center justify-center gap-1.5 py-2 text-[11px] transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-100 md:min-w-0 md:flex-row md:gap-2 md:rounded-md md:px-3 md:py-2 md:text-sm"
          >
            <MoreHorizontal className="h-7 w-7 shrink-0 md:h-4 md:w-4" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Account</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">{playerName}</p>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
