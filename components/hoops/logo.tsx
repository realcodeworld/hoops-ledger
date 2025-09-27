import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      <div className={cn(
        'bg-orange-500 rounded-full flex items-center justify-center shadow-lg',
        sizeClasses[size]
      )}>
        <Circle className={cn('text-white', iconSizes[size])} />
      </div>
      {showText && (
        <span className={cn(
          'font-bold text-gray-900',
          textSizes[size]
        )}>
          HoopsLedger
        </span>
      )}
    </div>
  )
}