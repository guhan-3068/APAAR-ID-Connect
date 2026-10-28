import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  ShieldCheck,
  FileCheck2,
  AlertCircle
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { UploadStudentDocModal } from '@/components/admin/UploadStudentDocModal'
import type { AdminDocumentReviewItem } from '@/types'

const ITEMS_PER_PAGE = 8

type ReviewStatus = AdminDocumentReviewItem['reviewStatus']

const statusConfig: Record<ReviewStatus, { label: string; cls: string }> = {
  pending_review: { label: 'Pending Review', cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
  under_review: { label: 'Under Review', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  accepted_for_verification: { label: 'Accepted / Verified', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  requires_correction: { label: 'Needs Correction', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  rejected: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
}

const StatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  const cfg = statusConfig[status]
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
}

const DocDetailModal: React.FC<{
  doc: AdminDocumentReviewItem
  onClose: () => void
  onUpdate: (
    documentId: string,
    newStatus: AdminDocumentReviewItem['reviewStatus'],
    notes?: string,
    correctedFile?: { fileName: string; fileSize: string }
  ) => void
}> = ({ doc, onClose, onUpdate }) => {
  const [activeAction, setActiveAction] = useState<'view' | 'upload_correct' | 'request_correction'>('view')
  const [correctedFileName, setCorrectedFileName] = useState(`corrected_${doc.fileName}`)
  const [reviewNotes, setReviewNotes] = useState(
    'Physical original document verified in person by Registrar. High-resolution digital scan validated and sealed.'
  )
  const [correctionReasonInput, setCorrectionReasonInput] = useState(doc.correctionNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCorrectedFileName(file.name)
    }
  }

  const handleApproveCorrected = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      onUpdate(
        doc.id,
        'accepted_for_verification',
        reviewNotes.trim() || 'Corrected original document verified by College Registrar and cryptographically sealed.',
        { fileName: correctedFileName, fileSize: '1.4 MB' }
      )
      setIsSubmitting(false)
      onClose()
    }, 400)
  }

  const handleUpdateCorrection = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      onUpdate(
        doc.id,
        'requires_correction',
        correctionReasonInput.trim() || 'Please contact your college management for further information about this document.'
      )
      setIsSubmitting(false)
      onClose()
    }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileCheck2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">College Document Review & Correction</h2>
              <p className="text-[11px] text-slate-500">Institutional management review authority</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Document Summary Header */}
          <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg border border-slate-200">
              <FileSearch size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900">{doc.fileName}</p>
              <p className="text-xs text-slate-500">{doc.fileSize} • Uploaded {doc.uploadDate}</p>
            </div>
            <StatusBadge status={doc.reviewStatus} />
          </div>

          {/* Student & Department Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              { label: 'Student', value: doc.studentName },
              { label: 'Reg. Number', value: doc.registrationNumber },
              { label: 'Department', value: doc.department },
              { label: 'Document Type', value: doc.documentType },
              { label: 'Upload Date', value: doc.uploadDate },
              { label: 'Reviewer', value: doc.reviewer ?? 'Dr. S. K. Kulkarni (Registrar)' },
            ].map((f) => (
              <div key={f.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold">{f.label}</p>
                <p className="font-semibold text-slate-800 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Correction Reason Notice */}
          {doc.correctionNotes && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 space-y-1">
              <p className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-orange-600" />
                Active Correction Reason:
              </p>
              <p className="text-xs text-orange-950 font-medium">{doc.correctionNotes}</p>
            </div>
          )}

          {doc.rejectionReason && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
              <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Rejection Reason (Data Quality Alert)
              </p>
              <p className="text-xs text-rose-600">{doc.rejectionReason}</p>
            </div>
          )}

          {/* College Management Interactive Action Panel */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-700" />
                College Management Actions:
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveAction(activeAction === 'upload_correct' ? 'view' : 'upload_correct')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeAction === 'upload_correct'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  Upload Corrected Copy & Verify
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAction(activeAction === 'request_correction' ? 'view' : 'request_correction')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeAction === 'request_correction'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white text-orange-700 hover:bg-orange-100 border border-orange-200'
                  }`}
                >
                  Edit Correction Reason
                </button>
              </div>
            </div>

            {/* ACTION 1: Upload Corrected Digital Copy & Mark Verified */}
            {activeAction === 'upload_correct' && (
              <div className="pt-2 border-t border-blue-200/60 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Corrected Document Digital Copy (PDF / Scan)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      id="college-doc-file"
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                    <label
                      htmlFor="college-doc-file"
                      className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      <UploadCloud size={14} className="text-blue-600" />
                      Browse File
                    </label>
                    <span className="text-xs text-slate-600 font-mono truncate">{correctedFileName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Registrar Verification & Seal Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Provide official registrar notes regarding physical verification and seal."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveAction('view')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveCorrected}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 size={14} />
                    Confirm & Update Student Record to Verified
                  </button>
                </div>
              </div>
            )}

            {/* ACTION 2: Update Correction Reason for Student */}
            {activeAction === 'request_correction' && (
              <div className="pt-2 border-t border-orange-200/60 space-y-3 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Specific Correction Reason for Student
                  </label>
                  <textarea
                    value={correctionReasonInput}
                    onChange={(e) => setCorrectionReasonInput(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    placeholder="e.g. The uploaded document is blurry and some information is unreadable."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    This reason and instruction to visit the college office will be displayed directly on the Student Portal.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveAction('view')}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateCorrection}
                    disabled={isSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 flex items-center gap-1.5 shadow-xs"
                  >
                    <AlertCircle size={14} />
                    Save & Notify Student
                  </button>
                </div>
              </div>
            )}

            {activeAction === 'view' && (
              <p className="text-[11px] text-blue-900 leading-relaxed">
                Authorized college management staff can upload corrected digital copies and update verification statuses. Updates are automatically reflected in the Student Portal and a student notification is dispatched.
              </p>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Document Checksum</p>
            <p className="text-[10px] font-mono text-slate-500 break-all">{doc.checksum}</p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">APAAR Academic Depository Record</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export const AdminDocumentReview: React.FC = () => {
  const { documents, adminProfile, updateDocumentReview } = useAdmin()
  const [searchParams] = useSearchParams()
  const initialParam = searchParams.get('status')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'missing' | ReviewStatus>(
    initialParam === 'missing' ? 'missing' : (initialParam as ReviewStatus) || 'all'
  )
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminDocumentReviewItem | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s === 'missing') {
      setStatusFilter('missing')
      setPage(1)
    } else if (s && ['pending_review', 'under_review', 'accepted_for_verification', 'requires_correction', 'rejected'].includes(s)) {
      setStatusFilter(s as ReviewStatus)
      setPage(1)
    } else if (s === 'all') {
      setStatusFilter('all')
      setPage(1)
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return documents.filter((d) => {
      const matchesSearch =
        !q ||
        d.studentName.toLowerCase().includes(q) ||
        d.registrationNumber.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'missing'
          ? (d.fileName.toLowerCase().includes('not available') || d.fileName.toLowerCase().includes('missing'))
          : d.reviewStatus === statusFilter)
      return matchesSearch && matchesStatus
    })
  }, [documents, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const stats = {
    total: documents.length,
    accepted: documents.filter((d) => d.reviewStatus === 'accepted_for_verification').length,
    pending: documents.filter((d) => d.reviewStatus === 'pending_review' || d.reviewStatus === 'under_review').length,
    attention: documents.filter((d) => d.reviewStatus === 'requires_correction' || d.reviewStatus === 'rejected').length,
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {selected && (
        <DocDetailModal
          doc={selected}
          onClose={() => setSelected(null)}
          onUpdate={updateDocumentReview}
        />
      )}

      {showUploadModal && (
        <UploadStudentDocModal
          onClose={() => setShowUploadModal(false)}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Documents', value: stats.total, icon: <FileSearch size={16} className="text-blue-600" />, color: 'border-blue-100' },
          { label: 'Accepted / Verified', value: stats.accepted, icon: <CheckCircle2 size={16} className="text-emerald-600" />, color: 'border-emerald-100' },
          { label: 'Under Review', value: stats.pending, icon: <Clock size={16} className="text-amber-600" />, color: 'border-amber-100' },
          { label: 'Needs Correction', value: stats.attention, icon: <AlertTriangle size={16} className="text-rose-600" />, color: 'border-rose-100' },
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
              id="doc-search"
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search student, document type…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-slate-400" />
            <select
              id="doc-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusConfig).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors ml-auto sm:ml-0"
              title="Upload an official academic document or marksheet for a student"
            >
              <UploadCloud size={13} />
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left text-[11px] text-slate-500 font-bold uppercase tracking-wide">
                <th className="px-5 py-3">Document</th>
                <th className="px-4 py-3 hidden sm:table-cell">Student</th>
                <th className="px-4 py-3 hidden md:table-cell">Department</th>
                <th className="px-4 py-3 hidden lg:table-cell">Uploaded</th>
                <th className="px-4 py-3 hidden lg:table-cell">Reviewer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    {documents.length === 0 ? 'No student documents have been submitted for review.' : 'No documents match the current filters.'}
                  </td>
                </tr>
              ) : (
                paginated.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900 truncate max-w-[160px]">{d.fileName}</p>
                      <p className="text-slate-400">{d.documentType} • {d.fileSize}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="font-semibold text-slate-800">{d.studentName}</p>
                      <p className="text-slate-400 font-mono">{d.registrationNumber}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600 max-w-[120px] truncate">{d.department}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{d.uploadDate}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{d.reviewer ?? (adminProfile?.name || 'Administrator')}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.reviewStatus} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(d)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Review / Correct
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} documents</span>
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
