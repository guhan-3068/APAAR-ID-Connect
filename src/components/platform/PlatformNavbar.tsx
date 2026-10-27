import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Menu,
  LogOut,
  ShieldCheck,
  ChevronDown,
  User,
  Sparkles,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'

interface PlatformNavbarProps {
  onToggleSidebar: () => void
}

export const PlatformNavbar: React.FC<PlatformNavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { user, logout } = useAuth()

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/platform':
      case '/platform/':
        return 'Student Enrolment Dashboard'
      case '/platform/validation':
        return 'Student Data Validation & Duplicate Detection'
      case '/platform/institutions':
        return 'Institution Directory & Submission Monitoring'
      case '/platform/analytics':
        return 'Reports & Regulatory Analytics'
      case '/platform/monitoring':
        return 'Platform Monitoring & Health'
      case '/platform/quality':
        return 'AI Quality & Heuristic Anomalies'
      case '/platform/notifications':
        return 'Institutional Notifications & Alerts'
      case '/platform/audit':
        return 'Platform Audit History'
      default:
        return 'AICTE Admin Portal'
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {getPageTitle()}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Sparkles size={11} className="text-purple-600" /> Apex Oversight
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            AICTE National Student Identity & Verification Ecosystem
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Administrator Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-700 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              AD
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">AICTE Platform Admin</p>
              <p className="text-[10px] text-purple-700 font-medium">National Coordination Cell</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl z-40 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user?.fullName || 'Platform Administrator'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@aicte.gov.in'}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Apex Root Authority
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <User size={14} className="text-slate-400" />
                    <span>View College Admin Portal</span>
                  </Link>
                  <Link
                    to="/student"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <ShieldCheck size={14} className="text-slate-400" />
                    <span>View Student Portal</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false)
                      await logout()
                      navigate('/login')
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <LogOut size={14} />
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
