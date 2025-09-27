import { Badge } from '@/components/ui/badge'
import { AttendanceStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: AttendanceStatus
}

interface CategoryBadgeProps {
  categoryName: string
  feePence?: number
  currency?: string
}

interface ActivityBadgeProps {
  isActive: boolean
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'GBP': return '£'
    case 'EUR': return '€'
    case 'USD': return '$'
    case 'AUD': return 'A$'
    default: return currency
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    paid: { variant: 'paid' as const, text: 'Paid' },
    unpaid: { variant: 'unpaid' as const, text: 'Unpaid' },
    waived: { variant: 'waived' as const, text: 'Waived' },
    exempt: { variant: 'exempt' as const, text: 'Exempt' },
  }

  const config = statusConfig[status]

  return <Badge variant={config.variant}>{config.text}</Badge>
}

export function CategoryBadge({ categoryName, feePence, currency = 'GBP' }: CategoryBadgeProps) {
  // Handle missing category name
  const safeCategoryName = categoryName || 'No Category'

  // Generate a variant based on common category names, fallback to default
  const getVariant = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('student')) return 'student' as const
    if (lowerName.includes('standard')) return 'standard' as const
    if (lowerName.includes('guest')) return 'guest' as const
    if (lowerName.includes('junior') || lowerName.includes('u17') || lowerName.includes('u18')) return 'student' as const
    return 'default' as const
  }

  const displayText = feePence !== undefined
    ? `${safeCategoryName} (${getCurrencySymbol(currency)}${(feePence / 100).toFixed(2)})`
    : safeCategoryName

  return <Badge variant={getVariant(safeCategoryName)}>{displayText}</Badge>
}

export function ActivityBadge({ isActive }: ActivityBadgeProps) {
  return (
    <Badge variant={isActive ? 'active' : 'inactive'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  )
}