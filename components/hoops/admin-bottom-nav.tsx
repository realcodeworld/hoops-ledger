'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Users,
  Calendar,
  CreditCard,
  MoreHorizontal,
  Gamepad2,
  Trophy,
  Settings,
  UserCog,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { UserRole } from '@prisma/client'

interface AdminBottomNavProps {
  userRole: UserRole
}

const primaryItems = [
  { href: '/dashboard', label: 'Home', icon: BarChart3 },
  { href: '/dashboard/players', label: 'Players', icon: Users },
  { href: '/dashboard/sessions', label: 'Sessions', icon: Calendar },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
] as const

const moreItems = [
  { href: '/dashboard/matches', label: 'Matches', icon: Gamepad2, roles: ['admin', 'supervisor'] },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['admin', 'supervisor'] },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'supervisor'] },
  { href: '/dashboard/users', label: 'Users', icon: UserCog, roles: ['admin'] },
  { href: '/dashboard/audit', label: 'Audit Logs', icon: Shield, roles: ['admin'] },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin', 'supervisor'] },
] as const

export function AdminBottomNav({ userRole }: AdminBottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const filteredMoreItems = moreItems.filter((item) =>
    (item.roles as readonly string[]).includes(userRole)
  )

  const isMoreActive = filteredMoreItems.some((item) => pathname.startsWith(item.href))

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:relative lg:bottom-auto lg:border-t-0 lg:bg-transparent"
        aria-label="Admin navigation"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-around px-2 lg:justify-start lg:gap-1 lg:px-4">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex min-w-[56px] flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors lg:min-w-0 lg:flex-row lg:gap-2 lg:rounded-md lg:px-3 lg:py-2 lg:text-sm',
                  isActive
                    ? 'text-primary font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
                <span className="truncate">{label}</span>
              </Link>
            )
          })}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex min-w-[56px] flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors lg:min-w-0 lg:flex-row lg:gap-2 lg:rounded-md lg:px-3 lg:py-2 lg:text-sm',
              isMoreActive
                ? 'text-primary font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <MoreHorizontal className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <nav className="mt-4 grid grid-cols-3 gap-2 pb-4">
            {filteredMoreItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-xl p-4 text-xs transition-colors',
                    isActive
                      ? 'bg-orange-50 text-primary font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
