import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileSearch,
  ClipboardCheck,
  AlertTriangle,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  X,
  Building2,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAdmin } from '@/context/AdminContext'

interface AdminSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const { unreadNotificationsCount: unreadCount, adminProfile } = useAdmin()

  const navItems = [
    { label: 'Dashboard Overview', path: '/admin', end: true, icon: LayoutDashboard },
    { label: 'Student Management', path: '/admin/students', icon: Users },
    { label: 'Academic Records', path: '/admin/academic-records', icon: GraduationCap },
    { label: 'Document Review', path: '/admin/documents', icon: FileSearch },
    { label: 'Verification Requests', path: '/admin/verifications', icon: ClipboardCheck },
    { label: 'Data Quality', path: '/admin/data-quality', icon: AlertTriangle },
    {
      label: 'Notifications',
      path: '/admin/notifications',
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { label: 'Analytics & Export', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
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
          'fixed lg:sticky top-0 z-40 flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white px-3 py-4 transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="space-y-4 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    APAAR <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CONNECT</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Admin Portal</p>
              </div>
            </Link>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Institution Card */}
          <div className="mx-1 rounded-xl p-3 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-purple-50/70 border border-blue-100">
            <div className="flex items-start gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Building2 size={15} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-bold text-slate-900 leading-tight line-clamp-2">
                  {adminProfile.institutionName}
                </p>
                <p className="text-[10px] font-mono text-blue-600 mt-0.5">Code: {adminProfile.institutionCode}</p>
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-blue-100/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500 truncate max-w-[120px]">{adminProfile.name}</span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">
                {adminProfile.role}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Admin Workspace
            </div>
            <nav className="space-y-0.5">
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
                        'flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all group',
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-100/80 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon size={16} className="shrink-0 transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-purple-100 text-purple-700 px-1.5 py-px text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer: Disclaimer + Logout */}
        <div className="space-y-2 border-t border-slate-100 pt-3 px-1">
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-[10px] text-amber-700 leading-relaxed">
            ⚠️ Synthetic demonstration data. Backend integration required for live use.
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
