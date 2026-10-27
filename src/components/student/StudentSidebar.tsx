import React from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  User, 
  GraduationCap, 
  FolderArchive, 
  FileCheck2, 
  Bell, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  X,
  Sparkles
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { mockStudentProfile, mockStudentNotifications } from '@/services/studentMockData'

interface StudentSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const unreadCount = mockStudentNotifications.filter((n) => !n.read).length

  const navItems = [
    { label: 'Overview', path: '/student', end: true, icon: LayoutDashboard },
    { label: 'Student Profile', path: '/student/profile', icon: User },
    { label: 'Academic Records', path: '/student/records', icon: GraduationCap },
    { label: 'Document Management', path: '/student/documents', icon: FolderArchive },
    { label: 'Verification Requests', path: '/student/requests', icon: FileCheck2 },
    { 
      label: 'Notifications', 
      path: '/student/notifications', 
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { label: 'Settings', path: '/student/settings', icon: Settings },
  ]

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
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
        <div className="space-y-5">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1 pb-2">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck size={20} className="stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-slate-900">
                    APAAR <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CONNECT</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Student Academic Portal
                </p>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Student Status Summary Card */}
          <div className="mx-1 rounded-xl p-3 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-purple-50/70 border border-blue-100">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
                {mockStudentProfile.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {mockStudentProfile.fullName}
                </p>
                <p className="text-[10px] font-mono text-slate-500 truncate">
                  {mockStudentProfile.registrationNumber}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center justify-between text-[10px]">
              <span className="text-slate-500">APAAR Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Verified
              </span>
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Student Workspace
            </div>
            <nav className="space-y-1">
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
                      <Icon
                        size={17}
                        className="shrink-0 transition-transform group-hover:scale-110"
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.2 text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer info & Logout button */}
        <div className="space-y-2 border-t border-slate-100 pt-3 px-1">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-600" />
              <span>DigiLocker ABC</span>
            </span>
            <span className="text-emerald-600 font-bold">Connected</span>
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
