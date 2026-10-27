import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, 
  Sparkles, 
  FileCheck2, 
  Building2, 
  Layers, 
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'

export const HeroSection: React.FC = () => {
  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-36 md:pb-28 overflow-hidden bg-white">
      {/* Subtle Background Glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-tr from-blue-100/70 via-indigo-100/50 to-purple-100/60 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 right-10 w-72 h-72 bg-purple-100/40 rounded-full blur-2xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-2xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Value Proposition & Action */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
              <Sparkles size={14} className="text-purple-600 animate-pulse" />
              <span>Smart India Hackathon Innovation</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">AICTE Approved Institutions</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Unified <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">APAAR ID</span> Student Management &amp; Verification
            </h1>

            {/* Subheading / Description */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Transforming academic data governance for colleges and universities. 
              Automate 12-digit APAAR verification, synchronize with <strong>DigiLocker &amp; Academic Bank of Credits (ABC)</strong>, 
              and maintain seamless AICTE compliance with cryptographic trust.
            </p>

            {/* Single CTA Button */}
            <div className="flex items-center justify-center lg:justify-start pt-2">
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  rightIcon={<ArrowRight size={18} />}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/25 px-10 py-3 rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
                >
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Trust points */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>NEP 2020 Aligned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>DigiLocker &amp; ABC Depository Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>256-bit Encrypted Storage</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Platform Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/90 ring-1 ring-slate-900/5">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 leading-none">
                      National Institute of Engineering
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      AICTE Permanent ID: 1-4928172
                    </p>
                  </div>
                </div>
                <Badge status="verified" variant="subtle" className="text-[10px] py-0.5">
                  Live Gateway
                </Badge>
              </div>

              {/* Sample Demonstration Card */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Student Demonstration Profile
                  </span>
                  <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-full font-medium">
                    Demo Record
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Aarav Sharma
                    </h3>
                    <p className="text-xs text-slate-500">
                      B.Tech (Computer Science &amp; Eng.)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Academic Year</span>
                    <p className="text-xs font-semibold text-slate-700">2022-2026</p>
                  </div>
                </div>

                {/* Formatted APAAR Badge */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-slate-400 block">
                      APAAR ID (One Nation One ID)
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-600">
                      9823-4817-2910
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <CheckCircle2 size={12} /> Validated
                  </span>
                </div>

                {/* Verification points breakdown */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-white border border-slate-100 flex items-center gap-1.5 text-slate-700">
                    <FileCheck2 size={14} className="text-blue-500 shrink-0" />
                    <span>DigiLocker: <strong>Synced</strong></span>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-100 flex items-center gap-1.5 text-slate-700">
                    <Layers size={14} className="text-purple-500 shrink-0" />
                    <span>ABC Credits: <strong>132 Pts</strong></span>
                  </div>
                </div>
              </div>

              {/* Status footer inside card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock size={13} className="text-slate-400" />
                  <span>Avg Verification: <strong>0.84s</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={11} className="text-slate-400" />
                  <span>3 portal roles supported</span>
                </div>
              </div>
            </div>

            {/* Decorative Glow Ring */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
