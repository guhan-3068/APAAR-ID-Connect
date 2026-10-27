import React, { useState, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Info,
  XCircle,
  Download,
  Calendar,
  Lock,
} from 'lucide-react'
import { usePlatformContext } from '@/context/PlatformContext'

export const PlatformAuditLogs: React.FC = () => {
  const { platformLogs } = usePlatformContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all')

  const filteredLogs = useMemo(() => {
    return platformLogs.filter((log) => {
      const matchesSearch =
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter

      return matchesSearch && matchesSeverity
    })
  }, [platformLogs, searchTerm, severityFilter])

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
              <Lock size={12} className="text-slate-600" />
              Cryptographically Chained Audit Trail
            </span>
            <span className="text-[11px] text-slate-500 font-medium">DPDP Act 2023 Compliant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Immutable Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident record of all platform-level administrative interventions, institution status modifications, and security events.
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2))
            const downloadAnchor = document.createElement('a')
            downloadAnchor.setAttribute('href', dataStr)
            downloadAnchor.setAttribute('download', `apaar-platform-audit-log-${new Date().toISOString().split('T')[0]}.json`)
            document.body.appendChild(downloadAnchor)
            downloadAnchor.click()
            downloadAnchor.remove()
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
        >
          <Download size={14} /> Export Audit Archive (.JSON)
        </button>
      </div>

      {/* Security notice */}
      <div className="rounded-xl bg-purple-50/70 border border-purple-200 p-4 text-xs text-purple-950 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Least-Privilege Logging Policy:</span> Audit entries log operational actions, timestamps, and authorized actors. In compliance with the Digital Personal Data Protection Act (DPDP), no unencrypted student Aadhaar numbers or raw identity biometric payloads are stored in human-readable audit journals.
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by actor, action type, target entity, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Filter size={14} className="text-slate-400" />
            <span className="font-semibold text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Event ID & Timestamp</th>
                <th className="py-3 px-4">Authorized Actor</th>
                <th className="py-3 px-4">Action Summary</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details & Justification</th>
                <th className="py-3 px-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <History className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold">No audit events match your search filters</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp)
                  const formattedDate = dateObj.toLocaleDateString()
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID & Timestamp */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] font-bold text-slate-600 block">{log.id}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} /> {formattedDate} {formattedTime}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4 font-mono font-medium text-purple-700">
                        {log.actor}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.action}
                      </td>

                      {/* Target */}
                      <td className="py-3 px-4 text-slate-700 font-medium max-w-[200px] truncate" title={log.target}>
                        {log.target}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-[240px]">
                        {log.details}
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.severity === 'critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : log.severity === 'warning'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {log.severity === 'critical' ? (
                            <XCircle size={10} />
                          ) : log.severity === 'warning' ? (
                            <AlertTriangle size={10} />
                          ) : (
                            <Info size={10} />
                          )}
                          {log.severity.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PlatformAuditLogs
