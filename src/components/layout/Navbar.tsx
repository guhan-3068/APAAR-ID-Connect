import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ShieldCheck, 
  Menu, 
  X, 
  Bell, 
  Search, 
  Building2 
} from 'lucide-react'
import { Badge } from '@/components/common/Badge'

interface NavbarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}

export const Navbar: React.FC<NavbarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile Toggle & Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
          aria-label="Toggle navigation"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                APAAR <span className="text-blue-600">CONNECT AI</span>
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">
                AICTE
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400">
              Smart India Hackathon • Academic Verification Platform
            </p>
          </div>
        </Link>
      </div>

      {/* Center/Right: Institutional Badge & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
          <Building2 size={15} className="text-blue-600" />
          <span>Inst. Code: <strong className="text-slate-900 dark:text-white">AICTE-1-4928172</strong></span>
          <Badge status="verified" variant="subtle" className="text-[10px] py-0">Approved</Badge>
        </div>

        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Quick Search"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-inner">
            RO
          </div>
          <div className="hidden sm:block text-left text-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-100 leading-none">Registrar Office</p>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Admin Portal</p>
          </div>
        </div>
      </div>
    </header>
  )
}
