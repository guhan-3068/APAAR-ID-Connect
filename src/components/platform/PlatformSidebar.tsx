import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Activity,
  AlertTriangle,
  History,
  LogOut,
  ShieldCheck,
  X,
  ExternalLink,
  Users,
  BarChart3,
  Bell,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface PlatformSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const PlatformSidebar: React.FC<PlatformSidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()

  const navItems = [
    { label: 'Enrolment Dashboard', path: '/platform', end: true, icon: LayoutDashboard },
    { label: 'Data Validation & Duplicates', path: '/platform/validation', icon: ShieldAlert },
    { label: 'Institution Management', path: '/platform/institutions', icon: Building2 },
    { label: 'Platform Monitoring', path: '/platform/monitoring', icon: Activity },
    { label: 'AI Quality & Anomalies', path: '/platform/quality', icon: AlertTriangle },
    { label: 'Reports & Analytics', path: '/platform/analytics', icon: BarChart3 },
    { label: 'Notifications', path: '/platform/notifications', icon: Bell },
    { label: 'Platform Audit Log', path: '/platform/audit', icon: History },
  ]

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-700 to-blue-700 text-white shadow-md shadow-purple-500/20">
              <ShieldCheck size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900 tracking-tight block">
                APAAR CONNECT
              </span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                PLATFORM ADMIN
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* AICTE National Registry Badge */}
        <div className="mx-4 mt-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/70 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Apex Administration</p>
          <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">AICTE National Portal</p>
          <p className="text-[10px] text-slate-500">Ministry of Education, GoI</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Platform Controls
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-purple-50 text-purple-700 shadow-xs border border-purple-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )
                }
              >
                <Icon size={17} className="shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}

          {/* Quick Role Switcher */}
          <div className="pt-4 mt-4 border-t border-slate-100 px-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Switch Portal Role</p>
            <div className="space-y-1">
              <Link
                to="/admin"
                className="flex items-center justify-between text-xs text-slate-600 hover:text-blue-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={13} className="text-blue-600" /> College Admin
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </Link>
              <Link
                to="/student"
                className="flex items-center justify-between text-xs text-slate-600 hover:text-purple-600 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Users size={13} className="text-purple-600" /> Student Portal
                </span>
                <ExternalLink size={12} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </nav>

        {/* Footer / Sign Out */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>
    </>
  )
}
