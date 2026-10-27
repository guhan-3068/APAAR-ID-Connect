import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  ChevronUp,
  XCircle,
  Check,
  FileText,
  ShieldAlert,
  AlertCircle,
  Download,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { verificationService, downloadCsv } from '@/services/appDataService'
import type { AdminVerificationRequestItem } from '@/types'

const ITEMS_PER_PAGE = 6

type VRStatus = AdminVerificationRequestItem['status']

const statusConfig: Record<VRStatus, { label: string; cls: string }> = {
  submitted: { label: 'Submitted', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  under_review: { label: 'Under Review', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  accepted_for_verification: { label: 'Accepted', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  requires_info: { label: 'Info Required', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  verified: { label: 'Verified', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  flagged: { label: 'Flagged', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border border-red-200' },
}

const StatusBadge: React.FC<{ status: VRStatus }> = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${cfg.cls}`}>{cfg.label}</span>
}

const timelineStageIcon = (status: 'completed' | 'current' | 'pending') => {
  if (status === 'completed')
    return (
      <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
        <CheckCircle2 size={12} className="text-white" />
      </div>
    )
  if (status === 'current')
    return (
      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center animate-pulse shrink-0">
        <Clock size={12} className="text-white" />
      </div>
    )
  return <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-white shrink-0" />
}

// Rejection Modal requiring a mandatory rejection reason
const RejectModal: React.FC<{
  req: AdminVerificationRequestItem
  onClose: () => void
  onConfirm: (reason: string) => void
}> = ({ req, onClose, onConfirm }) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const presetReasons = [
    'Mismatched grades/SGPA between uploaded marksheet and examination department ledger.',
    'APAAR ID digits do not correspond to the submitted student registration profile.',
    'Institutional stamp or authorized signature missing from uploaded academic transcript.',
    'Document illegible, cropped, or checksum verification failed.',
    'Incomplete marksheet submission; practical / lab component grades are missing.',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a specific rejection reason. This reason will be logged in the permanent audit trail.')
      return
    }
    onConfirm(reason.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-rose-900">Reject Verification Request</h2>
              <p className="text-[11px] text-rose-700 font-mono">{req.referenceNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-rose-100/70 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Student Name</p>
                <p className="font-bold text-slate-800">{req.studentName} ({req.registrationNumber})</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px] uppercase font-bold">Record Type</p>
                <p className="font-semibold text-slate-700">{req.academicRecordType}</p>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="rejection-reason" className="block text-xs font-bold text-slate-800 mb-1.5">
              Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
            </label>
            <textarea
              id="rejection-reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (error) setError('')
              }}
              placeholder="State the exact discrepancy or non-compliance reason for rejecting this record..."
              className={`w-full rounded-xl border p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/30 ${
                error ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 bg-white'
              }`}
            />
            {error && <p className="text-[11px] text-rose-600 font-medium mt-1">{error}</p>}
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-600 mb-1.5">Quick Reason Suggestions:</p>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {presetReasons.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setReason(preset)
                    setError('')
                  }}
                  className="w-full text-left text-[11px] text-slate-600 p-2 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-800 border border-slate-100 hover:border-rose-200 transition-colors"
                >
                  &bull; {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 leading-relaxed">
            <span className="font-bold">Compliance Note:</span> This rejection will be permanently recorded in the institutional audit log and visible in the student notification centre.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <XCircle size={14} /> Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Approval Confirmation Modal
const ApproveModal: React.FC<{
  req: AdminVerificationRequestItem
  onClose: () => void
  onConfirm: (notes?: string) => void
}> = ({ req, onClose, onConfirm }) => {
  const [notes, setNotes] = useState('All grades and APAAR demographic credentials verified against examination ledger.')

  const handleConfirm = () => {
    onConfirm(notes)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-emerald-950">Approve Student Verification</h2>
              <p className="text-[11px] text-emerald-700 font-mono">{req.referenceNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-emerald-100/70 text-slate-500">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200">
            <p className="text-slate-400 text-[10px] uppercase font-bold">Candidate</p>
            <p className="font-bold text-slate-900 text-sm mt-0.5">{req.studentName}</p>
            <p className="text-slate-500 font-mono text-[11px]">{req.registrationNumber} • {req.academicRecordType}</p>
          </div>

          <div>
            <label htmlFor="approve-notes" className="block text-xs font-bold text-slate-800 mb-1.5">
              Reviewer Approval Notes (Optional)
            </label>
            <textarea
              id="approve-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-900 leading-relaxed">
            Approving this record will mark it as <strong>Verified</strong>, synchronize credentials with the student profile, and create an official entry in the verification records.
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check size={14} /> Approve & Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Full Details Modal
const VerificationDetailModal: React.FC<{
  req: AdminVerificationRequestItem
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}> = ({ req, onClose, onApprove, onReject }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-blue-600" /> Verification Request Dossier
        </h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500">
          <X size={16} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reference Code</p>
            <p className="font-mono text-sm font-bold text-blue-700">{req.referenceNo}</p>
          </div>
          <StatusBadge status={req.status} />
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {[
            { label: 'Student Name', value: req.studentName },
            { label: 'Registration Number', value: req.registrationNumber },
            { label: 'Academic Credential', value: req.academicRecordType },
            { label: 'Submission Date', value: req.submissionDate },
            { label: 'Assigned Reviewer', value: req.assignedReviewer },
            { label: 'Last Updated', value: req.lastUpdated },
          ].map((f) => (
            <div key={f.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.label}</p>
              <p className="font-semibold text-slate-800 mt-0.5">{f.value}</p>
            </div>
          ))}
        </div>

        {req.internalNotes && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-800 mb-1 flex items-center gap-1.5">
              <FileText size={13} /> Internal Administrative Notes
            </p>
            <p className="text-xs text-blue-700 leading-relaxed">{req.internalNotes}</p>
          </div>
        )}

        {req.decisionReason && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
              <AlertCircle size={13} /> Decision / Rejection Reason
            </p>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">{req.decisionReason}</p>
          </div>
        )}

        {/* Action Bar inside Modal if pending */}
        {req.status !== 'verified' && req.status !== 'rejected' && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Administrator Decision</p>
              <p className="text-[11px] text-slate-500">Approve or reject this submitted demonstration record.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose()
                  onReject()
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => {
                  onClose()
                  onApprove()
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1"
              >
                <Check size={13} /> Approve Record
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-indigo-600" /> Review Timeline & History
          </p>
          <div className="space-y-3 pl-1">
            {req.timeline.map((stage, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {timelineStageIcon(stage.status)}
                  {idx < req.timeline.length - 1 && (
                    <div
                      className={`w-px flex-1 mt-1 ${
                        stage.status === 'completed' ? 'bg-emerald-300' : 'bg-slate-200'
                      }`}
                      style={{ minHeight: 18 }}
                    />
                  )}
                </div>
                <div className="pb-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className={`text-xs font-bold ${stage.status === 'pending' ? 'text-slate-400' : 'text-slate-900'}`}>
                      {stage.stage}
                    </p>
                    {stage.timestamp && <span className="text-[10px] text-slate-400 font-mono">{stage.timestamp}</span>}
                  </div>
                  {stage.actor && <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">{stage.actor}</p>}
                  {stage.note && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{stage.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-5 flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200">
          Close
        </button>
      </div>
    </div>
  </div>
)

export const AdminVerificationRequests: React.FC = () => {
  const { verificationRequests, approveVerification, rejectVerification, showToast } = useAdmin()

  const [searchParams] = useSearchParams()
  const initialParam = searchParams.get('status')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | VRStatus>(
    initialParam === 'pending' ? 'pending' : (initialParam as VRStatus) || 'all'
  )
  const [page, setPage] = useState(1)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s === 'pending') {
      setStatusFilter('pending')
      setPage(1)
    } else if (s && ['submitted', 'under_review', 'accepted_for_verification', 'requires_info', 'verified', 'flagged', 'rejected'].includes(s)) {
      setStatusFilter(s as VRStatus)
      setPage(1)
    } else if (s === 'all') {
      setStatusFilter('all')
      setPage(1)
    }
  }, [searchParams])

  const handleExportCsv = () => {
    const csv = verificationService.exportCsv({
      search,
      status: statusFilter === 'pending' ? 'submitted' : statusFilter,
    })
    downloadCsv(csv, `NIET_Verification_Requests_${new Date().toISOString().split('T')[0]}.csv`)
    showToast('Verification requests queue exported as CSV.', 'success')
  }
  const [selected, setSelected] = useState<AdminVerificationRequestItem | null>(null)
  const [rejectingItem, setRejectingItem] = useState<AdminVerificationRequestItem | null>(null)
  const [approvingItem, setApprovingItem] = useState<AdminVerificationRequestItem | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return verificationRequests.filter((r) => {
      const matchesSearch =
        !q ||
        r.studentName.toLowerCase().includes(q) ||
        r.referenceNo.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q) ||
        r.academicRecordType.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending'
          ? r.status === 'submitted' || r.status === 'under_review' || r.status === 'requires_info'
          : r.status === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [verificationRequests, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = {
    total: verificationRequests.length,
    pending: verificationRequests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length,
    verified: verificationRequests.filter((r) => r.status === 'verified').length,
    rejected: verificationRequests.filter((r) => r.status === 'rejected').length,
    flagged: verificationRequests.filter((r) => r.status === 'flagged').length,
  }

  const handleApprove = (req: AdminVerificationRequestItem) => {
    setApprovingItem(req)
  }

  const handleReject = (req: AdminVerificationRequestItem) => {
    setRejectingItem(req)
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Full Details Modal */}
      {selected && (
        <VerificationDetailModal
          req={selected}
          onClose={() => setSelected(null)}
          onApprove={() => handleApprove(selected)}
          onReject={() => handleReject(selected)}
        />
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <RejectModal
          req={rejectingItem}
          onClose={() => setRejectingItem(null)}
          onConfirm={(reason) => rejectVerification(rejectingItem.id, reason)}
        />
      )}

      {/* Approve Modal */}
      {approvingItem && (
        <ApproveModal
          req={approvingItem}
          onClose={() => setApprovingItem(null)}
          onConfirm={(notes) => approveVerification(approvingItem.id, notes)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Requests', value: stats.total, icon: <ClipboardCheck size={16} className="text-blue-600" />, color: 'border-blue-100' },
          { label: 'Pending / In Review', value: stats.pending, icon: <Clock size={16} className="text-amber-600" />, color: 'border-amber-100' },
          { label: 'Verified & Approved', value: stats.verified, icon: <CheckCircle2 size={16} className="text-emerald-600" />, color: 'border-emerald-100' },
          { label: 'Rejected / Flagged', value: stats.rejected + stats.flagged, icon: <AlertTriangle size={16} className="text-rose-600" />, color: 'border-rose-100' },
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

      {/* Requests Queue Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filter Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="vr-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search reference, student name…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} className="text-slate-400" />
            <select
              id="vr-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter)
                setPage(1)
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 font-medium"
            >
              <option value="all">All Verification Statuses</option>
              {Object.entries(statusConfig).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
              title="Export verification queue as CSV"
            >
              <Download size={13} className="text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="divide-y divide-slate-100">
          {paginated.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ClipboardCheck size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-800">No Verification Requests Found</p>
              <p className="text-xs text-slate-500 mt-1">No requests match your search criteria.</p>
            </div>
          ) : (
            paginated.map((req) => (
              <div key={req.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700">{req.referenceNo}</span>
                      <StatusBadge status={req.status} />
                      <span className="text-[10px] text-slate-400">Submitted: {req.submissionDate}</span>
                    </div>

                    <p className="font-bold text-slate-900 mt-1 text-sm">
                      {req.studentName}{' '}
                      <span className="text-slate-400 font-normal text-xs font-mono">({req.registrationNumber})</span>
                    </p>

                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {req.academicRecordType}
                    </p>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>Reviewer: {req.assignedReviewer}</span>
                      <span>•</span>
                      <span>Updated: {req.lastUpdated}</span>
                    </div>

                    {req.decisionReason && (
                      <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 leading-relaxed">
                        <strong>Rejection Reason:</strong> {req.decisionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status !== 'verified' && req.status !== 'rejected' && (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 shadow-xs transition-colors flex items-center gap-1"
                          title="Approve verification request"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
                          title="Reject verification request with mandatory reason"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                      aria-label="Toggle timeline view"
                      title={expandedId === req.id ? 'Collapse timeline' : 'Expand timeline'}
                    >
                      {expandedId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <button
                      onClick={() => setSelected(req)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Full Details
                    </button>
                  </div>
                </div>

                {/* Inline mini-timeline */}
                {expandedId === req.id && (
                  <div className="mt-4 pt-3 border-t border-slate-100 pl-3 border-l-2 border-l-blue-200 space-y-2.5 bg-slate-50/60 rounded-r-xl p-3">
                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Stage Progression:</p>
                    {req.timeline.map((stage, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">{timelineStageIcon(stage.status)}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-bold ${stage.status === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>
                              {stage.stage}
                            </p>
                            {stage.timestamp && <span className="text-[10px] text-slate-400 font-mono">{stage.timestamp}</span>}
                          </div>
                          {stage.note && <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{stage.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} requests
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
