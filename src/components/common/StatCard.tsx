import React from 'react'
import { Card } from './Card'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
  description?: string
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose'
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  description,
  color = 'blue',
}) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900',
  }

  return (
    <Card hoverEffect className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
            {title}
          </p>
          <h4 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {value}
          </h4>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {description}
            </p>
          )}
          {change && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                  trend === 'down' && 'text-rose-600 dark:text-rose-400',
                  trend === 'neutral' && 'text-slate-500'
                )}
              >
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {change}
              </span>
              <span className="text-[11px] text-slate-400">vs last cycle</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
            colorMap[color]
          )}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}
