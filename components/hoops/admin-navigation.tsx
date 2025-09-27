'use client'

import Link from 'next/link'
import { 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings,
  Shield
} from 'lucide-react'

interface AdminNavigationProps {
  currentPath: string
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Players', href: '/dashboard/players', icon: Users },
  { name: 'Sessions', href: '/dashboard/sessions', icon: Calendar },
  { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Audit Logs', href: '/dashboard/audit', icon: Shield },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function AdminNavigation({ currentPath }: AdminNavigationProps) {
  return (
    <nav className="flex-1 px-4 pb-4 space-y-1">
      {navigation.map((item) => {
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