import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'

export const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100 py-3'
          : 'bg-white/80 backdrop-blur-xs py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <ShieldCheck size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  APAAR <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CONNECT AI</span>
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/60 rounded">
                  AICTE
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-500 font-medium">
                Student Data Management &amp; Verification Platform
              </p>
            </div>
          </Link>

          {/* Single CTA: Get Started */}
          <Link to="/login">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight size={15} />}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 px-5 py-2 text-sm font-semibold"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
