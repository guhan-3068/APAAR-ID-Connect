import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users,
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
  Filter,
  RefreshCw,
  Layers,
  GraduationCap,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import { usePlatformContext } from '@/context/PlatformContext'
import { aicteAdminService } from '@/services/aicteAdminService'

export const PlatformOverview: React.FC = () => {
  const navigate = useNavigate()
  const { aicteInstitutions, aicteStudents } = usePlatformContext()

  // Filter state
  const [academicYear, setAcademicYear] = useState('all')
  const [selectedState, setSelectedState] = useState('all')
  const [selectedInstitution, setSelectedInstitution] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')

  // Compute unique filter options
  const uniqueStates = useMemo(() => {
    return Array.from(new Set(aicteInstitutions.map((i) => i.state))).sort()
  }, [aicteInstitutions])

  const uniqueCourses = useMemo(() => {
    const courses = new Set<string>()
    aicteInstitutions.forEach((i) => i.approvedCourses.forEach((c) => courses.add(c.course)))
    return Array.from(courses).sort()
  }, [aicteInstitutions])

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>()
    aicteInstitutions.forEach((i) => i.approvedCourses.forEach((c) => depts.add(c.department)))
    return Array.from(depts).sort()
  }, [aicteInstitutions])

  // Compute dynamic metrics via service based on active filters
  const metrics = useMemo(() => {
    return aicteAdminService.getDashboardMetrics({
      academicYear,
      state: selectedState,
      institution: selectedInstitution,
      course: selectedCourse,
      department: selectedDepartment,
    })
  }, [academicYear, selectedState, selectedInstitution, selectedCourse, selectedDepartment, aicteInstitutions, aicteStudents])

  // Highlight specific intake-exceeded cases (e.g. NIET 120 intake vs 145 reported)
  const intakeDiscrepancies = useMemo(() => {
    return metrics.intakeVsAdmissions.filter((item) => item.isExceeded)
  }, [metrics.intakeVsAdmissions])

  const hasActiveFilters =
    academicYear !== 'all' ||
    selectedState !== 'all' ||
    selectedInstitution !== 'all' ||
    selectedCourse !== 'all' ||
    selectedDepartment !== 'all'

  const resetFilters = () => {
    setAcademicYear('all')
    setSelectedState('all')
    setSelectedInstitution('all')
    setSelectedCourse('all')
    setSelectedDepartment('all')
  }

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* PAGE HEADER                                                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldCheck size={13} className="text-purple-600" />
              AICTE Apex Governance
            </span>
            <span className="text-[11px] text-slate-500 font-medium">National Higher Education Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Student Enrolment Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralised nationwide surveillance of institutional student admissions, approved intake capacity, and regulatory submissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/platform/validation"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all shadow-xs"
          >
            <FileWarning size={15} />
            Data Validation &amp; Duplicates
          </Link>
          <Link
            to="/platform/institutions"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
          >
            <Building2 size={15} />
            Institution Management
          </Link>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* FILTER BAR                                                        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Enrolment Filter Engine</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={11} /> Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Academic Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All Academic Years</option>
              <option value="2024-2025">2024-2025 (Current)</option>
              <option value="2023-2024">2023-2024</option>
              <option value="2022-2023">2022-2023</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State / UT</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All States &amp; UTs</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Institution */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Institution</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All AICTE Institutions</option>
              {aicteInstitutions.map((inst) => (
                <option key={inst.id} value={inst.name}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Course Level</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All Course Levels</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-700 font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="all">All Departments</option>
              {uniqueDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 6 SUMMARY CARDS (SPECIFICATION REQUIRED)                          */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total Registered Institutions */}
        <div
          onClick={() => navigate('/platform/institutions')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutions</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 group-hover:scale-110 transition-transform">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">{metrics.totalInstitutions}</span>
            <p className="text-[10px] text-slate-500 mt-0.5">Approved Technical Colleges</p>
          </div>
        </div>

        {/* Card 2: Total Student Enrolments Reported */}
        <div
          onClick={() => navigate('/platform/validation')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Enrolments</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 group-hover:scale-110 transition-transform">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">{metrics.totalEnrolments.toLocaleString()}</span>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Reported Admissions</p>
          </div>
        </div>

        {/* Card 3: Total Approved Intake */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Intake</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-slate-900">{metrics.totalApprovedIntake.toLocaleString()}</span>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Sanctioned Quota</p>
          </div>
        </div>

        {/* Card 4: Records Requiring Review */}
        <div
          onClick={() => navigate('/platform/validation?status=pending')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Requiring Review</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <FileWarning size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-amber-900">{metrics.recordsRequiringReview}</span>
            <p className="text-[10px] text-amber-700 mt-0.5 font-medium">Flagged Submissions</p>
          </div>
        </div>

        {/* Card 5: Institutions with Pending Submissions */}
        <div
          onClick={() => navigate('/platform/institutions?status=pending')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-orange-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Pending Batches</span>
            <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-700 group-hover:scale-110 transition-transform">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-orange-900">{metrics.institutionsWithPending}</span>
            <p className="text-[10px] text-orange-700 mt-0.5 font-medium">Incomplete Submissions</p>
          </div>
        </div>

        {/* Card 6: Potential Duplicate Student Records */}
        <div
          onClick={() => navigate('/platform/validation?status=duplicate')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Duplicate Records</span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 group-hover:scale-110 transition-transform">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-extrabold text-rose-900">{metrics.potentialDuplicates}</span>
            <p className="text-[10px] text-rose-700 mt-0.5 font-medium">Dual Enrolments Flagged</p>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* REGULATORY INTAKE DISCREPANCY ALERT BANNER                        */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {intakeDiscrepancies.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-amber-900">
                Regulatory Discrepancy Alert: Reported Admissions Exceed Approved Intake
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                The compliance engine detected <strong>{intakeDiscrepancies.length} institutional programme(s)</strong> where actual reported admissions exceed approved AICTE intake quotas.
                As per regulatory guidelines, this discrepancy is flagged for administrative investigation (e.g. to confirm approved Lateral Entry or Supernumerary quota seats) without prematurely presuming non-compliance.
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {intakeDiscrepancies.map((d, idx) => (
                  <div key={idx} className="bg-white/90 rounded-xl p-3 border border-amber-300/80 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{d.institutionName}</p>
                      <p className="text-[11px] text-slate-500">{d.course} in {d.department}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        +{d.difference} Excess ({d.reportedAdmissions} / {d.approvedIntake})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* VISUALISATIONS GRID                                               */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualisation 1: Approved Intake vs Actual Reported Admissions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <GraduationCap size={16} className="text-purple-600" />
                  Approved Intake vs Actual Reported Admissions
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Comparison across institution programmes</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Quota Audit</span>
            </div>

            <div className="mt-4 space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {metrics.intakeVsAdmissions.slice(0, 7).map((item, i) => {
                const ratio = Math.round((item.reportedAdmissions / (item.approvedIntake || 1)) * 100)
                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="truncate mr-2">
                        <span className="font-bold text-slate-900">{item.institutionName.split(' ')[0]} {item.institutionName.split(' ')[1]}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">· {item.department}</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="font-mono text-slate-600">{item.reportedAdmissions} / {item.approvedIntake}</span>
                        {item.isExceeded ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            +{item.difference} Over
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {ratio}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all ${
                          item.isExceeded ? 'bg-rose-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${Math.min(100, ratio)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Utilization Range: 75% – 121%</span>
            <Link to="/platform/institutions" className="text-purple-600 font-bold hover:underline flex items-center gap-1">
              View all quotas <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* Visualisation 2: Student Enrolment by State */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  Student Enrolment by State / Union Territory
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Geographic intake capacity &amp; reported students</p>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {metrics.enrolmentByState.length} States
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {metrics.enrolmentByState.map((st) => {
                const maxEnrolled = metrics.enrolmentByState[0]?.enrolled || 1
                const barWidth = Math.round((st.enrolled / maxEnrolled) * 100)
                return (
                  <div key={st.state} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800">{st.state}</span>
                      <span className="font-mono font-bold text-slate-700">
                        {st.enrolled.toLocaleString()} Enrolled{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({st.institutions} College{st.institutions > 1 ? 's' : ''})</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Coverage: Nationwide Central &amp; State Quotas</span>
            <span className="font-semibold text-blue-700">100% Affiliated Nodes</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* SECOND ROW: COURSE / DEPT & ACADEMIC YEAR TRENDS                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualisation 3: Course-wise and Department-wise Enrolment */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-emerald-600" />
                  Course &amp; Department Enrolment Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Aggregate enrolments by academic discipline</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Admissions</span>
            </div>

            <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {metrics.courseAndDeptEnrolment.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{c.department}</span>
                    <span className="text-[10px] text-slate-400">{c.course} Degree Programme</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-slate-800 text-sm block">
                      {c.enrolled}
                    </span>
                    <span className="text-[10px] text-slate-400">Intake: {c.intake}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Highest: Computer Science &amp; Engineering</span>
            <span className="text-emerald-700 font-semibold">Active Enrolment Tracking</span>
          </div>
        </div>

        {/* Visualisation 4: Academic-Year-Wise Enrolment Trends */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-600" />
                  Academic-Year-Wise Enrolment Trends
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Year-over-year admission volume and verification integrity</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                3-Year Audit
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {metrics.academicYearTrends.map((trend) => (
                <div key={trend.academicYear} className="p-3.5 rounded-xl border border-slate-200/70 bg-gradient-to-r from-slate-50 to-white">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-extrabold text-slate-900">{trend.academicYear}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-slate-700">{trend.enrolments.toLocaleString()} Admissions</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                        {trend.verified} Verified
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <div>Approved Intake: <strong className="text-slate-700">{trend.intake}</strong></div>
                    <div>Verified Rate: <strong className="text-emerald-700">{Math.round((trend.verified / trend.enrolments) * 100)}%</strong></div>
                    <div>Flagged Duplicates: <strong className={trend.duplicates > 0 ? 'text-rose-600' : 'text-slate-700'}>{trend.duplicates}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>National Verification Coverage: 88.4%</span>
            <span className="font-semibold text-indigo-700">+8.4% YoY Growth</span>
          </div>
        </div>
      </div>
    </div>
  )
}
