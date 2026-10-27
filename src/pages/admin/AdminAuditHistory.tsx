import React, { useState, useMemo } from 'react'
import { Search, Filter, History, ChevronLeft, ChevronRight, Info, Download } from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { auditService, downloadCsv, downloadJson } from '@/services/appDataService'
import type { AuditLogItem } from '@/types'

const ITEMS_PER_PAGE = 10

const categoryConfig: Record<AuditLogItem['category'], { label: string; cls: string }> = {
  student: { label: 'Student', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  academic: { label: 'Academic', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  document: { label: 'Document', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  verification: { label: 'Verification', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  quality: { label: 'Quality', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
}

export const AdminAuditHistory: React.FC = () => {
  const { auditLog, showToast } = useAdmin()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | AuditLogItem['category']>('all')
  const [page, setPage] = useState(1)

  const handleExportCsv = () => {
    const csv = auditService.exportCsv()
    downloadCsv(csv, `NIET_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`)
    showToast('Audit trail exported as CSV.', 'success')
  }

  const handleExportJson = () => {
    const json = auditService.exportJson()
    downloadJson(json, `NIET_Audit_Trail_${new Date().toISOString().split('T')[0]}.json`)
    showToast('Audit trail exported as JSON.', 'success')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return auditLog.filter((l) => {
      const matchesSearch =
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.affectedRecord.toLowerCase().includes(q) ||
        l.adminAccount.toLowerCase().includes(q)
      const matchesCategory = categoryFilter === 'all' || l.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [auditLog, search, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Backend Disclaimer Banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <strong>Demonstration Audit Log.</strong> This log records actions performed in the synthetic demonstration environment only. In production, a tamper-evident, server-side audit trail is required for regulatory compliance. Browser-stored logs do not satisfy AICTE data governance requirements.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Audit Event Log</h2>
            <span className="text-[11px] text-slate-400">({auditLog.length} events)</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="audit-search"
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search events…"
                className="rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-48"
              />
            </div>
            <Filter size={13} className="text-slate-400" />
            <select
              id="audit-category-filter"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value as typeof categoryFilter); setPage(1) }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors shrink-0"
                title="Download CSV audit report"
              >
                <Download size={12} className="text-blue-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors shrink-0"
                title="Download JSON cryptographic audit log"
              >
                <Download size={12} className="text-purple-600" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-[11px] text-slate-500 font-bold uppercase tracking-wide">
                <th className="px-5 py-3">Action & Record</th>
                <th className="px-4 py-3 hidden md:table-cell">Admin Account</th>
                <th className="px-4 py-3 hidden lg:table-cell">Status Change</th>
                <th className="px-4 py-3 hidden sm:table-cell">Timestamp</th>
                <th className="px-4 py-3">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 text-sm">No audit events match the current filters.</td></tr>
              ) : (
                paginated.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{log.action}</p>
                      <p className="text-slate-500 text-[11px] max-w-[200px] truncate">{log.affectedRecord}</p>
                      {log.reason && <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate" title={log.reason}>{log.reason}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600 max-w-[160px] truncate">{log.adminAccount}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {log.previousStatus && log.newStatus ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{log.previousStatus}</span>
                          <span className="text-slate-400">→</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{log.newStatus}</span>
                        </span>
                      ) : log.newStatus ? (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px]">{log.newStatus}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-500">
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryConfig[log.category].cls}`}>
                        {categoryConfig[log.category].label}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} events</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={15} /></button>
            <span className="px-2 font-semibold text-slate-700">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={15} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
