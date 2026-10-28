import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  GraduationCap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { academicRecordService, downloadCsv } from '@/services/appDataService'
import type { AdminAcademicRecord } from '@/types'

const ITEMS_PER_PAGE = 8

const statusBadge = (status: AdminAcademicRecord['status']) => {
  const map: Record<string, string> = {
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    requires_review: 'bg-orange-50 text-orange-700 border border-orange-200',
    rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
    incomplete: 'bg-red-50 text-red-700 border border-red-200',
  }
  const label: Record<string, string> = {
    verified: 'Verified',
    pending: 'Pending',
    requires_review: 'Requires Review',
    rejected: 'Rejected',
    incomplete: 'Incomplete',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {label[status] ?? status}
    </span>
  )
}

const RecordDetailModal: React.FC<{ record: AdminAcademicRecord; onClose: () => void }> = ({ record, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Academic Record Details</h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"><X size={16} /></button>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: 'Student Name', value: record.studentName },
            { label: 'Reg. Number', value: record.registrationNumber },
            { label: 'Department', value: record.department },
            { label: 'Programme', value: record.programme },
            { label: 'Academic Year', value: record.academicYear },
            { label: 'Semester', value: record.semester },
            { label: 'Examination', value: record.examination },
            { label: 'SGPA', value: record.sgpa.toFixed(2) },
            { label: 'Credits Earned', value: `${record.creditsEarned} / ${record.totalCredits}` },
            { label: 'Issuing Authority', value: record.issuingAuthority },
            { label: 'Last Updated', value: record.lastUpdated },
          ].map((f) => (
            <div key={f.label} className="bg-slate-50 rounded-xl p-3 col-span-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">{f.label}</p>
              <p className="font-semibold text-slate-800 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
          <span className="text-xs font-bold text-slate-600">Status</span>
          {statusBadge(record.status)}
        </div>
        {record.isIncomplete && record.missingFields && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
            <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Missing Fields</p>
            <ul className="text-xs text-rose-600 list-disc list-inside space-y-0.5">
              {record.missingFields.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
      </div>
      <div className="px-6 pb-5 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200">Close</button>
      </div>
    </div>
  </div>
)

export const AdminAcademicRecords: React.FC = () => {
  const { academicRecords, adminProfile, showToast } = useAdmin()
  const [searchParams] = useSearchParams()
  const initialParam = searchParams.get('status')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AdminAcademicRecord['status']>(
    (initialParam as AdminAcademicRecord['status']) || 'all'
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminAcademicRecord | null>(null)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s && ['verified', 'pending', 'requires_review', 'rejected', 'incomplete'].includes(s)) {
      setStatusFilter(s as AdminAcademicRecord['status'])
      setPage(1)
    } else if (s === 'all') {
      setStatusFilter('all')
      setPage(1)
    }
  }, [searchParams])

  const handleExportCsv = () => {
    const csv = academicRecordService.exportCsv()
    const prefix = (adminProfile?.institutionCode || 'College').replace(/[^a-zA-Z0-9_-]/g, '_')
    downloadCsv(csv, `${prefix}_Academic_Records_${new Date().toISOString().split('T')[0]}.csv`)
    showToast('Academic examination records exported as CSV.', 'success')
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return academicRecords.filter((r) => {
      const matchesSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.semester.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [academicRecords, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = {
    total: academicRecords.length,
    verified: academicRecords.filter((r) => r.status === 'verified').length,
    pending: academicRecords.filter((r) => r.status === 'pending').length,
    attention: academicRecords.filter((r) => r.status === 'requires_review' || r.status === 'incomplete').length,
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {selected && <RecordDetailModal record={selected} onClose={() => setSelected(null)} />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: stats.total, icon: <GraduationCap size={16} className="text-indigo-600" />, color: 'border-indigo-100' },
          { label: 'Verified', value: stats.verified, icon: <CheckCircle2 size={16} className="text-emerald-600" />, color: 'border-emerald-100' },
          { label: 'Pending', value: stats.pending, icon: <Clock size={16} className="text-amber-600" />, color: 'border-amber-100' },
          { label: 'Requires Attention', value: stats.attention, icon: <AlertTriangle size={16} className="text-rose-600" />, color: 'border-rose-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.color} p-4 flex items-center gap-3`}>
            <div className="p-2 rounded-lg bg-slate-50">{s.icon}</div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="records-search"
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search student, reg. no, semester…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              id="records-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="requires_review">Requires Review</option>
              <option value="incomplete">Incomplete</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors shrink-0"
              title="Export academic examination records as CSV"
            >
              <Download size={13} className="text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-[11px] text-slate-500 font-bold uppercase tracking-wide">
                <th className="px-5 py-3">Student</th>
                <th className="px-4 py-3 hidden sm:table-cell">Semester</th>
                <th className="px-4 py-3 hidden md:table-cell">Department</th>
                <th className="px-4 py-3 hidden lg:table-cell">SGPA</th>
                <th className="px-4 py-3 hidden lg:table-cell">Credits</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    {academicRecords.length === 0 ? 'No academic records have been uploaded yet.' : 'No records match the current filters.'}
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{r.studentName}</p>
                      <p className="text-slate-400 font-mono">{r.registrationNumber}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-slate-700">{r.semester}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600 max-w-[130px] truncate">{r.department}</td>
                    <td className="px-4 py-3 hidden lg:table-cell font-bold text-slate-800">{r.sgpa.toFixed(2)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{r.creditsEarned}/{r.totalCredits}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {statusBadge(r.status)}
                        {r.isIncomplete && <span className="text-[10px] text-rose-600 font-semibold">Missing fields</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} records</span>
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
