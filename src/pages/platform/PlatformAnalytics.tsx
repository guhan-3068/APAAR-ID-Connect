import React, { useState, useMemo } from 'react'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Filter,
} from 'lucide-react'
import { usePlatformContext } from '@/context/PlatformContext'
import { aicteAdminService } from '@/services/aicteAdminService'

type ReportType =
  | 'intake_discrepancy'
  | 'state_enrolment'
  | 'duplicate_apaar'
  | 'submission_compliance'

export const PlatformAnalytics: React.FC = () => {
  const { aicteInstitutions, aicteStudents } = usePlatformContext()

  // Report configuration
  const [activeReport, setActiveReport] = useState<ReportType>('intake_discrepancy')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025')
  const [selectedState, setSelectedState] = useState('all')

  const uniqueStates = useMemo(() => {
    return Array.from(new Set(aicteInstitutions.map((i) => i.state))).sort()
  }, [aicteInstitutions])

  // Compute metrics dynamically
  const metrics = useMemo(() => {
    return aicteAdminService.getDashboardMetrics({
      academicYear: selectedAcademicYear,
      state: selectedState,
    })
  }, [selectedAcademicYear, selectedState, aicteInstitutions, aicteStudents])

  // ─────────────────────────────────────────────────────────────────────────
  // REPORT 1: INTAKE VS ADMISSION DISCREPANCY DATA
  // ─────────────────────────────────────────────────────────────────────────
  const intakeDiscrepancyData = useMemo(() => {
    return metrics.intakeVsAdmissions.map((row) => ({
      ...row,
      ratio: Math.round((row.reportedAdmissions / (row.approvedIntake || 1)) * 100),
    }))
  }, [metrics.intakeVsAdmissions])

  // ─────────────────────────────────────────────────────────────────────────
  // REPORT 2: STATE ENROLMENT SUMMARY DATA
  // ─────────────────────────────────────────────────────────────────────────
  const stateEnrolmentData = useMemo(() => {
    return metrics.enrolmentByState.map((st) => ({
      state: st.state,
      institutions: st.institutions,
      approvedIntake: st.intake,
      reportedAdmissions: st.enrolled,
      utilizationRate: Math.round((st.enrolled / (st.intake || 1)) * 100),
    }))
  }, [metrics.enrolmentByState])

  // ─────────────────────────────────────────────────────────────────────────
  // REPORT 3: DUPLICATE APAAR AUDIT DATA
  // ─────────────────────────────────────────────────────────────────────────
  const duplicateApaarData = useMemo(() => {
    return aicteStudents.filter(
      (s) =>
        s.validationStatus === 'Potential Duplicate' ||
        s.issues.some((i) => i.code === 'cross_institution_duplicate' || i.code === 'repeated_apaar')
    )
  }, [aicteStudents])

  // ─────────────────────────────────────────────────────────────────────────
  // REPORT 4: SUBMISSION COMPLIANCE STATUS DATA
  // ─────────────────────────────────────────────────────────────────────────
  const submissionComplianceData = useMemo(() => {
    return aicteInstitutions.map((inst) => ({
      institutionName: inst.name,
      aicteCode: inst.aicteCode,
      state: inst.state,
      type: inst.type,
      submissionStatus: inst.submissionStatus,
      unresolvedIssues: inst.unresolvedIssuesCount,
      complianceScore: inst.complianceScore,
      openCorrectionRequests: inst.correctionRequests.filter((r) => r.status === 'open').length,
    }))
  }, [aicteInstitutions])

  // Export CSV Handler
  const handleExportReportCsv = () => {
    let headers: string[] = []
    let rows: string[][] = []
    let filename = `AICTE_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.csv`

    if (activeReport === 'intake_discrepancy') {
      headers = ['Institution Name', 'AICTE Code', 'Programme', 'Department', 'Approved Intake', 'Reported Admissions', 'Discrepancy', 'Utilization %', 'Exceeded Flag']
      rows = intakeDiscrepancyData.map((d) => [
        `"${d.institutionName}"`,
        `"${d.aicteCode}"`,
        `"${d.course}"`,
        `"${d.department}"`,
        String(d.approvedIntake),
        String(d.reportedAdmissions),
        String(d.difference),
        `${d.ratio}%`,
        d.isExceeded ? 'EXCEEDED' : 'WITHIN_QUOTA',
      ])
    } else if (activeReport === 'state_enrolment') {
      headers = ['State / UT', 'Participating Institutions', 'Approved Intake', 'Reported Admissions', 'Capacity Utilization %']
      rows = stateEnrolmentData.map((s) => [
        `"${s.state}"`,
        String(s.institutions),
        String(s.approvedIntake),
        String(s.reportedAdmissions),
        `${s.utilizationRate}%`,
      ])
    } else if (activeReport === 'duplicate_apaar') {
      headers = ['Student Name', 'APAAR ID', 'Register Number', 'Submitting Institution', 'AICTE Code', 'Course', 'Department', 'Clashing Institution', 'Status']
      rows = duplicateApaarData.map((s) => [
        `"${s.studentName}"`,
        `"${s.apaarId}"`,
        `"${s.registerNumber}"`,
        `"${s.institutionName}"`,
        `"${s.institutionId}"`,
        `"${s.course}"`,
        `"${s.department}"`,
        `"${s.duplicateMatchInstitution || 'Within-Batch Repeated ID'}"`,
        `"${s.validationStatus}"`,
      ])
    } else if (activeReport === 'submission_compliance') {
      headers = ['Institution Name', 'AICTE Code', 'State', 'Type', 'Submission Status', 'Unresolved Issues', 'Compliance Score', 'Open Correction Notices']
      rows = submissionComplianceData.map((c) => [
        `"${c.institutionName}"`,
        `"${c.aicteCode}"`,
        `"${c.state}"`,
        `"${c.type}"`,
        `"${c.submissionStatus}"`,
        String(c.unresolvedIssues),
        `${c.complianceScore}%`,
        String(c.openCorrectionRequests),
      ])
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export JSON Handler
  const handleExportReportJson = () => {
    let exportData: any = {}
    if (activeReport === 'intake_discrepancy') exportData = intakeDiscrepancyData
    else if (activeReport === 'state_enrolment') exportData = stateEnrolmentData
    else if (activeReport === 'duplicate_apaar') exportData = duplicateApaarData
    else exportData = submissionComplianceData

    const jsonString = JSON.stringify(
      {
        reportType: activeReport,
        generatedAt: new Date().toISOString(),
        academicYear: selectedAcademicYear,
        jurisdiction: 'AICTE National Higher Education Regulatory Cell',
        data: exportData,
      },
      null,
      2
    )

    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `AICTE_Report_${activeReport}_${new Date().toISOString().split('T')[0]}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────────── */}
      {/* PAGE HEADER                                                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <BarChart3 size={13} className="text-indigo-600" />
              Module 4: Regulatory Reports &amp; Analytics
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Compliance Audit Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            AICTE Regulatory Reports &amp; Analytics Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Generate and export statutory compliance reports on intake quota discrepancies, state-wise enrolment, and cross-institutional duplicate enrolments.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportReportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all shadow-xs"
          >
            <FileSpreadsheet size={14} /> Export Report CSV
          </button>
          <button
            onClick={handleExportReportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
          >
            <Download size={14} /> Export Audit JSON
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* REPORT SELECTOR & PARAMETERS                                      */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Filter size={15} className="text-indigo-600" />
            Select Regulatory Report Type
          </h2>
          <span className="text-[11px] text-slate-400">Dynamically generated from current institutional records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'intake_discrepancy' as ReportType,
              title: 'Approved Intake vs Admissions',
              desc: 'Identifies programmes with admissions exceeding sanctioned quota',
              badge: `${metrics.intakeVsAdmissions.filter((d) => d.isExceeded).length} Over-Quota`,
              badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
            },
            {
              id: 'state_enrolment' as ReportType,
              title: 'State-Wise Enrolment Summary',
              desc: 'Geographic admission distribution & capacity utilization',
              badge: `${metrics.enrolmentByState.length} States Tracked`,
              badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
            },
            {
              id: 'duplicate_apaar' as ReportType,
              title: 'Duplicate APAAR Audit Report',
              desc: 'Cross-institution duplicate enrolments & identity clashes',
              badge: `${duplicateApaarData.length} Flags`,
              badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
            },
            {
              id: 'submission_compliance' as ReportType,
              title: 'Institutional Submission Compliance',
              desc: 'Monitors batch submission milestones & outstanding notices',
              badge: `${aicteInstitutions.length} Colleges`,
              badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            },
          ].map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                activeReport === report.id
                  ? 'bg-indigo-50/50 border-indigo-400 shadow-sm ring-1 ring-indigo-400'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block mb-2 ${report.badgeColor}`}>
                  {report.badge}
                </span>
                <h3 className="text-xs font-bold text-slate-900 block">{report.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{report.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-700 bg-white"
            >
              <option value="2024-2025">Academic Year 2024-2025 (Current)</option>
              <option value="2023-2024">Academic Year 2023-2024</option>
              <option value="2022-2023">Academic Year 2022-2023</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State / Jurisdiction</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-slate-700 bg-white"
            >
              <option value="all">National (All States &amp; UTs)</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-between sm:justify-end gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              Data synchronized from live institutional repository
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* REPORT PREVIEW TABLE                                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Title Bar */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {activeReport === 'intake_discrepancy' && 'Report: Approved Intake vs Reported Admissions Discrepancies'}
              {activeReport === 'state_enrolment' && 'Report: State-Wise Enrolment & Capacity Utilization Summary'}
              {activeReport === 'duplicate_apaar' && 'Report: Cross-Institutional Duplicate APAAR & Dual-Enrolment Audit'}
              {activeReport === 'submission_compliance' && 'Report: Institutional Submission Milestones & Compliance Health'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Filtered for Academic Year: <strong>{selectedAcademicYear}</strong> · Jurisdiction:{' '}
              <strong>{selectedState === 'all' ? 'National' : selectedState}</strong>
            </p>
          </div>

          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            Official Regulatory Audit View
          </span>
        </div>

        <div className="overflow-x-auto">
          {/* ── Table 1: Intake Discrepancy ── */}
          {activeReport === 'intake_discrepancy' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">AICTE Code</th>
                  <th className="py-3 px-4">Programme &amp; Department</th>
                  <th className="py-3 px-4">Approved Intake</th>
                  <th className="py-3 px-4">Reported Admissions</th>
                  <th className="py-3 px-4">Difference</th>
                  <th className="py-3 px-4">Utilization</th>
                  <th className="py-3 px-4 text-right">Regulatory Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {intakeDiscrepancyData.map((d, i) => (
                  <tr key={i} className={`hover:bg-slate-50/80 ${d.isExceeded ? 'bg-rose-50/20' : ''}`}>
                    <td className="py-3 px-4 font-bold text-slate-900">{d.institutionName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{d.aicteCode}</td>
                    <td className="py-3 px-4 text-slate-800">{d.course} · {d.department}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{d.approvedIntake}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{d.reportedAdmissions}</td>
                    <td className="py-3 px-4 font-mono">
                      {d.isExceeded ? (
                        <span className="font-extrabold text-rose-700">+{d.difference}</span>
                      ) : (
                        <span className="text-slate-500">{d.difference}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{d.ratio}%</td>
                    <td className="py-3 px-4 text-right">
                      {d.isExceeded ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Intake Exceeded (Investigation Needed)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Within Approved Quota
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Table 2: State Enrolment ── */}
          {activeReport === 'state_enrolment' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">State / Union Territory</th>
                  <th className="py-3 px-4">Participating Institutions</th>
                  <th className="py-3 px-4">Total Approved Intake</th>
                  <th className="py-3 px-4">Total Reported Admissions</th>
                  <th className="py-3 px-4">Capacity Utilization</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stateEnrolmentData.map((st) => (
                  <tr key={st.state} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{st.state}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{st.institutions} Colleges</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{st.approvedIntake.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.reportedAdmissions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{st.utilizationRate}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Reporting Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Table 3: Duplicate APAAR ── */}
          {activeReport === 'duplicate_apaar' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">APAAR ID Number</th>
                  <th className="py-3 px-4">Registration No</th>
                  <th className="py-3 px-4">Submitting Institution</th>
                  <th className="py-3 px-4">Clashing Institutional Match</th>
                  <th className="py-3 px-4">Detection Type</th>
                  <th className="py-3 px-4 text-right">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {duplicateApaarData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 bg-rose-50/20">
                    <td className="py-3 px-4 font-bold text-slate-900">{d.studentName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{d.apaarId}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{d.registerNumber}</td>
                    <td className="py-3 px-4 text-slate-800">{d.institutionName}</td>
                    <td className="py-3 px-4 font-bold text-rose-800">{d.duplicateMatchInstitution || 'Within-Batch Repeated ID'}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Dual-Enrolment Suspected
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {d.validationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Table 4: Submission Compliance ── */}
          {activeReport === 'submission_compliance' && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">AICTE Code</th>
                  <th className="py-3 px-4">State &amp; Type</th>
                  <th className="py-3 px-4">Submission Status</th>
                  <th className="py-3 px-4">Open Data Issues</th>
                  <th className="py-3 px-4">Compliance Health</th>
                  <th className="py-3 px-4 text-right">Active Correction Notices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissionComplianceData.map((c) => (
                  <tr key={c.aicteCode} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.institutionName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{c.aicteCode}</td>
                    <td className="py-3 px-4 text-slate-700">{c.state} · {c.type}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.submissionStatus === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.submissionStatus === 'Correction Required'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {c.submissionStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.unresolvedIssues}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{c.complianceScore}%</td>
                    <td className="py-3 px-4 text-right">
                      {c.openCorrectionRequests > 0 ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {c.openCorrectionRequests} Pending Notice
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
