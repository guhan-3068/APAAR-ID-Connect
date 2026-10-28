import React, { useState, useMemo } from 'react'
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  X,
  Download,
  Clock,
  GraduationCap,
  Send,
  FileWarning,
} from 'lucide-react'
import { usePlatformContext } from '@/context/PlatformContext'
import type {
  AICTEInstitutionRecord,
  AICTESubmissionStatus,
} from '@/services/aicteAdminService'

const submissionStatusBadges: Record<AICTESubmissionStatus, { label: string; cls: string }> = {
  'Not Started': { label: 'Not Started', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  'In Progress': { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  Submitted: { label: 'Submitted', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Validation Failed': { label: 'Validation Failed', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  'Correction Required': { label: 'Correction Required', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export const PlatformInstitutions: React.FC = () => {
  const {
    aicteInstitutions,
    aicteStudents,
    updateAicteInstitutionStatus,
    issueCorrectionRequest,
  } = usePlatformContext()

  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  // Selected institution for details modal
  const [selectedInst, setSelectedInst] = useState<AICTEInstitutionRecord | null>(null)

  // Correction request modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionNote, setCorrectionNote] = useState('')

  // Unique states
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(aicteInstitutions.map((i) => i.state))).sort()
  }, [aicteInstitutions])

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    return aicteInstitutions.filter((inst) => {
      const matchesSearch =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.aicteCode.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q) ||
        inst.state.toLowerCase().includes(q) ||
        inst.registrarName.toLowerCase().includes(q)

      const matchesStatus = statusFilter === 'all' || inst.submissionStatus === statusFilter
      const matchesState = stateFilter === 'all' || inst.state === stateFilter
      const matchesType = typeFilter === 'all' || inst.type === typeFilter

      return matchesSearch && matchesStatus && matchesState && matchesType
    })
  }, [aicteInstitutions, searchTerm, statusFilter, stateFilter, typeFilter])

  // Handle Mark Completed / Approve
  const handleApproveSubmission = (inst: AICTEInstitutionRecord) => {
    if (inst.unresolvedIssuesCount > 0) {
      alert(
        `Cannot mark submission Completed: Mandatory regulatory validation requires resolving ${inst.unresolvedIssuesCount} open data issues first.`
      )
      return
    }
    updateAicteInstitutionStatus(
      inst.id,
      'Completed',
      'All student dossiers and intake quota compliance validated by AICTE regulatory cell.'
    )
    setSelectedInst((prev) => (prev ? { ...prev, submissionStatus: 'Completed', unresolvedIssuesCount: 0 } : null))
  }

  // Handle Issue Correction Notice
  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInst || !correctionNote.trim()) return

    issueCorrectionRequest(selectedInst.id, correctionNote.trim())
    setShowCorrectionModal(false)
    setCorrectionNote('')
    setSelectedInst((prev) =>
      prev
        ? {
            ...prev,
            submissionStatus: 'Correction Required',
            unresolvedIssuesCount: prev.unresolvedIssuesCount + 1,
          }
        : null
    )
  }

  // Export Directory CSV
  const handleExportCsv = () => {
    const headers = [
      'Institution Name',
      'AICTE ID',
      'State',
      'District',
      'Type',
      'Approved Intake',
      'Reported Enrolment',
      'Latest Submission Date',
      'Submission Status',
      'Unresolved Issues',
      'Compliance Score',
    ]

    const rows = filteredInstitutions.map((i) => [
      `"${i.name}"`,
      `"${i.aicteCode}"`,
      `"${i.state}"`,
      `"${i.district}"`,
      `"${i.type}"`,
      i.totalApprovedIntake,
      i.totalReportedEnrolment,
      i.latestSubmissionDate,
      `"${i.submissionStatus}"`,
      i.unresolvedIssuesCount,
      i.complianceScore,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `AICTE_Institutions_Directory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Find related students for the selected institution
  const relatedStudents = useMemo(() => {
    if (!selectedInst) return []
    return aicteStudents.filter(
      (s) => s.institutionName === selectedInst.name || s.institutionId === selectedInst.aicteCode
    )
  }, [selectedInst, aicteStudents])

  const instDuplicates = useMemo(() => {
    return relatedStudents.filter((s) => s.validationStatus === 'Potential Duplicate')
  }, [relatedStudents])

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* HEADER                                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Building2 size={13} className="text-blue-600" />
              Module 3: Institutional Governance
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Affiliated Colleges &amp; Submission Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Institution Management &amp; Submission Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Supervise approved colleges, monitor annual student enrolment submissions, enforce intake limits, and manage institutional correction notices.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download size={14} /> Export Directory CSV
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SEARCH & FILTERS                                                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by college name, AICTE permanent code, district, city, or registrar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
            {(['all', 'Correction Required', 'Validation Failed', 'Submitted', 'In Progress', 'Completed', 'Not Started'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st === 'all' ? 'All Submissions' : st}
              </button>
            ))}
          </div>
        </div>

        {/* State and Type Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State / Region</label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-700 bg-white"
            >
              <option value="all">All States</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institution Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-700 bg-white"
            >
              <option value="all">All Management Types</option>
              <option value="Government">Government</option>
              <option value="Autonomous">Autonomous</option>
              <option value="Govt-Aided">Govt-Aided</option>
              <option value="Private">Private</option>
            </select>
          </div>

          <div className="flex items-end">
            <p className="text-[11px] text-slate-500">
              Showing <strong>{filteredInstitutions.length}</strong> of {aicteInstitutions.length} registered colleges
            </p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* INSTITUTIONS DIRECTORY TABLE                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Institution Name &amp; Code</th>
                <th className="py-3 px-4">Location &amp; Type</th>
                <th className="py-3 px-4">Approved Intake</th>
                <th className="py-3 px-4">Reported Admissions</th>
                <th className="py-3 px-4">Latest Submission</th>
                <th className="py-3 px-4">Submission Status</th>
                <th className="py-3 px-4">Open Issues</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInstitutions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-800">
                      {aicteInstitutions.length === 0 ? 'No colleges have been registered yet.' : 'No Colleges Found'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {aicteInstitutions.length === 0 ? 'Colleges registered through the platform will appear here.' : 'No institutions match your search and filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInstitutions.map((inst) => {
                  const badge = submissionStatusBadges[inst.submissionStatus]
                  const isIntakeExceeded = inst.totalReportedEnrolment > inst.totalApprovedIntake
                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & Code */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <span className="font-bold text-slate-900 block truncate" title={inst.name}>
                        {inst.name}
                      </span>
                      <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {inst.aicteCode}
                      </span>
                    </td>

                    {/* Location & Type */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{inst.city}, {inst.state}</span>
                      <span className="text-[10px] text-slate-400">{inst.type}</span>
                    </td>

                    {/* Approved Intake */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-700">{inst.totalApprovedIntake}</span>
                      <span className="text-[10px] text-slate-400 block">{inst.approvedCourses.length} Programmes</span>
                    </td>

                    {/* Reported Admissions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{inst.totalReportedEnrolment}</span>
                        {isIntakeExceeded && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            +{inst.totalReportedEnrolment - inst.totalApprovedIntake} Over
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Latest Submission Date */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      {inst.latestSubmissionDate}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Unresolved Issues */}
                    <td className="py-3.5 px-4">
                      {inst.unresolvedIssuesCount === 0 ? (
                        <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 size={13} /> 0 Issues
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {inst.unresolvedIssuesCount} Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInst(inst)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
                      >
                        <Eye size={13} /> Details &amp; Audit
                      </button>
                    </td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* INSTITUTION DETAILS MODAL (SPECIFICATION REQUIRED)                */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/50 to-white">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedInst.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-mono font-bold text-blue-700">{selectedInst.aicteCode}</span>
                    <span>·</span>
                    <span>{selectedInst.type} Institution</span>
                    <span>·</span>
                    <span>NAAC: {selectedInst.naacAccreditation}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedInst(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Institution Profile & Registrar Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Registrar</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedInst.registrarName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Contact Email</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{selectedInst.registrarEmail}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{selectedInst.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Compliance Health</span>
                  <span className="font-extrabold text-emerald-700 block mt-0.5">{selectedInst.complianceScore}% Score</span>
                </div>
              </div>

              {/* Approved Intake Information (Course & Department-wise) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-blue-600" /> Approved Intake vs Reported Admissions
                  </h4>
                  <span className="text-[10px] text-slate-400">Total: {selectedInst.totalReportedEnrolment} / {selectedInst.totalApprovedIntake}</span>
                </div>

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Programme</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-3">Approved Intake</th>
                        <th className="py-2.5 px-3">Reported Admissions</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInst.approvedCourses.map((c, i) => {
                        const isExceeded = c.reportedAdmissions > c.approvedIntake
                        return (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{c.course}</td>
                            <td className="py-2 px-3 text-slate-700">{c.department}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-600">{c.approvedIntake}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{c.reportedAdmissions}</td>
                            <td className="py-2 px-3 text-right">
                              {isExceeded ? (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  +{c.reportedAdmissions - c.approvedIntake} Exceeded
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Within Quota
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submission History */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={15} className="text-purple-600" /> Data Submission Batch History
                </h4>
                <div className="space-y-2">
                  {selectedInst.submissionHistory.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-xl border">
                      No submission batches recorded yet.
                    </p>
                  ) : (
                    selectedInst.submissionHistory.map((batch) => (
                      <div key={batch.batchId} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{batch.batchId}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500">{batch.submittedAt}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-700 font-semibold">{batch.recordCount} Students</span>
                          </div>
                          {batch.note && (
                            <p className="text-[11px] text-slate-600 mt-0.5">{batch.note}</p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${submissionStatusBadges[batch.status].cls}`}>
                          {batch.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Outstanding Correction Requests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileWarning size={15} className="text-amber-600" /> Outstanding Correction Notices
                  </h4>
                  <button
                    onClick={() => setShowCorrectionModal(true)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                  >
                    + Issue New Notice
                  </button>
                </div>
                {selectedInst.correctionRequests.length === 0 ? (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    ✓ No active correction notices pending for this institution.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedInst.correctionRequests.map((req) => (
                      <div key={req.id} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start justify-between">
                        <div>
                          <span className="font-mono font-bold text-amber-900 block">{req.id} · {req.requestedAt}</span>
                          <p className="text-slate-800 mt-1">{req.issue}</p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          {req.status === 'open' ? 'Open / Pending College Action' : 'Resolved'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Potential Duplicate Records for this College */}
              {instDuplicates.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-rose-600" /> Flagged Dual-Enrolment Records ({instDuplicates.length})
                  </h4>
                  <div className="space-y-2">
                    {instDuplicates.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{d.studentName} ({d.registerNumber})</span>
                          <span className="font-mono text-purple-700 bg-white px-1.5 py-0.2 rounded border">{d.apaarId}</span>
                        </div>
                        <p className="text-[11px] text-rose-800 mt-1">
                          Clash with: <strong>{d.duplicateMatchInstitution}</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrative Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => setShowCorrectionModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold hover:bg-amber-100 transition-colors"
                >
                  Request Resubmission / Correction
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateAicteInstitutionStatus(selectedInst.id, 'Validation Failed', 'Regulatory scrutiny failed: unresolved data inconsistencies.')
                      setSelectedInst((prev) => (prev ? { ...prev, submissionStatus: 'Validation Failed' } : null))
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 transition-colors"
                  >
                    Flag Validation Failed
                  </button>
                  <button
                    onClick={() => handleApproveSubmission(selectedInst)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} /> Approve Submission (Completed)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* CORRECTION NOTICE MODAL                                           */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {showCorrectionModal && selectedInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Issue Regulatory Correction Notice
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispatches an institutional correction notice to {selectedInst.name} and changes status to <strong>Correction Required</strong>.
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specific Deficiencies &amp; Required Remediation</label>
                <textarea
                  required
                  rows={4}
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="e.g. Provide justification for 25 excess admissions in B.Tech CSE, or verify whether supernumerary seats have state quota approval..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send size={14} /> Dispatch Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
