import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { AdminSidebar } from './AdminSidebar'
import { AdminNavbar } from './AdminNavbar'
import { AdminProvider, useAdmin } from '@/context/AdminContext'

const AdminToastBanner: React.FC = () => {
  const { toast, dismissToast } = useAdmin()
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

const AdminLayoutContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <AdminToastBanner />
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const AdminLayout: React.FC = () => {
  return (
    <AdminProvider>
      <AdminLayoutContent />
    </AdminProvider>
  )
}

