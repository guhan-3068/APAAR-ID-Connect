import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { StudentSidebar } from './StudentSidebar'
import { StudentNavbar } from './StudentNavbar'
import { StudentProvider, useStudent } from '@/context/StudentContext'

const StudentToastBanner: React.FC = () => {
  const { toast, dismissToast } = useStudent()
  if (!toast) return null

  const icons = {
    success: <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />,
    error: <AlertCircle size={16} className="text-rose-600 shrink-0" />,
    info: <Info size={16} className="text-blue-600 shrink-0" />,
  }

  const borderCls = {
    success: 'border-emerald-300 bg-emerald-50/95 text-emerald-950 shadow-emerald-500/10',
    error: 'border-rose-300 bg-rose-50/95 text-rose-950 shadow-rose-500/10',
    info: 'border-blue-300 bg-blue-50/95 text-blue-950 shadow-blue-500/10',
  }

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md ${borderCls[toast.type]}`}>
        {icons[toast.type]}
        <p className="text-xs font-semibold flex-1 leading-snug">{toast.message}</p>
        <button
          onClick={dismissToast}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

const StudentLayoutContent: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500/20 selection:text-blue-700 relative">
      <StudentToastBanner />
      <div className="flex flex-1">
        {/* Collapsible / Responsive Sidebar */}
        <StudentSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {/* Content Area with Top Navbar */}
        <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
          <StudentNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export const StudentLayout: React.FC = () => {
  return (
    <StudentProvider>
      <StudentLayoutContent />
    </StudentProvider>
  )
}

