import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Users,
  FileWarning,
  RefreshCw,
  Check,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import type { DataQualityIssueItem } from '@/types'

const ITEMS_PER_PAGE = 6

const severityConfig = {
  high: { label: 'High', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
  medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  low: { label: 'Low', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
}

const reviewStatusConfig = {
  open: { label: 'Open', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
  under_review: { label: 'Under Review', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  resolved: { label: 'Resolved', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
}

const IssueDetailModal: React.FC<{
  issue: DataQualityIssueItem
  onClose: () => void
  onResolve: () => void
}> = ({ issue, onClose, onResolve }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" /> Data Quality Issue Details
        </h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
          <X size={16} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${severityConfig[issue.severity].cls}`}>
            {severityConfig[issue.severity].label} Severity
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${reviewStatusConfig[issue.reviewStatus].cls}`}>
            {reviewStatusConfig[issue.reviewStatus].label}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            {issue.issueType}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {[
            { label: 'Student Name', value: issue.studentName },
            { label: 'Registration Number', value: issue.registrationNumber },
            { label: 'Affected Record ID', value: issue.affectedRecord },
            { label: 'Detection Date', value: issue.detectedAt },
          ].map((f) => (
            <div key={f.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.label}</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{f.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <AlertCircle size={14} className="text-slate-500" /> Inconsistency Explanation
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">{issue.explanation}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1.5">
            <Zap size={14} className="text-blue-600" /> Suggested Administrative Correction
          </p>
          <p className="text-xs text-blue-700 leading-relaxed font-medium">{issue.suggestedCorrection}</p>
        </div>

        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
          ⚠️ <strong>Demonstration Data Quality Rule:</strong> Corrections must be verified with the Controller of Examinations before permanent ledger alteration.
        </p>
      </div>

      <div className="px-6 pb-5 flex items-center justify-between border-t border-slate-100 pt-4">
        {issue.reviewStatus !== 'resolved' ? (
          <button
            onClick={() => {
              onResolve()
              onClose()
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check size={14} /> Mark Issue Resolved
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 size={14} /> Resolved
          </span>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)

export const AdminDataQuality: React.FC = () => {
  const {
    dataQualityIssues,
    students,
    academicRecords,
    detectedDuplicates,
    runDuplicateScan,
    resolveDataQualityIssue,
  } = useAdmin()

  const [activeTab, setActiveTab] = useState<'issues' | 'duplicates' | 'missing-fields'>('issues')
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | DataQualityIssueItem['severity']>('all')
  const [reviewFilter, setReviewFilter] = useState<'all' | DataQualityIssueItem['reviewStatus']>('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<DataQualityIssueItem | null>(null)
  const [scanning, setScanning] = useState(false)

  // Filter Issues
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return dataQualityIssues.filter((i) => {
      const matchesSearch =
        !q ||
        i.studentName.toLowerCase().includes(q) ||
        i.registrationNumber.toLowerCase().includes(q) ||
        i.issueType.toLowerCase().includes(q) ||
        i.affectedRecord.toLowerCase().includes(q)
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter
      const matchesReview = reviewFilter === 'all' || i.reviewStatus === reviewFilter
      return matchesSearch && matchesSeverity && matchesReview
    })
  }, [dataQualityIssues, search, severityFilter, reviewFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  // Aggregated Missing Fields from Students and Academic Records
  const missingFieldRecords = useMemo(() => {
    const list: {
      id: string
      type: 'Student Profile' | 'Academic Record'
      name: string
      regNo: string
      missing: string[]
    }[] = []

    students.forEach((s) => {
      if (s.missingFields && s.missingFields.length > 0) {
        list.push({
          id: s.id,
          type: 'Student Profile',
          name: s.fullName,
          regNo: s.registrationNumber,
          missing: s.missingFields,
        })
      }
    })

    academicRecords.forEach((ar) => {
      if (ar.missingFields && ar.missingFields.length > 0) {
        list.push({
          id: ar.id,
          type: 'Academic Record',
          name: ar.studentName,
          regNo: ar.registrationNumber,
          missing: ar.missingFields,
        })
      }
    })

    return list
  }, [students, academicRecords])

  const stats = {
    total: dataQualityIssues.length,
    high: dataQualityIssues.filter((i) => i.severity === 'high').length,
    open: dataQualityIssues.filter((i) => i.reviewStatus === 'open').length,
    resolved: dataQualityIssues.filter((i) => i.reviewStatus === 'resolved').length,
    duplicates: detectedDuplicates.length,
    missingFieldCount: missingFieldRecords.length,
  }

  const handleScan = () => {
    setScanning(true)
    setTimeout(() => {
      runDuplicateScan()
      setScanning(false)
    }, 600)
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {selected && (
        <IssueDetailModal
          issue={selected}
          onClose={() => setSelected(null)}
          onResolve={() => resolveDataQualityIssue(selected.id)}
        />
      )}

      {/* Compliance / Regulatory Banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>AICTE Data Integrity Guard:</strong> Automated heuristic and cryptographic verification rules
          detect incomplete student profiles, conflicting 12-digit APAAR identifiers, duplicate institutional enrollment
          records, and marksheet formatting anomalies. All suggested corrections require administrative authorization.
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Inconsistencies', value: stats.total, icon: <AlertTriangle size={16} className="text-slate-600" />, color: 'border-slate-200' },
          { label: 'High Severity Flags', value: stats.high, icon: <ShieldAlert size={16} className="text-rose-600" />, color: 'border-rose-100' },
          { label: 'Duplicate Candidates', value: stats.duplicates, icon: <Users size={16} className="text-indigo-600" />, color: 'border-indigo-100' },
          { label: 'Missing Fields Records', value: stats.missingFieldCount, icon: <FileWarning size={16} className="text-amber-600" />, color: 'border-amber-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border ${s.color} p-4 flex items-center gap-3 shadow-xs`}>
            <div className="p-2 rounded-lg bg-slate-50">{s.icon}</div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-[11px] text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* View Switcher Tabs: Inconsistencies / Duplicate Detection / Missing Fields */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'issues'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle size={13} /> Flagged Inconsistencies ({dataQualityIssues.length})
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'duplicates'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={13} /> Duplicate Detection ({detectedDuplicates.length})
        </button>

        <button
          onClick={() => setActiveTab('missing-fields')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'missing-fields'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileWarning size={13} /> Missing Mandatory Fields ({missingFieldRecords.length})
        </button>
      </div>

      {/* TAB 1: Flagged Inconsistencies */}
      {activeTab === 'issues' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Search & Filters */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="dq-search"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search student, issue type…"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={13} className="text-slate-400" />
              <select
                id="dq-severity-filter"
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value as typeof severityFilter)
                  setPage(1)
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 font-medium"
              >
                <option value="all">All Severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                id="dq-review-filter"
                value={reviewFilter}
                onChange={(e) => {
                  setReviewFilter(e.target.value as typeof reviewFilter)
                  setPage(1)
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Issues List */}
          <div className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-bold text-slate-800">No Matching Data Inconsistencies</p>
                <p className="text-xs text-slate-500 mt-1">All records matching this filter are in compliance.</p>
              </div>
            ) : (
              paginated.map((issue) => (
                <div key={issue.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${severityConfig[issue.severity].cls}`}>
                          {severityConfig[issue.severity].label} Severity
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${reviewStatusConfig[issue.reviewStatus].cls}`}>
                          {reviewStatusConfig[issue.reviewStatus].label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {issue.issueType}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 mt-1 text-sm">
                        {issue.studentName}{' '}
                        <span className="text-slate-400 font-normal text-xs font-mono">({issue.registrationNumber})</span>
                      </p>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {issue.explanation}
                      </p>

                      <div className="mt-2 text-[11px] bg-blue-50/60 border border-blue-100 rounded-lg p-2 text-blue-900">
                        <span className="font-bold text-blue-800">Suggested Action:</span> {issue.suggestedCorrection}
                      </div>

                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        Affected Record: {issue.affectedRecord} • Detected: {issue.detectedAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {issue.reviewStatus !== 'resolved' && (
                        <button
                          onClick={() => resolveDataQualityIssue(issue.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 shadow-xs"
                          title="Mark as resolved"
                        >
                          <Check size={13} /> Resolve
                        </button>
                      )}
                      <button
                        onClick={() => setSelected(issue)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} issues
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Duplicate Detection Engine */}
      {activeTab === 'duplicates' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" /> Real-time Duplicate Detection Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                Scans institutional demonstration records for identical 12-digit APAAR identifiers, colliding registration numbers, or duplicate identities across branches.
              </p>
            </div>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning Records…' : 'Run Duplicate Scan'}
            </button>
          </div>

          {detectedDuplicates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
              <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-900">Zero Duplicates Detected</p>
              <p className="text-xs text-slate-500 mt-1">All APAAR IDs and registration numbers are mutually exclusive.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {detectedDuplicates.map((group, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          {group.field === 'apaarId' ? 'APAAR ID Collision' : 'Registration Number Collision'}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-800">{group.value}</span>
                      </div>
                      <p className="text-xs text-rose-700 mt-1 font-medium">{group.reason}</p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 shrink-0">
                      {group.records.length} Conflicting Profiles
                    </span>
                  </div>

                  {/* Conflicting records side-by-side comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {group.records.map((r) => (
                      <div key={r.id} className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-bold text-slate-900">{r.fullName}</p>
                          <span className="font-mono text-[10px] text-slate-500">{r.id}</span>
                        </div>
                        <div className="space-y-1 text-slate-600">
                          <p><span className="text-slate-400">Reg No:</span> <strong className="font-mono">{r.registrationNumber}</strong></p>
                          <p><span className="text-slate-400">Dept:</span> {r.department}</p>
                          <p><span className="text-slate-400">Email:</span> {r.email}</p>
                          <p><span className="text-slate-400">APAAR ID:</span> <span className="font-mono font-bold text-indigo-700">{r.apaarId}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Missing Mandatory Fields */}
      {activeTab === 'missing-fields' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileWarning size={16} className="text-amber-600" /> Incomplete Records with Missing Mandatory Fields
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies student profiles, transcripts, or marksheets missing mandatory AICTE accreditation data points.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {missingFieldRecords.map((item, idx) => (
              <div key={idx} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.type}
                      </span>
                      <span className="font-mono text-xs text-slate-500">({item.id})</span>
                    </div>
                    <p className="font-bold text-slate-900 mt-1 text-sm">
                      {item.name} <span className="text-slate-400 font-normal font-mono text-xs">({item.regNo})</span>
                    </p>
                    <div className="mt-2">
                      <p className="text-[11px] font-bold text-rose-700 mb-1">Missing AICTE Required Fields:</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.missing.map((field, fIdx) => (
                          <span
                            key={fIdx}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold flex items-center gap-1"
                          >
                            <AlertCircle size={11} className="text-rose-600" /> {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                    Action Required
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
