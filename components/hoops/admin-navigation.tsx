'use client'

import Link from 'next/link'
import {
  Users,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  UserCog
} from 'lucide-react'
import type { UserRole } from '@prisma/client'

interface AdminNavigationProps {
  currentPath: string
  userRole?: UserRole
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

export function AdminNavigation({ currentPath, userRole = 'supervisor' }: AdminNavigationProps) {
  const filteredNavigation = navigation.filter(item =>
    item.roles.includes(userRole)
  )
  return (
    <nav className="flex-1 px-4 pb-4 space-y-1">
      {filteredNavigation.map((item) => {
        const Icon = item.icon
        const isActive = currentPath === item.href

        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
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
  )
}