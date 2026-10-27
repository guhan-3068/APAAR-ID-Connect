/**
 * BulkDocumentPanel — Department-wise Bulk Document Management
 * Embedded inside the existing AdminStudents page (Student Management section).
 *
 * Workflow:
 * 1. Select Department
 * 2. Upload Excel/CSV + PDF files
 * 3. Verify & Upload → validation preview
 * 4. Confirm → commit to store
 * 5. Per-document Verify / Publish
 * 6. Missing-document reports
 * 7. Dashboard metrics
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  FileSpreadsheet,
  FileBadge,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileCheck2,
  Globe,
  FileWarning,
  Info,
  Users,
  BookOpen,
  ShieldCheck,
  Eye,
  X,
  Download,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import {
  SUPPORTED_DEPARTMENTS,
  ACCEPTED_DOCUMENT_TYPES,
  parseSpreadsheet,
  validateBulkRows,
  commitValidatedRows,
  getMissingDocumentReports,
  getBulkDashboardMetrics,
  getBulkDocuments,
  verifyDocument,
  publishDocument,
  formatBytes,
} from '@/services/bulkDocumentService'
import type {
  SpreadsheetRow,
  UploadedDocumentFile,
  BulkValidationSummary,
  ValidatedBulkRow,
  BulkRowValidationStatus,
  StoredBulkDocument,
} from '@/services/bulkDocumentService'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const statusColor: Record<BulkRowValidationStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  missing_file: 'bg-amber-50 text-amber-700 border-amber-200',
  student_not_found: 'bg-red-50 text-red-700 border-red-200',
  dept_mismatch: 'bg-orange-50 text-orange-700 border-orange-200',
  duplicate: 'bg-rose-50 text-rose-700 border-rose-200',
  missing_fields: 'bg-red-50 text-red-700 border-red-200',
  invalid_doc_type: 'bg-purple-50 text-purple-700 border-purple-200',
  conflict: 'bg-blue-50 text-blue-700 border-blue-200',
  manual_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

const statusLabel: Record<BulkRowValidationStatus, string> = {
  valid: 'Valid',
  missing_file: 'No File',
  student_not_found: 'Not Found',
  dept_mismatch: 'Dept Mismatch',
  duplicate: 'Duplicate',
  missing_fields: 'Missing Fields',
  invalid_doc_type: 'Invalid Type',
  conflict: 'Conflict',
  manual_review: 'Manual Review',
}

const verStatusColor: Record<StoredBulkDocument['verificationStatus'], string> = {
  pending: 'bg-amber-50 text-amber-700',
  under_review: 'bg-blue-50 text-blue-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  requires_correction: 'bg-orange-50 text-orange-700',
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD
// ─────────────────────────────────────────────────────────────────────────────

const MetricCard: React.FC<{
  label: string
  value: number
  accent: string
  icon: React.ReactNode
  clickable?: boolean
  onClick?: () => void
}> = ({ label, value, accent, icon, clickable, onClick }) => (
  <button
    onClick={onClick}
    disabled={!clickable}
    className={`flex items-center gap-3 bg-white rounded-xl border p-4 shadow-xs text-left w-full transition-all ${
      clickable ? 'hover:shadow-sm hover:border-blue-200 cursor-pointer' : 'cursor-default'
    } ${accent}`}
  >
    <div className="p-2 rounded-lg bg-slate-50">{icon}</div>
    <div>
      <p className="text-xl font-extrabold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  </button>
)

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ROW
// ─────────────────────────────────────────────────────────────────────────────

const ValidationRowItem: React.FC<{ vRow: ValidatedBulkRow; idx?: number }> = ({ vRow }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-xl border text-xs ${statusColor[vRow.status]} mb-1.5 overflow-hidden`}>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="font-bold text-[10px] bg-white/60 px-1.5 py-0.5 rounded-md border">
            Row {vRow.row.rawRow}
          </span>
          <span className="font-semibold truncate">{vRow.row.studentName}</span>
          <span className="text-[10px] opacity-70 font-mono truncate hidden sm:inline">{vRow.row.registerNumber}</span>
          <span className="text-[10px] opacity-70 truncate hidden md:inline">{vRow.row.documentType}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor[vRow.status]}`}>
            {statusLabel[vRow.status]}
          </span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-current/20 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { l: 'APAAR ID', v: vRow.row.apaarId || '—' },
              { l: 'Department', v: vRow.row.department || '—' },
              { l: 'Academic Year', v: vRow.row.academicYear || '—' },
              { l: 'Semester', v: vRow.row.semester || '—' },
              { l: 'Document Type', v: vRow.row.documentType },
              { l: 'Matched File', v: vRow.matchedFile?.name || 'None' },
            ].map((f) => (
              <div key={f.l} className="bg-white/60 rounded-lg p-2">
                <p className="text-[9px] uppercase font-bold opacity-60">{f.l}</p>
                <p className="font-semibold truncate">{f.v}</p>
              </div>
            ))}
          </div>
          {vRow.errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase opacity-70 flex items-center gap-1">
                <XCircle size={11} /> Errors
              </p>
              <ul className="space-y-0.5">
                {vRow.errors.map((e, i) => (
                  <li key={i} className="text-[11px] leading-relaxed">• {e}</li>
                ))}
              </ul>
            </div>
          )}
          {vRow.warnings.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase opacity-70 flex items-center gap-1">
                <AlertTriangle size={11} /> Warnings
              </p>
              <ul className="space-y-0.5">
                {vRow.warnings.map((w, i) => (
                  <li key={i} className="text-[11px] leading-relaxed">• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STORED DOCUMENT CARD
// ─────────────────────────────────────────────────────────────────────────────

const StoredDocCard: React.FC<{
  doc: StoredBulkDocument
  adminEmail: string
  adminName: string
  onRefresh: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}> = ({ doc, adminEmail, adminName, onRefresh, showToast }) => {
  const [showPreview, setShowPreview] = useState(false)

  const handleVerify = () => {
    const result = verifyDocument(doc.id, adminEmail, adminName)
    if (result) {
      showToast(`"${doc.documentType}" verified for ${doc.registerNumber}.`, 'success')
      onRefresh()
    }
  }

  const handlePublish = () => {
    const result = publishDocument(doc.id, adminEmail, adminName)
    if (result) {
      showToast(`"${doc.documentType}" published to Student Portal for ${doc.registerNumber}.`, 'success')
      onRefresh()
    } else {
      showToast('Document must be verified before publishing.', 'error')
    }
  }

  const handleDownload = () => {
    if (!doc.fileDataUrl) {
      showToast('File data not available in this demonstration session.', 'info')
      return
    }
    const a = document.createElement('a')
    a.href = doc.fileDataUrl
    a.download = doc.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 text-sm truncate">{doc.documentType}</p>
          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{doc.registerNumber}</p>
          <p className="text-[10px] text-slate-400 truncate">{doc.fileName} · {formatBytes(doc.fileSizeBytes)}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${verStatusColor[doc.verificationStatus]}`}>
            {doc.verificationStatus.replace(/_/g, ' ')}
          </span>
          {doc.publicationStatus === 'published' && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">Published</span>
          )}
          <span className="text-[9px] text-slate-400">v{doc.version}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 transition-colors"
        >
          <Eye size={11} /> Preview
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 transition-colors"
        >
          <Download size={11} /> Download
        </button>
        {doc.verificationStatus === 'pending' && (
          <button
            onClick={handleVerify}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
          >
            <ShieldCheck size={11} /> Verify
          </button>
        )}
        {doc.verificationStatus === 'verified' && doc.publicationStatus !== 'published' && (
          <button
            onClick={handlePublish}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Globe size={11} /> Publish
          </button>
        )}
      </div>

      {/* Lightweight preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Document Details</h3>
              <button onClick={() => setShowPreview(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { l: 'Document Type', v: doc.documentType },
                { l: 'Register No.', v: doc.registerNumber },
                { l: 'Department', v: doc.department },
                { l: 'File Name', v: doc.fileName },
                { l: 'File Size', v: formatBytes(doc.fileSizeBytes) },
                { l: 'Version', v: `v${doc.version}` },
                { l: 'Upload Date', v: new Date(doc.uploadDate).toLocaleDateString('en-IN') },
                { l: 'Uploaded By', v: doc.uploadedBy },
                { l: 'Cert. Number', v: doc.certificateNumber || '—' },
                { l: 'Issuing Auth.', v: doc.issuingAuthority || '—' },
                { l: 'Verification', v: doc.verificationStatus.replace(/_/g, ' ') },
                { l: 'Publication', v: doc.publicationStatus },
              ].map((f) => (
                <div key={f.l} className="bg-slate-50 rounded-lg p-2.5">
                  <p className="text-[9px] uppercase font-bold text-slate-400">{f.l}</p>
                  <p className="font-semibold text-slate-800 truncate mt-0.5">{f.v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Activity History</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {doc.auditHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px]">
                    <span className="text-slate-400 shrink-0">{new Date(h.at).toLocaleDateString('en-IN')}</span>
                    <span className="font-semibold text-slate-700">{h.action}</span>
                    {h.note && <span className="text-slate-500">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────────────────────

export const BulkDocumentPanel: React.FC = () => {
  const { students, adminProfile, showToast } = useAdmin()

  // ── State ──
  const [selectedDept, setSelectedDept] = useState<string>('')
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null)
  const [pdfFiles, setPdfFiles] = useState<UploadedDocumentFile[]>([])
  const [parsedRows, setParsedRows] = useState<SpreadsheetRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [validationSummary, setValidationSummary] = useState<BulkValidationSummary | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitProgress, setCommitProgress] = useState<{ done: number; total: number } | null>(null)
  const [committedCount, setCommittedCount] = useState<number | null>(null)
  const [storedDocs, setStoredDocs] = useState<StoredBulkDocument[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'missing'>('upload')
  const [refreshTick, setRefreshTick] = useState(0)

  const spreadsheetInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)

  const adminEmail = adminProfile.email
  const adminName = adminProfile.name
  const institutionCode = adminProfile.institutionCode

  // ── Department filter applies to existing students ──
  const deptStudents = selectedDept
    ? students.filter((s) => s.department === selectedDept)
    : students

  // ── Refresh stored docs & metrics ──
  const refresh = useCallback(() => setRefreshTick((t) => t + 1), [])

  useEffect(() => {
    setStoredDocs(
      getBulkDocuments().filter(
        (d) => !selectedDept || d.department === selectedDept
      )
    )
  }, [refreshTick, selectedDept])

  const metrics = getBulkDashboardMetrics(students, selectedDept || 'all')
  const missingReports = getMissingDocumentReports(students, selectedDept || 'all')

  // ── Spreadsheet upload ──
  const handleSpreadsheetDrop = useCallback(
    async (file: File) => {
      setSpreadsheetFile(file)
      setValidationSummary(null)
      setParseErrors([])
      setParsedRows([])
      setCommittedCount(null)
      const { rows, errors } = await parseSpreadsheet(file)
      setParsedRows(rows)
      setParseErrors(errors)
    },
    []
  )

  const onSpreadsheetInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleSpreadsheetDrop(file)
  }

  // ── PDF upload ──
  const onPdfInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).map((f) => ({
      file: f,
      name: f.name,
      sizeBytes: f.size,
    }))
    setPdfFiles((prev) => {
      const names = new Set(prev.map((x) => x.name))
      return [...prev, ...files.filter((f) => !names.has(f.name))]
    })
    setValidationSummary(null)
    setCommittedCount(null)
  }

  const removePdf = (name: string) => {
    setPdfFiles((prev) => prev.filter((f) => f.name !== name))
    setValidationSummary(null)
  }

  // ── Verify & Upload ──
  const handleVerifyAndUpload = async () => {
    if (!selectedDept) {
      showToast('Please select a department first.', 'error')
      return
    }
    if (parsedRows.length === 0) {
      showToast('Please upload a valid spreadsheet file first.', 'error')
      return
    }
    setIsValidating(true)
    setValidationSummary(null)
    setCommittedCount(null)
    // Small delay to let UI render
    await new Promise((r) => setTimeout(r, 120))
    const summary = validateBulkRows(parsedRows, pdfFiles, deptStudents, selectedDept, adminEmail)
    setValidationSummary(summary)
    setIsValidating(false)
  }

  // ── Confirm & Commit ──
  const handleConfirmCommit = async () => {
    if (!validationSummary) return
    const commitableRows = validationSummary.rows.filter((r) => r.status === 'valid')
    if (commitableRows.length === 0) {
      showToast('No valid rows to commit. Resolve errors and retry.', 'error')
      return
    }
    setIsCommitting(true)
    setCommitProgress({ done: 0, total: commitableRows.length })
    try {
      const { stored } = await commitValidatedRows(
        validationSummary.rows,
        adminEmail,
        adminName,
        institutionCode,
        (done, total) => setCommitProgress({ done, total })
      )
      setCommittedCount(stored.length)
      showToast(`${stored.length} document(s) stored successfully.`, 'success')
      setValidationSummary(null)
      setParsedRows([])
      setSpreadsheetFile(null)
      setPdfFiles([])
      refresh()
      setActiveTab('documents')
    } catch (err) {
      showToast(`Commit failed: ${String(err)}`, 'error')
    } finally {
      setIsCommitting(false)
      setCommitProgress(null)
    }
  }

  // ── Drop-zone drag state ──
  const [isDraggingSpreadsheet, setIsDraggingSpreadsheet] = useState(false)
  const [isDraggingPdf, setIsDraggingPdf] = useState(false)

  const onDropSpreadsheet = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingSpreadsheet(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      handleSpreadsheetDrop(file)
    } else {
      showToast('Only .xlsx, .xls, or .csv files are accepted for student data.', 'error')
    }
  }

  const onDropPdf = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingPdf(false)
    const files = Array.from(e.dataTransfer.files).map((f) => ({
      file: f,
      name: f.name,
      sizeBytes: f.size,
    }))
    setPdfFiles((prev) => {
      const names = new Set(prev.map((x) => x.name))
      return [...prev, ...files.filter((f) => !names.has(f.name))]
    })
    setValidationSummary(null)
  }

  // ── Render ──
  return (
    <div className="space-y-5 mt-6 border-t border-slate-200 pt-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Upload size={18} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Department-wise Bulk Document Management</h2>
          <p className="text-[11px] text-slate-500">Upload, verify, and publish student documents in batch. Student Portal updates automatically.</p>
        </div>
      </div>

      {/* ── Dashboard Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {[
          { label: 'Total Students', value: metrics.totalStudents, icon: <Users size={14} className="text-blue-600" />, accent: 'border-blue-100' },
          { label: 'Complete Records', value: metrics.studentsComplete, icon: <CheckCircle2 size={14} className="text-emerald-600" />, accent: 'border-emerald-100' },
          { label: 'Missing Docs', value: metrics.studentsWithMissing, icon: <FileWarning size={14} className="text-orange-600" />, accent: 'border-orange-100' },
          { label: 'Awaiting Review', value: metrics.docsAwaitingReview, icon: <BookOpen size={14} className="text-amber-600" />, accent: 'border-amber-100' },
          { label: 'Needs Correction', value: metrics.docsRequiringCorrection, icon: <AlertTriangle size={14} className="text-rose-600" />, accent: 'border-rose-100' },
          { label: 'Verified Docs', value: metrics.verifiedDocs, icon: <ShieldCheck size={14} className="text-teal-600" />, accent: 'border-teal-100' },
          { label: 'Published', value: metrics.publishedDocs, icon: <Globe size={14} className="text-indigo-600" />, accent: 'border-indigo-100' },
        ].map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            accent={m.accent}
            clickable={false}
          />
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        {(['upload', 'documents', 'missing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'upload' && 'Upload & Verify'}
            {tab === 'documents' && `Stored Documents (${storedDocs.length})`}
            {tab === 'missing' && `Missing Reports (${missingReports.filter((r) => r.missing.length > 0).length})`}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: Upload & Verify                              */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          {/* Department Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="h-5 w-5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center">1</span>
              Select Department
            </h3>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_DEPARTMENTS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => {
                    setSelectedDept(dept)
                    setValidationSummary(null)
                    setCommittedCount(null)
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    selectedDept === dept
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            {selectedDept && (
              <p className="mt-2 text-[11px] text-slate-500">
                {deptStudents.length} student record(s) found in <strong>{selectedDept}</strong>.
              </p>
            )}
          </div>

          {/* File Upload Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Spreadsheet Drop Zone */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center">2a</span>
                Upload Student Data
              </h3>
              <p className="text-[11px] text-slate-500">
                Excel (.xlsx) or CSV. Required columns: <strong>APAAR ID, Register Number, Student Name, Document Type</strong>. Optional: Academic Year, Semester, Certificate Number, Issuing Authority.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingSpreadsheet(true) }}
                onDragLeave={() => setIsDraggingSpreadsheet(false)}
                onDrop={onDropSpreadsheet}
                onClick={() => spreadsheetInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDraggingSpreadsheet
                    ? 'border-blue-400 bg-blue-50'
                    : spreadsheetFile
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet size={28} className={spreadsheetFile ? 'text-emerald-600' : 'text-slate-400'} />
                {spreadsheetFile ? (
                  <>
                    <p className="text-xs font-bold text-emerald-700">{spreadsheetFile.name}</p>
                    <p className="text-[10px] text-emerald-600">{formatBytes(spreadsheetFile.size)} · {parsedRows.length} data rows parsed</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-600">Drop spreadsheet here or click to browse</p>
                    <p className="text-[10px] text-slate-400">.xlsx, .xls, .csv</p>
                  </>
                )}
                <input
                  ref={spreadsheetInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={onSpreadsheetInput}
                  id="bulk-spreadsheet-input"
                />
              </div>
              {parseErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                  {parseErrors.map((e, i) => (
                    <p key={i} className="text-xs text-red-700">⚠ {e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* PDF Drop Zone */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="h-5 w-5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold flex items-center justify-center">2b</span>
                Upload Document Files
              </h3>
              <p className="text-[11px] text-slate-500">
                PDF (recommended), JPG, PNG. Files are matched to spreadsheet rows by register number or document type in the filename.
              </p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingPdf(true) }}
                onDragLeave={() => setIsDraggingPdf(false)}
                onDrop={onDropPdf}
                onClick={() => pdfInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  isDraggingPdf
                    ? 'border-purple-400 bg-purple-50'
                    : pdfFiles.length > 0
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-slate-300 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                <FileBadge size={28} className={pdfFiles.length > 0 ? 'text-purple-600' : 'text-slate-400'} />
                {pdfFiles.length > 0 ? (
                  <p className="text-xs font-bold text-purple-700">{pdfFiles.length} file(s) selected</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-600">Drop document files here or click to browse</p>
                    <p className="text-[10px] text-slate-400">PDF, JPG, PNG · max 10 MB each</p>
                  </>
                )}
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={onPdfInput}
                  id="bulk-pdf-input"
                />
              </div>
              {pdfFiles.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {pdfFiles.map((f) => (
                    <div key={f.name} className="flex items-center justify-between text-xs bg-purple-50 rounded-lg px-3 py-1.5">
                      <span className="truncate font-medium text-purple-800">{f.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-purple-500">{formatBytes(f.sizeBytes)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); removePdf(f.name) }}
                          className="text-purple-400 hover:text-rose-600 transition-colors"
                          aria-label="Remove file"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Supported document types hint */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex items-start gap-2.5">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-700 leading-relaxed">
              <strong>Accepted Document Types:</strong>{' '}
              {ACCEPTED_DOCUMENT_TYPES.join(' · ')}
            </div>
          </div>

          {/* Verify & Upload CTA */}
          <button
            id="verify-and-upload-btn"
            onClick={handleVerifyAndUpload}
            disabled={isValidating || !selectedDept || parsedRows.length === 0}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <><Loader2 size={16} className="animate-spin" /> Validating…</>
            ) : (
              <><FileCheck2 size={16} /> Verify &amp; Upload</>
            )}
          </button>

          {/* ── Validation Results ── */}
          {validationSummary && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <h3 className="text-sm font-bold text-slate-900">Validation Preview</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Review the results below. Only "Valid" rows will be committed.</p>
              </div>

              {/* Summary counts */}
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-px bg-slate-100">
                {[
                  { label: 'Total Rows', value: validationSummary.totalRows, color: 'bg-slate-50 text-slate-700' },
                  { label: 'Valid', value: validationSummary.validDocuments, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Student Matches', value: validationSummary.studentMatches, color: 'bg-blue-50 text-blue-700' },
                  { label: 'No File', value: validationSummary.missingFiles, color: 'bg-amber-50 text-amber-700' },
                  { label: 'Not Found', value: validationSummary.unmatchedStudents, color: 'bg-red-50 text-red-700' },
                  { label: 'Duplicates', value: validationSummary.duplicateRows, color: 'bg-rose-50 text-rose-700' },
                  { label: 'Invalid', value: validationSummary.invalidRows, color: 'bg-purple-50 text-purple-700' },
                  { label: 'Manual Review', value: validationSummary.manualReview, color: 'bg-yellow-50 text-yellow-700' },
                  { label: 'Valid + No File', value: validationSummary.validRows, color: 'bg-teal-50 text-teal-700' },
                ].map((s) => (
                  <div key={s.label} className={`flex flex-col items-center py-3 px-2 ${s.color}`}>
                    <p className="text-lg font-extrabold">{s.value}</p>
                    <p className="text-[9px] font-bold uppercase text-center leading-tight mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Row list */}
              <div className="p-4 max-h-96 overflow-y-auto space-y-0">
                {validationSummary.rows.map((vRow, idx) => (
                  <ValidationRowItem key={idx} vRow={vRow} idx={idx} />
                ))}
              </div>

              {/* Commit CTA */}
              <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-xs text-slate-600">
                  <strong>{validationSummary.validDocuments}</strong> valid document(s) will be stored.
                  {validationSummary.unmatchedStudents > 0 && (
                    <span className="text-red-600 ml-2">
                      ⚠ {validationSummary.unmatchedStudents} unmatched student(s) will be skipped.
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setValidationSummary(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="confirm-commit-btn"
                    onClick={handleConfirmCommit}
                    disabled={isCommitting || validationSummary.validDocuments === 0}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        {commitProgress ? `${commitProgress.done}/${commitProgress.total}` : 'Storing…'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} />
                        Confirm &amp; Store ({validationSummary.validDocuments})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Commit success banner */}
          {committedCount !== null && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900">{committedCount} document(s) stored successfully.</p>
                <p className="text-[11px] text-emerald-700">Review them in the "Stored Documents" tab. Verify and Publish to sync with the Student Portal.</p>
              </div>
            </div>
          )}

          {/* Certificate retrieval notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 leading-relaxed">
              <strong>External Certificate Retrieval:</strong> Automatic retrieval from government portals (DigiLocker / NAD) requires a configured API integration that is not available in this demonstration environment. The system will report the actual status. College staff may upload original documents directly using this interface.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: Stored Documents                             */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {storedDocs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 flex flex-col items-center gap-3 text-center">
              <FileBadge size={36} className="text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No Documents Stored Yet</p>
              <p className="text-xs text-slate-500">Upload and commit documents using the "Upload & Verify" tab.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {storedDocs.map((doc) => (
                <StoredDocCard
                  key={doc.id}
                  doc={doc}
                  adminEmail={adminEmail}
                  adminName={adminName}
                  onRefresh={refresh}
                  showToast={showToast}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* TAB: Missing Document Reports                     */}
      {/* ══════════════════════════════════════════════════ */}
      {activeTab === 'missing' && (
        <div className="space-y-3">
          {missingReports.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 flex flex-col items-center gap-3">
              <CheckCircle2 size={36} className="text-emerald-400" />
              <p className="text-sm font-bold text-slate-700">All Students Have Complete Records</p>
            </div>
          )}
          {missingReports.map((report) => (
            <div
              key={report.student.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {report.student.fullName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{report.student.fullName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{report.student.registrationNumber} · {report.student.department}</p>
                  </div>
                </div>
                <div className="flex gap-2 text-[10px] font-bold shrink-0">
                  {report.missing.length > 0 ? (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded-full">{report.missing.length} Missing</span>
                  ) : (
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">Complete</span>
                  )}
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{report.published.length} Published</span>
                </div>
              </div>

              <div className="px-5 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {report.required.map((req) => {
                    const isUploaded = report.uploaded.some((d) => d.documentType === req)
                    const isVerified = report.verified.some((d) => d.documentType === req)
                    const isPublished = report.published.some((d) => d.documentType === req)
                    const isMissing = report.missing.includes(req)
                    return (
                      <span
                        key={req}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                          isPublished
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : isVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isUploaded
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isMissing
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {isPublished ? '✓ ' : isVerified ? '✓ ' : isUploaded ? '↑ ' : isMissing ? '✗ ' : ''}
                        {req}
                      </span>
                    )
                  })}
                </div>
                {report.missing.length > 0 && (
                  <p className="text-[10px] text-red-600 mt-2 font-medium">
                    ⚠ Missing document notifications dispatched to the Student Portal for this student.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
