import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FileWarning,
  Search,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Clock,
  FileText,
  User,
  Info,
  X,
  Check,
  Download,
  AlertCircle,
} from 'lucide-react'
import { usePlatformContext } from '@/context/PlatformContext'
import type { AICTEStudentRecord, AICTEValidationStatus } from '@/services/aicteAdminService'

const statusBadges: Record<AICTEValidationStatus, { label: string; cls: string }> = {
  Validated: { label: 'Validated', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Pending Review': { label: 'Pending Review', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Correction Required': { label: 'Correction Required', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Potential Duplicate': { label: 'Potential Duplicate', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Invalid or Incomplete': { label: 'Invalid / Incomplete', cls: 'bg-red-50 text-red-700 border-red-200' },
  Resolved: { label: 'Resolved', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
}

export const PlatformValidation: React.FC = () => {
  const [searchParams] = useSearchParams()
  const initialStatusParam = searchParams.get('status')

  const { aicteStudents, reviewStudentRecord } = usePlatformContext()

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (initialStatusParam === 'duplicate') return 'Potential Duplicate'
    if (initialStatusParam === 'pending') return 'Pending Review'
    if (initialStatusParam === 'correction') return 'Correction Required'
    return 'all'
  })
  const [institutionFilter, setInstitutionFilter] = useState('all')
  const [issueFilter, setIssueFilter] = useState('all')

  // Selected student for review modal
  const [selectedStudent, setSelectedStudent] = useState<AICTEStudentRecord | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewerName, setReviewerName] = useState('AICTE Regulatory Officer')

  // Unique institutions
  const uniqueInstitutions = useMemo(() => {
    return Array.from(new Set(aicteStudents.map((s) => s.institutionName))).sort()
  }, [aicteStudents])

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return aicteStudents.filter((s) => {
      const matchesSearch =
        !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.apaarId.toLowerCase().includes(q) ||
        s.registerNumber.toLowerCase().includes(q) ||
        s.institutionName.toLowerCase().includes(q) ||
        s.institutionId.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' || s.validationStatus === statusFilter
      const matchesInst = institutionFilter === 'all' || s.institutionName === institutionFilter
      const matchesIssue =
        issueFilter === 'all' ||
        (issueFilter === 'has_issues' && s.issues.length > 0) ||
        s.issues.some((iss) => iss.code === issueFilter)

      return matchesSearch && matchesStatus && matchesInst && matchesIssue
    })
  }, [aicteStudents, searchTerm, statusFilter, institutionFilter, issueFilter])

  // Action handlers
  const handleReviewAction = (action: 'resolve' | 'require_correction' | 'flag_duplicate' | 'mark_pending') => {
    if (!selectedStudent) return
    if (!reviewNote.trim()) {
      alert('Please add a concise review note describing the decision.')
      return
    }

    reviewStudentRecord(selectedStudent.id, action, reviewNote.trim(), reviewerName)
    // Update local modal state with latest
    setSelectedStudent((prev) => (prev ? { ...prev, validationStatus: action === 'resolve' ? 'Resolved' : action === 'require_correction' ? 'Correction Required' : action === 'flag_duplicate' ? 'Potential Duplicate' : 'Pending Review' } : null))
    setReviewNote('')
  }

  // Export filtered CSV
  const handleExportCsv = () => {
    const headers = [
      'Student Name',
      'APAAR ID',
      'Register Number',
      'Institution Name',
      'AICTE ID',
      'Course',
      'Department',
      'Academic Year',
      'Admission Category',
      'Submission Date',
      'Status',
      'Issues Detected',
    ]

    const rows = filteredStudents.map((s) => [
      `"${s.studentName}"`,
      `"${s.apaarId || 'MISSING'}"`,
      `"${s.registerNumber}"`,
      `"${s.institutionName}"`,
      `"${s.institutionId}"`,
      `"${s.course}"`,
      `"${s.department}"`,
      `"${s.academicYear}"`,
      `"${s.admissionCategory}"`,
      `"${s.submissionDate}"`,
      `"${s.validationStatus}"`,
      `"${s.issues.map((i) => i.message).join('; ') || 'None'}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `AICTE_Validation_Records_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* HEADER                                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              <FileWarning size={13} className="text-amber-600" />
              Module 2: Regulatory Surveillance
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Cross-Institutional Integrity Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Student Data Validation &amp; Duplicate Detection
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Scrutinise submitted student records across colleges, identify cross-institutional dual-enrolments, detect format errors, and dispatch correction requests.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download size={14} /> Export Validation CSV
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* REGULATORY NOTICE & MANDATORY DISCLAIMER                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
        <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <strong>Regulatory Investigation Protocol:</strong> A matching APAAR ID triggers an administrative investigation and does not automatically prove fraudulent enrolment.
          Technical format validation (e.g. verifying 12 numeric digits) is an institutional integrity check and must not be presented as official live UIDAI/NAD APAAR biometric verification.
          Official verification status is only confirmed when government gatekeeper APIs are active.
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* FILTERS & SEARCH                                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by student name, APAAR ID, register number, or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            {(['all', 'Potential Duplicate', 'Pending Review', 'Correction Required', 'Validated', 'Invalid or Incomplete'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'all' ? 'All Records' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary dropdown filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Institution</label>
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-700 bg-white"
            >
              <option value="all">All Participating Colleges</option>
              {uniqueInstitutions.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Issue Category</label>
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-700 bg-white"
            >
              <option value="all">All Issues &amp; Clean Records</option>
              <option value="has_issues">Any Flagged Issue</option>
              <option value="cross_institution_duplicate">Cross-Institutional Duplicate</option>
              <option value="intake_exceeded">Approved Intake Exceeded</option>
              <option value="missing_apaar">Missing APAAR ID</option>
              <option value="invalid_apaar_format">Invalid APAAR Format</option>
              <option value="inconsistent_info">Inconsistent CGPA / Info</option>
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-[11px] text-slate-500">
              Showing <strong>{filteredStudents.length}</strong> of {aicteStudents.length} total submitted records
            </p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STUDENT RECORDS TABLE                                             */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Student &amp; APAAR ID</th>
                <th className="py-3 px-4">Register No &amp; Quota</th>
                <th className="py-3 px-4">Institution &amp; AICTE Code</th>
                <th className="py-3 px-4">Course &amp; Department</th>
                <th className="py-3 px-4">Submission Date</th>
                <th className="py-3 px-4">Validation Status</th>
                <th className="py-3 px-4">Detected Issues</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <AlertCircle className="mx-auto text-slate-300 mb-2" size={28} />
                    <p className="font-semibold">
                      {aicteStudents.length === 0 ? 'No student validation records exist.' : 'No student records match the selected filters.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {aicteStudents.length === 0 ? 'Student enrolment submissions and cross-institution validation checks will appear here.' : 'Try adjusting your search query or filters.'}
                    </p>
                    {aicteStudents.length > 0 && (
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('all')
                          setInstitutionFilter('all')
                          setIssueFilter('all')
                        }}
                        className="mt-2 text-purple-600 font-bold hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const badge = statusBadges[s.validationStatus]
                  const hasCritical = s.issues.some((i) => i.severity === 'critical')
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        hasCritical ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Student & APAAR ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{s.studentName}</span>
                        {s.apaarId ? (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {s.apaarId}
                          </span>
                        ) : (
                          <span className="font-bold text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Missing APAAR
                          </span>
                        )}
                      </td>

                      {/* Register No & Quota */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-slate-800 block">{s.registerNumber}</span>
                        <span className="text-[10px] text-slate-400">{s.admissionCategory}</span>
                      </td>

                      {/* Institution */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="font-semibold text-slate-800 truncate block" title={s.institutionName}>
                          {s.institutionName}
                        </span>
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {s.institutionId}
                        </span>
                      </td>

                      {/* Course & Department */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-900 block">{s.course}</span>
                        <span className="text-[10px] text-slate-500">{s.department}</span>
                      </td>

                      {/* Submission Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {s.submissionDate}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Issues */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        {s.issues.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 size={13} /> Clean
                          </span>
                        ) : (
                          <div className="space-y-1">
                            {s.issues.map((iss, i) => (
                              <div
                                key={i}
                                className={`text-[10px] font-medium p-1 rounded leading-tight ${
                                  iss.severity === 'critical'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold'
                                    : iss.severity === 'high'
                                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                      : 'bg-blue-50 text-blue-700'
                                }`}
                                title={iss.message}
                              >
                                {iss.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedStudent(s)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-colors"
                        >
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* REVIEW WORKFLOW DRAWER / MODAL (SPECIFICATION REQUIRED)           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Student Record Review &amp; Audit
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Regulatory Scrutiny ID: {selectedStudent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Status & Highlights */}
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${statusBadges[selectedStudent.validationStatus].cls}`}>
                    {statusBadges[selectedStudent.validationStatus].label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submission Date</span>
                  <span className="text-xs font-semibold text-slate-800">{selectedStudent.submissionDate}</span>
                </div>
              </div>

              {/* Submitted Information Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-purple-600" /> Submitted Student Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Student Name</p>
                    <p className="font-bold text-slate-900 truncate mt-0.5">{selectedStudent.studentName}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">APAAR ID</p>
                    <p className="font-mono font-bold text-purple-700 truncate mt-0.5">
                      {selectedStudent.apaarId || 'MISSING'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Register Number</p>
                    <p className="font-mono font-semibold text-slate-800 truncate mt-0.5">{selectedStudent.registerNumber}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Course &amp; Dept</p>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{selectedStudent.course} · {selectedStudent.department}</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Academic Year</p>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{selectedStudent.academicYear} ({selectedStudent.semester})</p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Quota / Category</p>
                    <p className="font-semibold text-slate-900 truncate mt-0.5">{selectedStudent.admissionCategory}</p>
                  </div>
                </div>
              </div>

              {/* Submitting Institution Details */}
              <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100 text-xs">
                <p className="text-[10px] font-bold uppercase text-purple-700 tracking-wider mb-1">Submitting Institution</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{selectedStudent.institutionName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Affiliation Code: {selectedStudent.institutionId}</p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                    AICTE Approved
                  </span>
                </div>
              </div>

              {/* Duplicate Clash Highlight if applicable */}
              {selectedStudent.duplicateMatchInstitution && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-900">Cross-Institution Duplicate Clash Detected</p>
                      <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                        This APAAR ID matches an active enrolment submission by{' '}
                        <strong>{selectedStudent.duplicateMatchInstitution}</strong> under register number{' '}
                        <code className="font-mono bg-white px-1 py-0.2 rounded border">{selectedStudent.duplicateMatchRegisterNo}</code>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Internal Review Notes History */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={14} className="text-purple-600" /> Review History &amp; Internal Notes
                </h4>
                {selectedStudent.reviewNotes.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    No internal administrative notes recorded yet for this submission.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedStudent.reviewNotes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-700">{n.author}</span>
                          <span>{new Date(n.timestamp).toLocaleDateString('en-IN')}</span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed">&ldquo;{n.note}&rdquo;</p>
                        <span className="inline-block mt-1 text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          {n.action}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Form: Add note and update status */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Add Official Review Decision &amp; Internal Note
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Enter regulatory evaluation details (e.g. verified CET transfer document, clerical APAAR typo resolved, or notice dispatched to registrar)..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 h-20"
                />

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Reviewer:</span>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleReviewAction('require_correction')}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                    >
                      Require Correction
                    </button>
                    <button
                      onClick={() => handleReviewAction('flag_duplicate')}
                      className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-colors"
                    >
                      Flag Duplicate
                    </button>
                    <button
                      onClick={() => handleReviewAction('resolve')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <Check size={14} /> Resolve &amp; Validate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
