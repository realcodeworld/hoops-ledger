'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CreditCard, Gamepad2, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/player/dashboard', label: 'Home', icon: Home },
  { href: '/player/payments', label: 'Payments', icon: CreditCard },
  { href: '/player/matches', label: 'Matches', icon: Gamepad2 },
  { href: '/player/leaderboard', label: 'Leaderboard', icon: Trophy },
] as const

export function PlayerBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white md:relative md:bottom-auto md:border-t-0 md:bg-transparent"
      aria-label="Player navigation"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-around px-2 md:justify-start md:gap-1 md:px-4">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-[64px] flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors md:min-w-0 md:flex-row md:gap-2 md:rounded-md md:px-3 md:py-2 md:text-sm',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-5 w-5 shrink-0 md:h-4 md:w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
