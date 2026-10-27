import React from 'react'
import { ShieldCheck, Heart } from 'lucide-react'

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 sm:px-6">
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600" />
          <span>
            <strong>APAAR CONNECT AI</strong> — Ministry of Education & AICTE Initiative
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span>Built for Smart India Hackathon with</span>
          <Heart size={14} className="text-rose-500 fill-rose-500 inline mx-0.5" />
          <span>for AICTE-Approved Institutions</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>DigiLocker Synced</span>
          <span>•</span>
          <span>ABC Framework Ready</span>
          <span>•</span>
          <span>v1.0.0-beta</span>
        </div>
      </div>
    </footer>
  )
}
