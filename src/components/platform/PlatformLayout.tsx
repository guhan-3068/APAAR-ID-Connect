import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { PlatformProvider, usePlatformContext } from '@/context/PlatformContext'
import { PlatformSidebar } from './PlatformSidebar'
import { PlatformNavbar } from './PlatformNavbar'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const PlatformToastBanner: React.FC = () => {
  const { toast, dismissToast } = usePlatformContext()

  if (!toast) return null

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
  }

  const borderStyles: Record<'success' | 'error' | 'info', string> = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    error: 'border-rose-200 bg-rose-50 text-rose-950',
    info: 'border-blue-200 bg-blue-50 text-blue-950',
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md ${borderStyles[toast.type]}`}
        role="alert"
      >
        {icons[toast.type]}
        <div className="flex-1 text-xs font-semibold leading-relaxed">
          {toast.message}
        </div>
        <button
          onClick={dismissToast}
          className="text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

const PlatformShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar */}
      <PlatformSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Body */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <PlatformNavbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        {/* Apex Regulatory Notice Ribbon */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 px-4 py-1.5 text-center text-[11px] font-medium text-purple-200 border-b border-purple-800/40 flex items-center justify-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            <strong>AICTE APEX REGULATORY PLATFORM:</strong> SIH26263 Simulation Sandbox • Role: Super Administrator • All institution data is demonstration/fictional.
          </span>
        </div>

        {/* Scrollable Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Toast */}
      <PlatformToastBanner />
    </div>
  )
}

export const PlatformLayout: React.FC = () => {
  return (
    <PlatformProvider>
      <PlatformShell />
    </PlatformProvider>
  )
}

export default PlatformLayout
