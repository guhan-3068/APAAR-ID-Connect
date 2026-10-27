import React from 'react'
import { 
  Users, 
  Building2, 
  Zap, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react'
import { Card } from '@/components/common/Card'

export const StatisticsSection: React.FC = () => {
  const stats = [
    {
      label: 'Verified Student Profiles',
      value: '125,000+',
      description: 'Simulated candidates across pilot universities',
      icon: <Users className="text-blue-600" size={24} />,
      accent: 'border-blue-500/20 bg-blue-50/50',
    },
    {
      label: 'Participating AICTE Colleges',
      value: '450+',
      description: 'Technical institutions in prototype evaluation',
      icon: <Building2 className="text-indigo-600" size={24} />,
      accent: 'border-indigo-500/20 bg-indigo-50/50',
    },
    {
      label: 'Avg Verification Latency',
      value: '< 1.2s',
      description: 'End-to-end API response time via cache layer',
      icon: <Zap className="text-purple-600" size={24} />,
      accent: 'border-purple-500/20 bg-purple-50/50',
    },
    {
      label: 'Audit Match Precision',
      value: '99.8%',
      description: 'Discrepancy prevention & duplicate catch rate',
      icon: <ShieldCheck className="text-emerald-600" size={24} />,
      accent: 'border-emerald-500/20 bg-emerald-50/50',
    },
  ]

  return (
    <section className="py-18 bg-white border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Prominent Demonstration Data Disclosure Badge */}
        <div className="mb-10 p-3.5 rounded-xl bg-purple-50/60 border border-purple-200/60 max-w-2xl mx-auto flex items-center justify-center gap-2.5 text-xs text-purple-900 text-center">
          <Info size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Demonstration Data:</strong> The statistics displayed below represent simulated test metrics and pilot benchmark scenarios for demonstration purposes.
          </span>
        </div>

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Performance Metrics & Pilot Simulation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Validated throughput and audit reliability across stress-tested institutional enrollment batches.
          </p>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, index) => (
            <Card
              key={index}
              hoverEffect
              className="relative overflow-hidden border border-slate-200/80 p-6 bg-white rounded-2xl shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center justify-between"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                {item.icon}
              </div>

              <div className="space-y-1">
                <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {item.value}
                </span>
                <h3 className="text-xs font-bold text-slate-800 tracking-wide uppercase pt-1">
                  {item.label}
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug pt-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <Clock size={11} />
                <span>Simulated Benchmark</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
