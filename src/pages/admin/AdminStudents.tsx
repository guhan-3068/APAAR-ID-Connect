import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  XCircle,
  Building2,
  Calendar,
  GraduationCap,
  FileWarning,
  Copy,
  Check,
  Download,
  UploadCloud,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { studentService, downloadCsv } from '@/services/appDataService'
import { UploadStudentDocModal } from '@/components/admin/UploadStudentDocModal'
import type { AdminStudentRecord } from '@/types'
import { BulkDocumentPanel } from '@/components/admin/BulkDocumentPanel'

const ITEMS_PER_PAGE = 8

const statusBadge = (status: AdminStudentRecord['status']) => {
  const map: Record<AdminStudentRecord['status'], string> = {
    verified: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    rejected: 'bg-red-50 text-red-700 border border-red-200',
    incomplete: 'bg-orange-50 text-orange-700 border border-orange-200',
    flagged: 'bg-rose-50 text-rose-700 border border-rose-200',
    active: 'bg-blue-50 text-blue-700 border border-blue-200',
  }
  const label: Record<AdminStudentRecord['status'], string> = {
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
    incomplete: 'Incomplete',
    flagged: 'Flagged',
    active: 'Active',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {label[status] || status}
    </span>
  )
}

const MaskedApaar: React.FC<{ apaarId: string }> = ({ apaarId }) => {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const masked = `•••• •••• ${apaarId.slice(-4)}`
  const formatted = `${apaarId.slice(0, 4)}-${apaarId.slice(4, 8)}-${apaarId.slice(8, 12)}`

  const handleCopy = () => {
    navigator.clipboard?.writeText(apaarId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
      <span className="tracking-wide">{revealed ? formatted : masked}</span>
      <button
        onClick={() => setRevealed(!revealed)}
        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
        aria-label={revealed ? 'Hide APAAR ID' : 'Show APAAR ID'}
        title={revealed ? 'Mask APAAR ID' : 'Reveal APAAR ID'}
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      {revealed && (
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-colors"
          title="Copy APAAR ID"
        >
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        </button>
      )}
    </span>
  )
}

const StudentDetailModal: React.FC<{
  student: AdminStudentRecord
  institutionName: string
  onClose: () => void
  onUploadDoc: (student: AdminStudentRecord) => void
}> = ({ student, institutionName, onClose, onUploadDoc }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap size={18} className="text-blue-600" /> Student Verification Dossier
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Header with avatar */}
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {student.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-slate-900 text-base leading-snug truncate">{student.fullName}</p>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{student.registrationNumber}</p>
            <div className="mt-1.5 flex items-center gap-2">
              {statusBadge(student.status)}
              <span className="text-[11px] text-slate-400 font-medium">{student.academicYear}</span>
            </div>
          </div>
        </div>

        {/* Institution banner */}
        <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 flex items-center gap-2.5">
          <Building2 size={16} className="text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Institution</p>
            <p className="text-xs font-semibold text-slate-800 truncate">{student.institutionName || institutionName}</p>
          </div>
        </div>

        {/* Alert banners for Incomplete or Rejected records */}
        {student.status === 'incomplete' && student.missingFields && student.missingFields.length > 0 && (
          <div className="rounded-xl bg-orange-50 border border-orange-200 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-800">
              <FileWarning size={14} className="text-orange-600 shrink-0" />
              <span>Incomplete Record — Required Fields Missing:</span>
            </div>
            <ul className="list-disc list-inside text-xs text-orange-700 space-y-0.5 pl-1">
              {student.missingFields.map((field, idx) => (
                <li key={idx} className="font-medium">{field}</li>
              ))}
            </ul>
          </div>
        )}

        {student.status === 'rejected' && student.rejectionReason && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
              <XCircle size={14} className="text-rose-600 shrink-0" />
              <span>Official Rejection Notice:</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed font-medium pl-5">{student.rejectionReason}</p>
          </div>
        )}

        {student.status === 'flagged' && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Record flagged due to secondary discrepancies between submitted documents and Aadhaar-linked profile. Human review recommended.
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {[
            { label: 'Department', value: student.department },
            { label: 'Programme', value: student.programme },
            { label: 'Academic Year', value: student.academicYear },
            { label: 'Current Semester', value: `Semester ${student.currentSemester}` },
            { label: 'Cumulative CGPA', value: student.cgpa.toFixed(2) },
            { label: 'DigiLocker Status', value: student.digilockerSynced ? '✓ Synced & Verified' : '⏳ Pending Sync' },
            { label: 'Official Email', value: student.email },
            { label: 'Contact Phone', value: student.phone },
            { label: 'Enrolment Date', value: student.enrolmentDate },
          ].map((f) => (
            <div key={f.label} className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.label}</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{f.value}</p>
            </div>
          ))}
        </div>

        {/* Identity Identifiers */}
        <div className="space-y-2">
          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">12-Digit APAAR ID</p>
              <div className="mt-0.5">
                <MaskedApaar apaarId={student.apaarId} />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Unique ID
            </span>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">ABC Account ID</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{student.abcId}</p>
            </div>
            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
              Academic Bank
            </span>
          </div>
        </div>

        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 leading-relaxed">
          ⚠️ <strong>Privacy Protected</strong> — APAAR identifiers remain masked in accordance with DPDP Act privacy safeguards.
        </p>
      </div>

      <div className="px-6 pb-5 flex items-center justify-between gap-2">
        <button
          onClick={() => {
            onClose()
            onUploadDoc(student)
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <UploadCloud size={13} />
          <span>Upload Document / Marksheet</span>
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Close Dossier
        </button>
      </div>
    </div>
  </div>
)

export const AdminStudents: React.FC = () => {
  const { students, adminProfile, showToast, departments: collegeConfiguredDepts } = useAdmin()

  const [searchParams] = useSearchParams()
  const initialStatus = (searchParams.get('status') as AdminStudentRecord['status']) || 'all'
  const [search, setSearch] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'registrationNumber' | 'apaarId'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AdminStudentRecord['status']>(initialStatus)
  const [deptFilter, setDeptFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AdminStudentRecord | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadTargetStudent, setUploadTargetStudent] = useState<AdminStudentRecord | null>(null)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s && ['verified', 'pending', 'rejected', 'incomplete', 'flagged', 'active'].includes(s)) {
      setStatusFilter(s as AdminStudentRecord['status'])
      setPage(1)
    } else if (s === 'all') {
      setStatusFilter('all')
      setPage(1)
    }
  }, [searchParams])

  const handleExportCsv = () => {
    const csv = studentService.exportCsv({
      search,
      status: statusFilter,
      department: deptFilter,
    })
    downloadCsv(csv, `NIET_Student_Registry_${new Date().toISOString().split('T')[0]}.csv`)
    showToast('Authorized student directory exported as CSV.', 'success')
  }

  const departments = [
    'all',
    ...Array.from(new Set([...(collegeConfiguredDepts || []), ...students.map((s) => s.department)].filter(Boolean))),
  ]

  // Filter students
  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase().trim()
      const cleanDigits = q.replace(/[\s-]+/g, '')
      const studentApaarDigits = (s.apaarId || '').replace(/[\s-]+/g, '')

      const cleanRegQ = q.replace(/[\s-]+/g, '').toUpperCase()
      const studentCleanReg = (s.registrationNumber || '').replace(/[\s-]+/g, '').toUpperCase()

      let matchesSearch = true
      if (q) {
        if (searchType === 'registrationNumber') {
          matchesSearch = studentCleanReg === cleanRegQ || (cleanRegQ.length >= 2 && studentCleanReg.includes(cleanRegQ))
        } else if (searchType === 'apaarId') {
          matchesSearch = cleanDigits.length >= 2 && studentApaarDigits.includes(cleanDigits)
        } else {
          matchesSearch = Boolean(
            s.fullName.toLowerCase().includes(q) ||
            s.registrationNumber.toLowerCase().includes(q) ||
            studentCleanReg === cleanRegQ ||
            (cleanRegQ.length >= 3 && studentCleanReg.includes(cleanRegQ)) ||
            (cleanDigits.length >= 3 && studentApaarDigits.includes(cleanDigits)) ||
            (s.apaarId && s.apaarId.toLowerCase().includes(q)) ||
            s.email.toLowerCase().includes(q) ||
            s.department.toLowerCase().includes(q) ||
            s.academicYear.toLowerCase().includes(q) ||
            (s.institutionName && s.institutionName.toLowerCase().includes(q))
          )
        }
      }

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      const matchesDept = deptFilter === 'all' || s.department === deptFilter

      return matchesSearch && matchesStatus && matchesDept
    })
  }, [students, search, searchType, statusFilter, deptFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }
  const handleStatus = (v: typeof statusFilter) => {
    setStatusFilter(v)
    setPage(1)
  }
  const handleDept = (v: string) => {
    setDeptFilter(v)
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setSearchType('all')
    setStatusFilter('all')
    setDeptFilter('all')
    setPage(1)
  }

  const stats = {
    total: students.length,
    verified: students.filter((s) => s.status === 'verified').length,
    pending: students.filter((s) => s.status === 'pending').length,
    rejected: students.filter((s) => s.status === 'rejected').length,
    incomplete: students.filter((s) => s.status === 'incomplete').length,
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {selected && (
        <StudentDetailModal
          student={selected}
          institutionName={adminProfile.institutionName}
          onClose={() => setSelected(null)}
          onUploadDoc={(st) => {
            setUploadTargetStudent(st)
            setShowUploadModal(true)
          }}
        />
      )}

      {showUploadModal && (
        <UploadStudentDocModal
          initialStudent={uploadTargetStudent}
          onClose={() => {
            setShowUploadModal(false)
            setUploadTargetStudent(null)
          }}
        />
      )}

      {/* Metric Cards at the Top */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Students', value: stats.total, icon: <Users size={16} className="text-blue-600" />, color: 'border-blue-100' },
          { label: 'Verified Records', value: stats.verified, icon: <CheckCircle2 size={16} className="text-emerald-600" />, color: 'border-emerald-100' },
          { label: 'Pending Verification', value: stats.pending, icon: <Clock size={16} className="text-amber-600" />, color: 'border-amber-100' },
          { label: 'Rejected / Incomplete', value: stats.rejected + stats.incomplete, icon: <XCircle size={16} className="text-rose-600" />, color: 'border-rose-100' },
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

      {/* Main Student Directory Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Filters Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full sm:max-w-xl">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'all' | 'registrationNumber' | 'apaarId')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shrink-0"
            >
              <option value="all">All Fields</option>
              <option value="registrationNumber">Registration Number</option>
              <option value="apaarId">APAAR ID</option>
            </select>
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="student-search"
                type="search"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={
                  searchType === 'registrationNumber'
                    ? 'Search by registration number...'
                    : searchType === 'apaarId'
                    ? 'Search by 12-digit APAAR ID...'
                    : 'Search by student name, registration no, email…'
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold hidden md:inline">Filters:</span>
            </div>

            {/* Status Filter — explicitly includes verified, pending, rejected, and incomplete */}
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => handleStatus(e.target.value as typeof statusFilter)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 font-medium"
            >
              <option value="all">All Statuses ({students.length})</option>
              <option value="verified">Verified ({stats.verified})</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
              <option value="incomplete">Incomplete ({stats.incomplete})</option>
              <option value="flagged">Flagged ({students.filter((s) => s.status === 'flagged').length})</option>
              <option value="active">Active ({students.filter((s) => s.status === 'active').length})</option>
            </select>

            {/* Department Filter */}
            <select
              id="dept-filter"
              value={deptFilter}
              onChange={(e) => handleDept(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-700 font-medium max-w-[200px]"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'all' ? 'All Departments' : d}
                </option>
              ))}
            </select>

            {(search || statusFilter !== 'all' || deptFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Reset all filters"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => {
                setUploadTargetStudent(null)
                setShowUploadModal(true)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
              title="Upload official document or marksheet to a student record"
            >
              <UploadCloud size={13} />
              <span>Upload Document</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
              title="Download authorized CSV report of student directory"
            >
              <Download size={13} className="text-blue-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-left text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Student Name</th>
                <th className="px-4 py-3 hidden md:table-cell">Institution</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 hidden sm:table-cell">Academic Year</th>
                <th className="px-4 py-3 hidden lg:table-cell">APAAR ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <Search size={22} />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No Student Records Found</p>
                      <p className="text-xs text-slate-500 text-center mt-1">
                        {search
                          ? 'No student found in your college for this identifier.'
                          : students.length === 0
                          ? 'No student records found for this college.'
                          : 'No student profiles match the selected filters.'}
                      </p>
                      <button
                        onClick={resetFilters}
                        className="mt-4 px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                          {s.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{s.fullName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-500">{s.registrationNumber}</span>
                            <span className="text-[10px] text-slate-300 hidden sm:inline">•</span>
                            <span className="text-[10px] text-slate-400 truncate hidden sm:inline">{s.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Institution */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]" title={s.institutionName || adminProfile.institutionName}>
                          {s.institutionName || adminProfile.institutionName}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3">
                      <span className="text-slate-800 font-medium block truncate max-w-[150px]" title={s.department}>
                        {s.department}
                      </span>
                      <span className="text-[10px] text-slate-400">{s.programme}</span>
                    </td>

                    {/* Academic Year */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{s.academicYear}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Sem {s.currentSemester}</span>
                    </td>

                    {/* APAAR ID */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <MaskedApaar apaarId={s.apaarId} />
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        {statusBadge(s.status)}
                        {s.status === 'incomplete' && (
                          <span className="text-[9px] text-orange-600 font-semibold">Missing fields</span>
                        )}
                        {s.status === 'rejected' && (
                          <span className="text-[9px] text-red-600 font-semibold truncate max-w-[90px]" title={s.rejectionReason}>
                            Notice logged
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelected(s)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors shadow-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} students
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="px-2.5 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Department-wise Bulk Document Management ── */}
      <BulkDocumentPanel />
    </div>
  )
}
