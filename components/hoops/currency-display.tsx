import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'

interface CurrencyDisplayProps {
  amountPence: number
  className?: string
  showSign?: boolean
}

export function CurrencyDisplay({ 
  amountPence, 
  className,
  showSign = false 
}: CurrencyDisplayProps) {
  const isPositive = amountPence > 0
  const isNegative = amountPence < 0
  const isZero = amountPence === 0

  return (
    <span className={cn(
      'tabular-nums font-medium',
      {
        'text-success': isPositive && showSign,
        'text-destructive': isNegative && showSign,
        'text-gray-600': isZero,
      },
      className
    )}>
      {showSign && isPositive && '+'}
      {formatCurrency(amountPence)}
    </span>
  )
}