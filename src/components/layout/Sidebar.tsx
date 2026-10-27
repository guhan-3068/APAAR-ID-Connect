import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  BarChart3, 
  Home, 
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const navLinks = [
    { label: 'Overview', path: '/', icon: Home },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'APAAR Verification', path: '/verification', icon: UserCheck, badge: 'Live' },
    { label: 'Student Registry', path: '/students', icon: Users },
    { label: 'AICTE Analytics', path: '/analytics', icon: BarChart3 },
  ]

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed lg:sticky top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-4 transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Main Menu
            </div>
            <nav className="space-y-1">
              {navLinks.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all group',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-blue-100 dark:bg-blue-900/80 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>

          {/* Quick AICTE Compliance Status widget in Sidebar */}
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
              <Sparkles size={15} className="text-blue-600 animate-pulse" />
              <span>AICTE One-Nation Registry</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Automated Permanent Academic Account Registry sync active with DigiLocker ABC.
            </p>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-blue-100 dark:border-blue-900/40 text-[11px]">
              <span className="text-slate-500">Sync Status:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Footer info within sidebar */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 px-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldAlert size={14} className="text-amber-500" />
              SIH Edition 2024-25
            </span>
            <a
              href="https://www.aicte-india.org"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="AICTE Portal"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
