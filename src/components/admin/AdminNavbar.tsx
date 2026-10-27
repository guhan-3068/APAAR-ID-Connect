import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Search,
  Sparkles,
  User,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { useAuth } from '@/context/AuthContext'

interface AdminNavbarProps {
  onToggleSidebar: () => void
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const { unreadNotificationsCount: unreadCount, adminProfile } = useAdmin()
  const { logout } = useAuth()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/admin':
      case '/admin/':
        return 'Dashboard Overview'
      case '/admin/students':
        return 'Student Management'
      case '/admin/academic-records':
        return 'Academic Records'
      case '/admin/documents':
        return 'Document Review'
      case '/admin/verifications':
        return 'Verification Requests'
      case '/admin/data-quality':
        return 'Data Quality Checks'
      case '/admin/notifications':
        return 'Notification Centre'
      case '/admin/settings':
        return 'Administration Settings'
      default:
        return 'Admin Portal'
    }
  }

  const initials = adminProfile.name.split(' ').filter((_p, i) => i === 0 || i === adminProfile.name.split(' ').length - 1).map((n) => n[0]).join('')

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400">
            {adminProfile.institutionName} • {adminProfile.institutionCode}
          </p>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-xs mx-6">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search students, records…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
            aria-label="Global search"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Demo badge */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
          <Sparkles size={11} className="text-purple-600 animate-pulse" />
          <span>Synthetic Demo</span>
        </span>

        {/* Notifications */}
        <Link
          to="/admin/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          title="View Notifications"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            aria-expanded={profileDropdownOpen}
            aria-label="Admin profile menu"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-slate-900 leading-tight">{adminProfile.name}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{adminProfile.role}</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-40">
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{adminProfile.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{adminProfile.email}</p>
                  <p className="text-[10px] font-mono text-blue-600 mt-1">{adminProfile.institutionCode}</p>
                </div>

                <div className="space-y-0.5 text-xs font-medium text-slate-700">
                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <User size={15} />
                    <span>Admin Profile</span>
                  </Link>
                  <Link
                    to="/admin/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <Settings size={15} />
                    <span>Settings</span>
                  </Link>
                </div>

                <div className="mt-1 pt-1 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false)
                      await logout()
                      navigate('/login')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
