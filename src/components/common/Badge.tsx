import React from 'react'
import { cn } from '@/utils/cn'
import type { VerificationStatus } from '@/types'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: VerificationStatus | 'default' | 'info'
  variant?: 'subtle' | 'solid'
  dot?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  status = 'default',
  variant = 'subtle',
  dot = false,
  ...props
}) => {
  const statusStyles: Record<string, { subtle: string; solid: string; dotColor: string }> = {
    verified: {
      subtle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
      solid: 'bg-emerald-600 text-white',
      dotColor: 'bg-emerald-500',
    },
    pending: {
      subtle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
      solid: 'bg-amber-500 text-white',
      dotColor: 'bg-amber-500',
    },
    flagged: {
      subtle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
      solid: 'bg-rose-600 text-white',
      dotColor: 'bg-rose-500',
    },
    rejected: {
      subtle: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      solid: 'bg-slate-600 text-white',
      dotColor: 'bg-slate-400',
    },
    info: {
      subtle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
      solid: 'bg-blue-600 text-white',
      dotColor: 'bg-blue-500',
    },
    default: {
      subtle: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      solid: 'bg-slate-700 text-white',
      dotColor: 'bg-slate-400',
    },
  }

  const currentConfig = statusStyles[status] || statusStyles.default
  const styleClass = variant === 'solid' ? currentConfig.solid : `${currentConfig.subtle} border`

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors',
        styleClass,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', currentConfig.dotColor)} />}
      {children}
    </span>
  )
}
