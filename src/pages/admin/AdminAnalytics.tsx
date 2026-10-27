import React, { useMemo, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileCheck2,
  Download,
  ShieldCheck,
  GraduationCap,
  Info,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { analyticsService, downloadCsv, studentService, verificationService } from '@/services/appDataService'

// ─────────────────────────────────────────────────────────────────────────────
// Tiny inline bar
// ─────────────────────────────────────────────────────────────────────────────
const InlineBar: React.FC<{ pct: number; color?: string }> = ({
  pct,
  color = 'from-blue-500 to-indigo-600',
}) => (
  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
      style={{ width: `${pct}%` }}
    />
  </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// Donut chart (SVG)
// ─────────────────────────────────────────────────────────────────────────────
const DonutChart: React.FC<{
  segments: { label: string; count: number; color: string }[]
  total: number
}> = ({ segments, total }) => {
  const r = 40
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r

  const arcs = segments.reduce<{ label: string; count: number; color: string; dash: number; gap: number; offset: number }[]>(
    (acc, seg) => {
      const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0
      const dash = (seg.count / (total || 1)) * circumference
      acc.push({
        ...seg,
        dash,
        gap: circumference - dash,
        offset: prevOffset,
      })
      return acc
    },
    []
  )

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={16} />
      {arcs.map((arc) => (
        <circle
          key={arc.label}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={16}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          transform="rotate(-90 60 60)"
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight="bold" fill="#0f172a">
        {total}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#94a3b8">
        Students
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend bar chart
// ─────────────────────────────────────────────────────────────────────────────
const TrendBars: React.FC<{
  data: { month: string; verified: number; submitted: number }[]
}> = ({ data }) => {
  const maxVal = Math.max(...data.flatMap((d) => [d.verified, d.submitted]), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end gap-0.5 h-20">
            <div
              className="flex-1 rounded-t bg-indigo-200"
              style={{ height: `${(d.submitted / maxVal) * 100}%` }}
              title={`Submitted: ${d.submitted}`}
            />
            <div
              className="flex-1 rounded-t bg-indigo-600"
              style={{ height: `${(d.verified / maxVal) * 100}%` }}
              title={`Verified: ${d.verified}`}
            />
          </div>
          <span className="text-[9px] text-slate-400">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ANALYTICS PAGE
// ─────────────────────────────────────────────────────────────────────────────

export const AdminAnalytics: React.FC = () => {
  const { students, verificationRequests, dataQualityIssues } = useAdmin()
  const [isExporting, setIsExporting] = useState(false)

  const analytics = useMemo(
    () => analyticsService.getAdminAnalytics(students, verificationRequests, dataQualityIssues),
    [students, verificationRequests, dataQualityIssues]
  )

  const handleExportStudents = () => {
    setIsExporting(true)
    const csv = studentService.exportCsv()
    downloadCsv(csv, `NIET_Students_Export_${new Date().toISOString().split('T')[0]}.csv`)
    setTimeout(() => setIsExporting(false), 500)
  }

  const handleExportVerifications = () => {
    setIsExporting(true)
    const csv = verificationService.exportCsv()
    downloadCsv(csv, `NIET_Verifications_Export_${new Date().toISOString().split('T')[0]}.csv`)
    setTimeout(() => setIsExporting(false), 500)
  }

  const statusColors: Record<string, string> = {
    verified: '#10b981',
    pending: '#f59e0b',
    flagged: '#ef4444',
    rejected: '#dc2626',
    incomplete: '#f97316',
    active: '#6366f1',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-blue-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Institutional Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            NIET — National Institute of Engineering & Technology · AICTE-1-4928172
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportStudents}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export Students CSV
          </button>
          <button
            onClick={handleExportVerifications}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            <Download size={14} /> Export Verifications CSV
          </button>
        </div>
      </div>

      {/* Demonstration Banner */}
      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900">
        <Info size={14} className="text-blue-600 shrink-0" />
        <span>
          <strong>Demonstration Analytics:</strong> Statistics are computed from synthetic
          demonstration data seeded from the in-memory data service. CSV exports contain no real
          student personal identifiers.
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Students',
            value: analytics.totalStudents,
            icon: <Users size={17} className="text-blue-600" />,
            bg: 'bg-blue-50 border-blue-200',
          },
          {
            label: 'Verified Students',
            value: `${analytics.verifiedStudents} (${analytics.verificationRate}%)`,
            icon: <CheckCircle2 size={17} className="text-emerald-600" />,
            bg: 'bg-emerald-50 border-emerald-200',
          },
          {
            label: 'DigiLocker Synced',
            value: analytics.digilockerSynced,
            icon: <ShieldCheck size={17} className="text-purple-600" />,
            bg: 'bg-purple-50 border-purple-200',
          },
          {
            label: 'Open Quality Issues',
            value: analytics.openQualityIssues,
            icon: <AlertTriangle size={17} className="text-rose-600" />,
            bg: 'bg-rose-50 border-rose-200',
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border p-4 ${kpi.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-xs">
                {kpi.icon}
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</p>
            <p className="text-[11px] font-semibold text-slate-600 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Status Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Student Status Distribution</h3>
          <div className="flex items-center gap-4">
            <DonutChart
              segments={analytics.statusDistribution.map((s) => ({
                label: s.status,
                count: s.count,
                color: statusColors[s.status] ?? '#94a3b8',
              }))}
              total={analytics.totalStudents}
            />
            <div className="space-y-1.5 flex-1">
              {analytics.statusDistribution.map((s) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-slate-600 capitalize">{s.status}</span>
                  </div>
                  <span className="font-bold text-slate-800">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Trend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Verification Activity</h3>
              <p className="text-[11px] text-slate-500">6-month trend</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="h-2 w-3 rounded bg-indigo-600 inline-block" /> Verified
              <span className="h-2 w-3 rounded bg-indigo-200 inline-block ml-1" /> Submitted
            </div>
          </div>
          <TrendBars data={analytics.verificationTrend} />
          <div className="mt-3 flex items-center gap-4 text-xs pt-3 border-t border-slate-100">
            <div>
              <span className="font-bold text-emerald-700">{analytics.completedVerifications}</span>
              <span className="text-slate-500 ml-1">Completed</span>
            </div>
            <div>
              <span className="font-bold text-amber-700">{analytics.pendingVerifications}</span>
              <span className="text-slate-500 ml-1">Pending</span>
            </div>
          </div>
        </div>

        {/* Quality Issue Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Data Quality Issues</h3>
          <div className="space-y-3">
            {analytics.qualityBreakdown.map((q) => (
              <div key={q.type} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium truncate mr-2">{q.type}</span>
                  <span className="font-bold text-slate-900 shrink-0">{q.count} ({q.open} open)</span>
                </div>
                <InlineBar
                  pct={Math.round((q.open / (q.count || 1)) * 100)}
                  color={q.open === 0 ? 'from-emerald-400 to-emerald-500' : 'from-rose-400 to-rose-600'}
                />
              </div>
            ))}
            {analytics.qualityBreakdown.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">
                No data quality issues found. ✓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Department-Wise Verification Progress</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            APAAR verification completion per academic discipline
          </p>
        </div>
        <div className="p-5 space-y-4">
          {analytics.departmentBreakdown
            .sort((a, b) => b.pct - a.pct)
            .map((dept) => (
              <div key={dept.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 flex items-center gap-2">
                    <GraduationCap size={14} className="text-blue-500 shrink-0" />
                    {dept.department}
                  </span>
                  <span className="text-slate-500 font-mono shrink-0">
                    {dept.verified} / {dept.total} ({dept.pct}%)
                  </span>
                </div>
                <InlineBar
                  pct={dept.pct}
                  color={
                    dept.pct >= 90
                      ? 'from-emerald-500 to-teal-500'
                      : dept.pct >= 75
                      ? 'from-blue-500 to-indigo-600'
                      : 'from-amber-400 to-orange-500'
                  }
                />
              </div>
            ))}
        </div>
      </div>

      {/* Verification Request Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Pending Requests',
            value: analytics.pendingVerifications,
            desc: 'Awaiting review or under review',
            icon: <FileCheck2 size={16} className="text-amber-600" />,
            cls: 'border-amber-200 bg-amber-50',
          },
          {
            label: 'Verified Requests',
            value: analytics.completedVerifications,
            desc: 'Successfully verified this session',
            icon: <CheckCircle2 size={16} className="text-emerald-600" />,
            cls: 'border-emerald-200 bg-emerald-50',
          },
          {
            label: 'APAAR Verification Rate',
            value: `${analytics.verificationRate}%`,
            desc: `${analytics.verifiedStudents} of ${analytics.totalStudents} students`,
            icon: <TrendingUp size={16} className="text-indigo-600" />,
            cls: 'border-indigo-200 bg-indigo-50',
          },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border p-4 ${card.cls}`}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center shadow-xs">
                {card.icon}
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900">{card.value}</p>
                <p className="text-[11px] font-semibold text-slate-700">{card.label}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminAnalytics
