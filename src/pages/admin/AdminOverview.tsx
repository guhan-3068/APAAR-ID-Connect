import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSearch,
  ArrowRight,
  ShieldCheck,
  FileWarning,
  Calendar,
  Search,
  UploadCloud,
  FileCheck2,
  X,
  Bell,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import type { AdminDocumentReviewItem } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: SUMMARY STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
interface SummaryCardProps {
  title: string
  count: number | string
  icon: React.ReactNode
  label: string
  to: string
  colorTheme: {
    border: string
    hoverBorder: string
    bgLight: string
    iconBg: string
    badgeBg: string
    badgeText: string
  }
  badge?: string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  count,
  icon,
  label,
  to,
  colorTheme,
  badge,
}) => (
  <Link
    to={to}
    tabIndex={0}
    role="button"
    aria-label={`${title}: ${count} records. ${label}. Click to view details.`}
    className={`group relative rounded-2xl border ${colorTheme.border} ${colorTheme.hoverBorder} bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-500/40`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className={`p-2.5 rounded-xl ${colorTheme.iconBg} shrink-0 transition-transform group-hover:scale-105`}>
        {icon}
      </div>
      {badge && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorTheme.badgeBg} ${colorTheme.badgeText} shrink-0`}>
          {badge}
        </span>
      )}
    </div>

    <div className="mt-4">
      <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{count}</p>
      <h3 className="text-xs font-bold text-slate-700 mt-1 uppercase tracking-wide">{title}</h3>
      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{label}</p>
    </div>

    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:text-blue-700">
      <span>View records</span>
      <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
    </div>
  </Link>
)

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: DOCUMENT REVIEW & CORRECTION MODAL (FOR WORK QUEUE)
// ─────────────────────────────────────────────────────────────────────────────
interface WorkQueueModalProps {
  doc: AdminDocumentReviewItem
  onClose: () => void
  onUpdate: (
    documentId: string,
    newStatus: AdminDocumentReviewItem['reviewStatus'],
    notes?: string,
    correctedFile?: { fileName: string; fileSize: string }
  ) => void
}

const WorkQueueModal: React.FC<WorkQueueModalProps> = ({ doc, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'correct' | 'reason'>('details')
  const [correctedFileName, setCorrectedFileName] = useState(`corrected_${doc.fileName}`)
  const [reviewNotes, setReviewNotes] = useState(
    'Original paper record inspected and verified by College Registrar. High-resolution digital scan validated and sealed.'
  )
  const [correctionReasonInput, setCorrectionReasonInput] = useState(doc.correctionNotes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    }, 350)
  }

  const handleSaveCorrectionReason = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      onUpdate(
        doc.id,
        'requires_correction',
        correctionReasonInput.trim() || 'Please contact your college management for further information about this document.'
      )
      setIsSubmitting(false)
      onClose()
    }, 350)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <FileCheck2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Document Review & Management Action</h2>
              <p className="text-[11px] text-slate-500 font-mono">{doc.id} • {doc.studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-500 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Important Institutional Workflow Banner */}
          <div className="rounded-xl bg-blue-50/80 border border-blue-200/80 p-3.5 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-blue-950 block">Institutional Responsibility Notice:</strong>
              College management is responsible for correcting college-managed documents. When a document is blurry or has issues, authorized staff must inspect the physical original, upload the corrected digital copy, and validate the record. The system must not instruct students to replace official documents on their own.
            </div>
          </div>

          {/* Document & Student Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 rounded-xl p-3 border border-slate-200/60">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Student</span>
              <span className="font-bold text-slate-900 mt-0.5 block truncate">{doc.studentName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Register No</span>
              <span className="font-mono font-bold text-slate-800 mt-0.5 block">{doc.registrationNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Document</span>
              <span className="font-semibold text-slate-900 mt-0.5 block truncate">{doc.documentType}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Upload Date</span>
              <span className="text-slate-600 mt-0.5 block">{doc.uploadDate}</span>
            </div>
          </div>

          {/* Current Status & Reason Callout */}
          <div className="rounded-xl border p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Current Verification Status:</span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  doc.reviewStatus === 'requires_correction'
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : doc.reviewStatus === 'accepted_for_verification'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : doc.reviewStatus === 'under_review'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {doc.reviewStatus === 'requires_correction'
                  ? 'Requires Correction'
                  : doc.reviewStatus === 'accepted_for_verification'
                  ? 'Accepted / Verified'
                  : doc.reviewStatus === 'under_review'
                  ? 'Under Review'
                  : 'Pending Review'}
              </span>
            </div>

            {doc.correctionNotes && (
              <div className="mt-2 rounded-lg bg-orange-50/80 border border-orange-200 p-3 text-xs text-orange-900">
                <p className="font-bold text-orange-950 flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={14} className="text-orange-600" />
                  Recorded Correction Reason:
                </p>
                <p className="font-medium text-orange-800 pl-5 leading-relaxed">{doc.correctionNotes}</p>
              </div>
            )}
          </div>

          {/* Tabs for Admin Action */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2.5 transition-colors border-b-2 ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Document Details
            </button>
            <button
              onClick={() => setActiveTab('correct')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'correct'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud size={14} />
              Upload Corrected Copy & Verify
            </button>
            <button
              onClick={() => setActiveTab('reason')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'reason'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <AlertCircle size={14} />
              Edit Correction Reason
            </button>
          </div>

          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Digital File Name</span>
                  <p className="font-mono text-slate-800 mt-0.5 truncate">{doc.fileName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">File Size</span>
                  <p className="text-slate-800 mt-0.5">{doc.fileSize}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">SHA-256 Checksum</span>
                  <p className="font-mono text-[10px] text-slate-600 mt-0.5 break-all">{doc.checksum}</p>
                </div>
                {doc.reviewer && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Authorized Reviewer</span>
                    <p className="text-slate-800 mt-0.5">{doc.reviewer}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD CORRECTED COPY & VERIFY */}
          {activeTab === 'correct' && (
            <div className="space-y-3 p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/70 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Select Corrected Digital Scan (from Registrar Scanner / Repository)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="college-modal-file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="college-modal-file"
                    className="cursor-pointer px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-xs"
                  >
                    <UploadCloud size={14} className="text-blue-600" />
                    Browse Corrected File
                  </label>
                  <span className="font-mono text-xs text-slate-700 truncate">{correctedFileName}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Registrar Verification Notes & Seal Confirmation
                </label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Record verification notes, seal identification, and cross-reference."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApproveCorrected}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  Confirm & Seal Corrected Record as Verified
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT CORRECTION REASON */}
          {activeTab === 'reason' && (
            <div className="space-y-3 p-4 bg-orange-50/40 rounded-xl border border-orange-200/70 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Specific Document Correction Reason
                </label>
                <textarea
                  rows={3}
                  value={correctionReasonInput}
                  onChange={(e) => setCorrectionReasonInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  placeholder="Specify the reason why correction is needed (e.g. blurry scan, discrepancy in internal evaluation marks, missing institutional stamp)."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveCorrectionReason}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  Update Correction Notice
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            National Institute of Engineering & Technology • AICTE Code: AICTE-1-4928172
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT: ADMIN OVERVIEW (COLLEGE DASHBOARD)
// ─────────────────────────────────────────────────────────────────────────────
export const AdminOverview: React.FC = () => {
  const navigate = useNavigate()
  const {
    stats,
    documents,
    notifications,
    adminProfile,
    updateDocumentReview,
    markNotificationRead,
  } = useAdmin()

  // Selected document for Work Queue Modal
  const [selectedDoc, setSelectedDoc] = useState<AdminDocumentReviewItem | null>(null)

  // Work Queue filters & sorting
  const [queueFilter, setQueueFilter] = useState<
    'all' | 'awaiting' | 'requires_correction' | 'missing' | 'under_review'
  >('all')
  const [queueSearch, setQueueSearch] = useState('')
  const [queueSort, setQueueSort] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc')

  // Notification filter
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all')

  // Date formatted for header
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // WORK QUEUE ITEMS: Derived from actual institutional documents
  // ─────────────────────────────────────────────────────────────────────────
  const workQueueItems = useMemo(() => {
    return documents.map((doc) => {
      const isMissing =
        doc.reviewStatus === 'pending_review' &&
        (doc.fileName.toLowerCase().includes('not available') || doc.fileName.toLowerCase().includes('missing'))

      let actionRequired = 'Verify document record against university ledger'
      let actionType: 'correction' | 'missing' | 'review' | 'completed' = 'review'

      if (doc.reviewStatus === 'requires_correction') {
        actionType = 'correction'
        actionRequired = doc.correctionNotes
          ? `Review original document: ${doc.correctionNotes}`
          : 'Review original document, upload corrected digital copy, and validate record'
      } else if (isMissing) {
        actionType = 'missing'
        actionRequired = 'Physical original missing from digital repository. Acquire paper copy and deposit digital scan.'
      } else if (doc.reviewStatus === 'under_review') {
        actionType = 'review'
        actionRequired = 'Registrar scrutiny in progress. Attach institutional seal upon verification.'
      } else if (doc.reviewStatus === 'accepted_for_verification') {
        actionType = 'completed'
        actionRequired = 'Record verified and cryptographically sealed.'
      }

      return {
        ...doc,
        isMissing,
        actionRequired,
        actionType,
      }
    })
  }, [documents])

  // Filtered and sorted work queue
  const filteredQueue = useMemo(() => {
    const q = queueSearch.toLowerCase().trim()
    let items = workQueueItems.filter((item) => {
      const matchesSearch =
        !q ||
        item.studentName.toLowerCase().includes(q) ||
        item.registrationNumber.toLowerCase().includes(q) ||
        item.documentType.toLowerCase().includes(q)

      let matchesFilter = true
      if (queueFilter === 'awaiting') {
        matchesFilter = item.reviewStatus === 'pending_review' || item.reviewStatus === 'under_review'
      } else if (queueFilter === 'requires_correction') {
        matchesFilter = item.reviewStatus === 'requires_correction'
      } else if (queueFilter === 'missing') {
        matchesFilter = item.isMissing
      } else if (queueFilter === 'under_review') {
        matchesFilter = item.reviewStatus === 'under_review'
      }

      return matchesSearch && matchesFilter
    })

    // Sorting
    items.sort((a, b) => {
      if (queueSort === 'name_asc') {
        return a.studentName.localeCompare(b.studentName)
      } else if (queueSort === 'date_asc') {
        return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
      } else {
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      }
    })

    return items
  }, [workQueueItems, queueSearch, queueFilter, queueSort])

  // ─────────────────────────────────────────────────────────────────────────
  // ACADEMIC RECORDS PROGRESS: Carefully calculated disjoint counts
  // ─────────────────────────────────────────────────────────────────────────
  const academicProgress = useMemo(() => {
    // Total required marksheets expected across institutional student cohorts:
    // Published (verified marksheets) + Awaiting review (pending marksheets) + Missing required marksheets
    const published = stats.publishedAcademicRecords
    const awaitingReview = Math.max(0, stats.totalAcademicRecords - published)
    const missing = stats.missingDocuments
    const expected = published + awaitingReview + missing
    const uploaded = published + awaitingReview
    const percent = expected > 0 ? Math.round((published / expected) * 100) : 0

    return {
      expected,
      uploaded,
      published,
      awaitingReview,
      missing,
      percent,
    }
  }, [stats])

  // Filtered notifications
  const displayedNotifications = useMemo(() => {
    if (notifFilter === 'unread') {
      return notifications.filter((n) => !n.read)
    }
    return notifications
  }, [notifications, notifFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Modal for viewing & correcting document from work queue */}
      {selectedDoc && (
        <WorkQueueModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdate={updateDocumentReview}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. DASHBOARD HEADER                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-6 sm:p-7 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-bold tracking-wider text-blue-100 uppercase backdrop-blur-xs">
                College Dashboard
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck size={12} /> AICTE Permanent Affiliation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {adminProfile.name}
            </h1>
            <p className="text-blue-100 text-sm mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{adminProfile.institutionName}</span>
              <span>•</span>
              <span>
                AICTE Permanent Institution Code: <strong className="font-mono text-white">{adminProfile.institutionCode}</strong>
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center md:items-end gap-3 text-left md:text-right shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 min-w-[200px]">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold mb-0.5 justify-start md:justify-end">
                <Calendar size={13} />
                <span>{currentDateFormatted}</span>
              </div>
              <p className="text-white text-xs font-bold truncate">
                {adminProfile.name} ({adminProfile.role})
              </p>
              <p className="text-[11px] text-blue-200/80 truncate font-mono">{adminProfile.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. DASHBOARD SUMMARY CARDS (6 RESPONSIVE CARDS)                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Institutional Status Summary
            </h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Summary metrics computed from verified institutional data records
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            Verification Coverage:{' '}
            <strong className="text-slate-900">
              {stats.totalStudents > 0 ? Math.round((stats.verifiedStudents / stats.totalStudents) * 100) : 0}%
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Total Students */}
          <SummaryCard
            title="Total Students"
            count={stats.totalStudents}
            icon={<Users size={22} className="text-blue-600" />}
            label="Total enrolled student records associated with this institution"
            to="/admin/students"
            colorTheme={{
              border: 'border-blue-100',
              hoverBorder: 'hover:border-blue-300',
              bgLight: 'bg-blue-50',
              iconBg: 'bg-blue-50',
              badgeBg: 'bg-blue-100',
              badgeText: 'text-blue-700',
            }}
            badge="Enrolled"
          />

          {/* Card 2: Verified Students */}
          <SummaryCard
            title="Verified Students"
            count={stats.verifiedStudents}
            icon={<CheckCircle2 size={22} className="text-emerald-600" />}
            label="Enrollment verification completed & sealed (not just APAAR ID present)"
            to="/admin/students?status=verified"
            colorTheme={{
              border: 'border-emerald-100',
              hoverBorder: 'hover:border-emerald-300',
              bgLight: 'bg-emerald-50',
              iconBg: 'bg-emerald-50',
              badgeBg: 'bg-emerald-100',
              badgeText: 'text-emerald-700',
            }}
            badge="Verified"
          />

          {/* Card 3: Pending Verification */}
          <SummaryCard
            title="Pending Verification"
            count={stats.pendingVerifications}
            icon={<Clock size={22} className="text-amber-600" />}
            label="Document verification requests awaiting college review or decision"
            to="/admin/verifications?status=pending"
            colorTheme={{
              border: 'border-amber-100',
              hoverBorder: 'hover:border-amber-300',
              bgLight: 'bg-amber-50',
              iconBg: 'bg-amber-50',
              badgeBg: 'bg-amber-100',
              badgeText: 'text-amber-700',
            }}
            badge="Action Required"
          />

          {/* Card 4: Documents Requiring Correction */}
          <SummaryCard
            title="Needs Correction"
            count={stats.documentsRequiringCorrection}
            icon={<AlertTriangle size={22} className="text-orange-600" />}
            label="Scans with blurry pages, missing info, or discrepancies requiring college action"
            to="/admin/documents?status=requires_correction"
            colorTheme={{
              border: 'border-orange-100',
              hoverBorder: 'hover:border-orange-300',
              bgLight: 'bg-orange-50',
              iconBg: 'bg-orange-50',
              badgeBg: 'bg-orange-100',
              badgeText: 'text-orange-800',
            }}
            badge="College Action"
          />

          {/* Card 5: Missing Documents */}
          <SummaryCard
            title="Missing Documents"
            count={stats.missingDocuments}
            icon={<FileWarning size={22} className="text-rose-600" />}
            label="Mandatory required records not yet uploaded to digital repository"
            to="/admin/documents?status=missing"
            colorTheme={{
              border: 'border-rose-100',
              hoverBorder: 'hover:border-rose-300',
              bgLight: 'bg-rose-50',
              iconBg: 'bg-rose-50',
              badgeBg: 'bg-rose-100',
              badgeText: 'text-rose-700',
            }}
            badge="Mandatory"
          />

          {/* Card 6: Published Academic Records */}
          <SummaryCard
            title="Published Records"
            count={stats.publishedAcademicRecords}
            icon={<GraduationCap size={22} className="text-indigo-600" />}
            label="Academic marksheets verified and published for student access"
            to="/admin/academic-records?status=verified"
            colorTheme={{
              border: 'border-indigo-100',
              hoverBorder: 'hover:border-indigo-300',
              bgLight: 'bg-indigo-50',
              iconBg: 'bg-indigo-50',
              badgeBg: 'bg-indigo-100',
              badgeText: 'text-indigo-700',
            }}
            badge="Published"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. ACADEMIC RECORDS PROGRESS SECTION                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Academic Records Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Institutional digital repository coverage across required academic marksheets and degree records
            </p>
          </div>
          <Link
            to="/admin/academic-records"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            Manage all academic records <ArrowRight size={12} />
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Digital Depository Publication Status</span>
            <span className="text-emerald-700 font-extrabold">{academicProgress.percent}% Published</span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{
                width: `${academicProgress.expected > 0 ? (academicProgress.published / academicProgress.expected) * 100 : 0}%`,
              }}
              title={`Published: ${academicProgress.published} records`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{
                width: `${academicProgress.expected > 0 ? (academicProgress.awaitingReview / academicProgress.expected) * 100 : 0}%`,
              }}
              title={`Awaiting Review: ${academicProgress.awaitingReview} records`}
            />
            <div
              className="bg-rose-400 h-full transition-all duration-500"
              style={{
                width: `${academicProgress.expected > 0 ? (academicProgress.missing / academicProgress.expected) * 100 : 0}%`,
              }}
              title={`Missing from Repository: ${academicProgress.missing} records`}
            />
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              Published ({academicProgress.published})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
              Awaiting Review ({academicProgress.awaitingReview})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
              Missing from Digital Repository ({academicProgress.missing})
            </span>
          </div>
        </div>

        {/* Breakdown Metric Tiles (Disjoint & clearly defined) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Required Expected</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{academicProgress.expected}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Enrolled mandatory records</p>
          </div>

          <div className="rounded-xl bg-blue-50/50 p-3 border border-blue-100">
            <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider">Records Uploaded</p>
            <p className="text-lg font-extrabold text-blue-900 mt-0.5">{academicProgress.uploaded}</p>
            <p className="text-[10px] text-blue-700/80 mt-0.5">Received in digital archive</p>
          </div>

          <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
            <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Records Published</p>
            <p className="text-lg font-extrabold text-emerald-900 mt-0.5">{academicProgress.published}</p>
            <p className="text-[10px] text-emerald-700/80 mt-0.5">Available to students</p>
          </div>

          <div className="rounded-xl bg-amber-50/50 p-3 border border-amber-100">
            <p className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Awaiting Review</p>
            <p className="text-lg font-extrabold text-amber-900 mt-0.5">{academicProgress.awaitingReview}</p>
            <p className="text-[10px] text-amber-700/80 mt-0.5">Scrutiny pending decision</p>
          </div>

          <div className="rounded-xl bg-rose-50/50 p-3 border border-rose-100 col-span-2 sm:col-span-1">
            <p className="text-[10px] text-rose-600 uppercase font-bold tracking-wider">Records Missing</p>
            <p className="text-lg font-extrabold text-rose-900 mt-0.5">{academicProgress.missing}</p>
            <p className="text-[10px] text-rose-700/80 mt-0.5">Pending college deposit</p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. VERIFICATION WORK QUEUE SECTION                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-blue-600" />
                Verification Work Queue
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Active queue of document verifications, corrections, and missing records for{' '}
                <strong className="text-slate-700">{adminProfile.institutionName}</strong>
              </p>
            </div>

            {/* Quick stats badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                {filteredQueue.length} item{filteredQueue.length !== 1 ? 's' : ''} in view
              </span>
            </div>
          </div>

          {/* Institutional Policy Workflow Banner */}
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-950">Important Institutional Workflow:</strong> College
              management is responsible for correcting college-managed documents. If a document is blurry or contains
              errors, the dashboard directs authorized college staff to review the original record and correct the
              digital file. <em>It must not instruct the student to upload a replacement automatically.</em>
            </div>
          </div>

          {/* Filters, Search, and Sorting Bar */}
          <div className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All Items' },
                { id: 'awaiting', label: 'Awaiting Verification' },
                { id: 'requires_correction', label: 'Requires Correction' },
                { id: 'missing', label: 'Missing Documents' },
                { id: 'under_review', label: 'Under Review' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQueueFilter(tab.id as typeof queueFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    queueFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search and Sort Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative flex-1 sm:w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student, reg no…"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <select
                value={queueSort}
                onChange={(e) => setQueueSort(e.target.value as typeof queueSort)}
                aria-label="Sort queue records"
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Student Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table of Verification Work Queue Items */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Upload / Submission Date</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-5">Action Required</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-semibold">No work queue items match the current filter or search criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">All institutional records in this category are up to date.</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Name */}
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div>
                        <span>{item.studentName}</span>
                        <span className="block text-[10px] font-normal text-slate-500 truncate max-w-[180px]">
                          {item.department}
                        </span>
                      </div>
                    </td>

                    {/* Register Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {item.registrationNumber}
                    </td>

                    {/* Document Name */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{item.documentType}</span>
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[180px] block">
                        {item.fileName}
                      </span>
                    </td>

                    {/* Upload / Submission Date */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {item.uploadDate}
                    </td>

                    {/* Current Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.reviewStatus === 'requires_correction'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : item.isMissing
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.reviewStatus === 'accepted_for_verification'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.reviewStatus === 'under_review'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {item.reviewStatus === 'requires_correction'
                          ? 'Requires Correction'
                          : item.isMissing
                          ? 'Missing Document'
                          : item.reviewStatus === 'accepted_for_verification'
                          ? 'Verified'
                          : item.reviewStatus === 'under_review'
                          ? 'Under Review'
                          : 'Pending Review'}
                      </span>
                    </td>

                    {/* Action Required */}
                    <td className="py-3.5 px-5">
                      <div className="max-w-xs">
                        {item.reviewStatus === 'requires_correction' ? (
                          <div className="rounded-lg bg-orange-50 border border-orange-200 p-2 text-[11px] text-orange-900 leading-snug">
                            <strong className="font-bold text-orange-950 block">College Action:</strong>
                            {item.correctionNotes || 'Inspect paper original, upload corrected digital record, and validate.'}
                          </div>
                        ) : item.isMissing ? (
                          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-[11px] text-rose-900 leading-snug">
                            <strong className="font-bold text-rose-950 block">Missing in Repository:</strong>
                            Acquire original physical copy at Registrar counter and upload.
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px] font-medium leading-snug block">
                            {item.actionRequired}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* View Details Button */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDoc(item)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 hover:text-blue-800 transition-colors border border-blue-200/80 shadow-2xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 5. IMPORTANT NOTIFICATIONS                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="w-full">
        {/* SECTION: IMPORTANT NOTIFICATIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Bell size={18} className="text-blue-600" />
                  Important Notifications
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real institutional alerts and student submissions requiring administrative attention
                </p>
              </div>

              {/* Filter Unread */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setNotifFilter(notifFilter === 'unread' ? 'all' : 'unread')}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                    notifFilter === 'unread'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {notifFilter === 'unread' ? 'Showing Unread' : 'Filter Unread'}
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {displayedNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No notifications matching your filter.
                </div>
              ) : (
                displayedNotifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 flex items-start gap-3 transition-colors hover:bg-slate-50/70 ${
                      !notif.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div
                      className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${
                        notif.read ? 'bg-slate-300' : 'bg-blue-600 animate-pulse'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        {notif.actionUrl ? (
                          <button
                            onClick={() => {
                              markNotificationRead(notif.id)
                              navigate(notif.actionUrl!)
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <span>Take Action</span>
                            <ArrowRight size={11} />
                          </button>
                        ) : (
                          <span />
                        )}

                        {!notif.read && (
                          <button
                            onClick={() => markNotificationRead(notif.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Notification Centre</span>
            <Link
              to="/admin/notifications"
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              View all notifications <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 6. QUICK ADMINISTRATIVE ACTIONS                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileSearch size={16} className="text-indigo-600" /> Authorized Institutional Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Student Directory',
              to: '/admin/students',
              icon: <Users size={18} className="text-blue-600" />,
              bg: 'bg-blue-50',
              desc: 'Inspect enrolled records',
            },
            {
              label: 'Verification Requests',
              to: '/admin/verifications?status=pending',
              icon: <ClipboardCheck size={18} className="text-amber-600" />,
              bg: 'bg-amber-50',
              desc: 'Approve & decision requests',
            },
            {
              label: 'Document Corrections',
              to: '/admin/documents?status=requires_correction',
              icon: <AlertTriangle size={18} className="text-orange-600" />,
              bg: 'bg-orange-50',
              desc: 'Inspect blurry scans & files',
            },
            {
              label: 'Academic Records',
              to: '/admin/academic-records?status=verified',
              icon: <GraduationCap size={18} className="text-indigo-600" />,
              bg: 'bg-indigo-50',
              desc: 'Published marksheets & ledger',
            },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex flex-col items-center gap-2 rounded-xl p-4 hover:shadow-md transition-all border border-slate-100 hover:border-blue-200 group text-center bg-slate-50/40"
            >
              <div className={`p-2.5 rounded-xl ${action.bg} group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">{action.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{action.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
