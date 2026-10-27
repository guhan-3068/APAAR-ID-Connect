import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  Sparkles,
  ChevronDown,
  GraduationCap
} from 'lucide-react'
import { useStudent } from '@/context/StudentContext'
import { useAuth } from '@/context/AuthContext'

interface StudentNavbarProps {
  onToggleSidebar: () => void
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  const { profile, unreadNotificationsCount } = useStudent()
  const { logout } = useAuth()

  // Determine current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/student':
      case '/student/':
        return 'Dashboard Overview'
      case '/student/profile':
        return 'Student Profile'
      case '/student/records':
        return 'Academic Records & Transcripts'
      case '/student/documents':
        return 'Document Management'
      case '/student/requests':
        return 'Verification Requests'
      case '/student/notifications':
        return 'Notification Centre'
      case '/student/settings':
        return 'Account & Security Settings'
      default:
        return 'Student Portal'
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile Sidebar Toggle & Page Title */}
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
            {profile.course} • {profile.department}
          </p>
        </div>
      </div>

      {/* Right: Demonstration Mode Badge, Notifications & Profile Menu */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Synthetic Demo Mode Label */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
          <Sparkles size={11} className="text-purple-600 animate-pulse" />
          <span>Synthetic Demonstration Mode</span>
        </span>

        {/* Notifications Icon with Badge */}
        <Link
          to="/student/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
          title="View Notifications"
          aria-label="Notifications"
        >
          <Bell size={19} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white shadow-xs">
              {unreadNotificationsCount}
            </span>
          )}
        </Link>

        {/* Student Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
            aria-expanded={profileDropdownOpen}
            aria-label="Student profile menu"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              {profile.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold text-slate-900 leading-tight">
                {profile.fullName}
              </p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                {profile.registrationNumber}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Card */}
          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">
                    {profile.fullName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {profile.studentEmail}
                  </p>
                  <p className="text-[10px] font-mono text-blue-600 mt-1">
                    APAAR: {profile.apaarId.slice(0, 4)}••••
                  </p>
                </div>

                <div className="space-y-0.5 text-xs font-medium text-slate-700">
                  <Link
                    to="/student/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <User size={15} />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/student/records"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <GraduationCap size={15} />
                    <span>Academic Transcripts</span>
                  </Link>
                  <Link
                    to="/student/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors"
                  >
                    <Settings size={15} />
                    <span>Account Settings</span>
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
