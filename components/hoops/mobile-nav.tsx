'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { logout } from '@/lib/actions/auth'
import {
  Menu,
  X,
  LogOut,
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  UserCog
} from 'lucide-react'
import type { UserRole } from '@prisma/client'

interface MobileNavProps {
  user: {
    name: string
    role: UserRole
  }
  currentPath: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, roles: ['admin', 'supervisor'] },
  { name: 'Players', href: '/dashboard/players', icon: Users, roles: ['admin', 'supervisor'] },
  { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar, roles: ['admin', 'supervisor'] },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard, roles: ['admin', 'supervisor'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['admin', 'supervisor'] },
  { name: 'Users', href: '/dashboard/users', icon: UserCog, roles: ['admin'] },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: Shield, roles: ['admin'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'supervisor'] },
]

export function MobileNav({ user, currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(user.role)
  )

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="lg:hidden tap-target"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Logo size="sm" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="tap-target"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <nav className="mt-8 px-4 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = currentPath === item.href

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors tap-target ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
                <form action={logout}>
                  <Button type="submit" variant="ghost" size="sm" className="tap-target">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}