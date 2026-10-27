import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  ArrowRight,
  Filter,
  Check,
  Info,
  ShieldAlert,
  AlertCircle,
  FileCheck,
  SlidersHorizontal,
} from 'lucide-react'
import {
  calculateStudentQualityScore,
  mockAnomalyFlags,
  mockOcrSamples,
} from '@/services/aiQualityService'
import { mockAdminStudents, mockAdminAcademicRecords } from '@/services/adminMockData'
import type {
  AnomalyFlagItem,
  OcrExtractionRecord,
  QualityScoringBreakdown,
} from '@/types'

export const PlatformQuality: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scorer' | 'anomalies' | 'ocr'>('scorer')

  // ----------------------------------------------------
  // Section A: Rule-Based Quality Scorer State
  // ----------------------------------------------------
  const [selectedStudentId, setSelectedStudentId] = useState<string>(mockAdminStudents[0].id)
  const [studentSearch, setStudentSearch] = useState('')

  const selectedStudent = useMemo(() => {
    return mockAdminStudents.find((s) => s.id === selectedStudentId) || mockAdminStudents[0]
  }, [selectedStudentId])

  const scoringBreakdown = useMemo<QualityScoringBreakdown>(() => {
    return calculateStudentQualityScore(selectedStudent, mockAdminAcademicRecords)
  }, [selectedStudent])

  // Aggregate statistics across student cohort
  const cohortStats = useMemo(() => {
    const scores = mockAdminStudents.map((s) => calculateStudentQualityScore(s, mockAdminAcademicRecords).overallScore)
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    const highQualityCount = scores.filter((s) => s >= 85).length
    const needsAttentionCount = scores.filter((s) => s < 70).length
    return { avgScore, highQualityCount, needsAttentionCount, totalEvaluated: mockAdminStudents.length }
  }, [])

  // ----------------------------------------------------
  // Section B: Anomaly Detection State
  // ----------------------------------------------------
  const [anomalies, setAnomalies] = useState<AnomalyFlagItem[]>(mockAnomalyFlags)
  const [anomalySeverityFilter, setAnomalySeverityFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all')
  const [anomalySearch, setAnomalySearch] = useState('')
  const [reviewModalAnomaly, setReviewModalAnomaly] = useState<AnomalyFlagItem | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(anomalySearch.toLowerCase()) ||
        item.affectedRecordId.toLowerCase().includes(anomalySearch.toLowerCase()) ||
        item.explanation.toLowerCase().includes(anomalySearch.toLowerCase())

      const matchesSeverity = anomalySeverityFilter === 'all' || item.severity === anomalySeverityFilter

      return matchesSearch && matchesSeverity
    })
  }, [anomalies, anomalySearch, anomalySeverityFilter])

  const handleResolveAnomaly = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewModalAnomaly) return

    setAnomalies((prev) =>
      prev.map((item) => {
        if (item.id !== reviewModalAnomaly.id) return item
        return {
          ...item,
          status: 'resolved',
          reviewedBy: 'Platform Lead Auditor',
          reviewedAt: new Date().toISOString().split('T')[0],
          resolutionNotes: resolutionNote.trim() || 'Reviewed and validated via institutional cross-check.',
        }
      })
    )

    setReviewModalAnomaly(null)
    setResolutionNote('')
  }

  // ----------------------------------------------------
  // Section C: OCR Document Studio State
  // ----------------------------------------------------
  const [ocrRecords, setOcrRecords] = useState<OcrExtractionRecord[]>(mockOcrSamples)
  const [selectedOcrId, setSelectedOcrId] = useState<string>(mockOcrSamples[1].id) // Default to sample with discrepancy
  const [humanConfirmCheck, setHumanConfirmCheck] = useState(false)
  const [ocrSuccessToast, setOcrSuccessToast] = useState<string | null>(null)

  const activeOcrRecord = useMemo(() => {
    return ocrRecords.find((r) => r.id === selectedOcrId) || ocrRecords[0]
  }, [ocrRecords, selectedOcrId])

  const handleFieldEdit = (index: number, newValue: string) => {
    setOcrRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== activeOcrRecord.id) return rec
        const updatedFields = [...rec.extractedFields]
        const target = updatedFields[index]
        updatedFields[index] = {
          ...target,
          humanOverride: newValue,
          isMatch: newValue.trim().toLowerCase() === target.studentRecordValue.trim().toLowerCase(),
        }
        return { ...rec, extractedFields: updatedFields }
      })
    )
  }

  const handleConfirmOcrRecord = () => {
    if (!humanConfirmCheck) return

    setOcrRecords((prev) =>
      prev.map((rec) => {
        if (rec.id !== activeOcrRecord.id) return rec
        return {
          ...rec,
          humanConfirmed: true,
          status: 'confirmed_match',
          reviewedBy: 'Nodal Verification Officer',
        }
      })
    )

    setOcrSuccessToast(`Document extraction verified and committed to student record.`)
    setTimeout(() => setOcrSuccessToast(null), 4000)
    setHumanConfirmCheck(false)
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Sparkles size={12} className="text-purple-600" />
              Explainable AICTE Heuristic Suite
            </span>
            <span className="text-[11px] text-slate-500 font-medium">SIH26263 Data Quality Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Data Quality & Anomaly Detection Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deterministic rule-based quality scoring, heuristic anomaly audits, and human-in-the-loop OCR document extraction.
          </p>
        </div>

        {/* Explainability Banner */}
        <div className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold flex items-center gap-2">
          <Info size={14} className="text-purple-600 shrink-0" />
          <span>Rule-Based Transparency: No opaque machine-learning claims</span>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('scorer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'scorer'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <SlidersHorizontal size={14} />
          Rule-Based Quality Scorer
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-900/30 text-purple-100">
            {cohortStats.avgScore}/100 Avg
          </span>
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'anomalies'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle size={14} />
          Anomaly Detection Console
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
            {anomalies.filter((a) => a.status === 'flagged').length} Flagged
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ocr'
              ? 'bg-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck size={14} />
          OCR Document Review Studio
          <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
            Prototype
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: RULE-BASED STUDENT QUALITY SCORER                                  */}
      {/* ========================================================================= */}
      {activeTab === 'scorer' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Cohort Overview Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cohort Average Score</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">{cohortStats.avgScore}/100</span>
                <span className="text-xs font-bold text-emerald-600">Grade B+</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Across {cohortStats.totalEvaluated} student profiles</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">High Quality (85+)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-700">{cohortStats.highQualityCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  ({Math.round((cohortStats.highQualityCount / cohortStats.totalEvaluated) * 100)}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Ready for automated verification</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Needs Attention (&lt;70)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-600">{cohortStats.needsAttentionCount}</span>
                <span className="text-xs font-semibold text-slate-500">
                  ({Math.round((cohortStats.needsAttentionCount / cohortStats.totalEvaluated) * 100)}%)
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Missing mandatory fields or transcripts</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Rule Heuristics</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-purple-700">7 Active</span>
                <span className="text-xs font-semibold text-purple-600">Deterministic</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Zero arbitrary deductions</p>
            </div>
          </div>

          {/* Student Selector & Score Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Student Selector List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Select Student Record</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Live Evaluator</span>
                </div>

                <div className="relative mt-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate name or roll..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                  />
                </div>

                <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {mockAdminStudents
                    .filter(
                      (s) =>
                        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.registrationNumber.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((s) => {
                      const res = calculateStudentQualityScore(s, mockAdminAcademicRecords)
                      const isSelected = s.id === selectedStudentId
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedStudentId(s.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/60 shadow-xs'
                              : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-slate-900">{s.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.registrationNumber}</p>
                            </div>
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${
                                res.overallScore >= 85
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : res.overallScore >= 70
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {res.overallScore} / 100
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                Quality rules are evaluated synchronously against client state.
              </div>
            </div>

            {/* Right: Detailed Quality Score Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-6">
              {/* Header with Gauge */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900">{selectedStudent.fullName}</span>
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedStudent.registrationNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedStudent.department} • Semester {selectedStudent.currentSemester} • APAAR:{' '}
                    <span className="font-mono">{selectedStudent.apaarId}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Quality Score</p>
                    <p
                      className={`text-3xl font-extrabold ${
                        scoringBreakdown.overallScore >= 85
                          ? 'text-emerald-600'
                          : scoringBreakdown.overallScore >= 70
                          ? 'text-blue-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {scoringBreakdown.overallScore}
                      <span className="text-xs text-slate-400 font-semibold"> / 100</span>
                    </p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center font-extrabold text-base ${
                      scoringBreakdown.overallScore >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : scoringBreakdown.overallScore >= 70
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {scoringBreakdown.grade}
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Deductions & Rule Evaluations
                </h4>
                {scoringBreakdown.deductions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      Full Score Achieved (100/100). Zero missing fields, format errors, or credit anomalies detected.
                    </span>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Rule ID</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Explanation</th>
                          <th className="py-2.5 px-3 text-right">Penalty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scoringBreakdown.deductions.map((ded) => (
                          <tr key={ded.ruleId} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{ded.ruleId}</td>
                            <td className="py-2.5 px-3">
                              <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                {ded.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{ded.description}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-rose-600">
                              -{ded.pointsDeducted} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Actionable Recommendations */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Recommended Remediation Actions
                </h4>
                <div className="space-y-2">
                  {scoringBreakdown.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 flex items-start gap-2.5"
                    >
                      <ArrowRight size={14} className="text-purple-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ANOMALY DETECTION CONSOLE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Regulatory Disclaimer on Non-Accusation */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs text-blue-900 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Human-in-the-Loop Protocol:</span> Anomaly flags are explainable heuristic warnings designed to guide institutional verification officers. They do not constitute a legal or definitive accusation of fraud and require administrative human review before taking action.
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anomalies by description or record ID..."
                value={anomalySearch}
                onChange={(e) => setAnomalySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <Filter size={14} className="text-slate-400" />
                <span className="font-semibold text-slate-500">Severity:</span>
                <select
                  value={anomalySeverityFilter}
                  onChange={(e) => setAnomalySeverityFilter(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                </select>
              </div>
            </div>
          </div>

          {/* Anomalies List */}
          <div className="space-y-3">
            {filteredAnomalies.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                <p className="font-semibold text-slate-800">No anomalies found</p>
                <p className="text-xs mt-0.5">All monitored records conform to heuristic integrity standards.</p>
              </div>
            ) : (
              filteredAnomalies.map((anom) => (
                <div
                  key={anom.id}
                  className={`bg-white p-5 rounded-2xl border transition-all ${
                    anom.status === 'resolved'
                      ? 'border-slate-200 opacity-75'
                      : anom.severity === 'critical'
                      ? 'border-rose-200 hover:border-rose-300'
                      : 'border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          anom.status === 'resolved'
                            ? 'bg-slate-100 text-slate-500'
                            : anom.severity === 'critical'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {anom.status === 'resolved' ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <AlertTriangle size={18} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{anom.id}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              anom.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800'
                                : anom.severity === 'high'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {anom.severity} Severity
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                            Target: {anom.affectedRecordId} ({anom.recordType})
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{anom.title}</h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{anom.explanation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {anom.status === 'resolved' ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                            <CheckCircle2 size={12} /> Resolved
                          </span>
                          {anom.reviewedBy && (
                            <p className="text-[9px] text-slate-400 mt-0.5">By {anom.reviewedBy}</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setReviewModalAnomaly(anom)
                            setResolutionNote('')
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-xs"
                        >
                          Review & Resolve
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recommended Action Ribbon */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      <strong>Recommended Protocol:</strong> {anom.recommendedReviewAction}
                    </span>
                    {anom.resolutionNotes && (
                      <span className="text-slate-400 italic">Notes: {anom.resolutionNotes}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Anomaly Resolution Modal */}
          {reviewModalAnomaly && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
              <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Resolve Anomaly Flag</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Flag ID: {reviewModalAnomaly.id} • Target: {reviewModalAnomaly.affectedRecordId}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleResolveAnomaly} className="p-5 space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <p className="font-bold text-slate-900">{reviewModalAnomaly.title}</p>
                    <p className="text-slate-600 mt-1">{reviewModalAnomaly.explanation}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Administrative Review Notes & Action Taken
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="e.g., Cross-verified with matriculation certificate. Candidate was confirmed and duplicate record merged."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setReviewModalAnomaly(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    >
                      Mark as Reviewed & Resolved
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OCR DOCUMENT REVIEW STUDIO (PROTOTYPE)                             */}
      {/* ========================================================================= */}
      {activeTab === 'ocr' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Honest Prototype Notice */}
          <div className="rounded-xl bg-purple-50 border border-purple-200 p-4 text-xs text-purple-950 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Transparent Demonstration Notice:</span> This OCR Document Review Studio demonstrates the human-in-the-loop validation pipeline. OCR values and confidence ratings are simulated using representative test marksheets. A clean backend API hook is prepared for live Tesseract or Google Cloud Vision OCR engines.
            </div>
          </div>

          {ocrSuccessToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              {ocrSuccessToast}
            </div>
          )}

          {/* Sample Document Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-800">Select Permitted Demonstration Document:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {ocrRecords.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedOcrId(doc.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    doc.id === selectedOcrId
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {doc.documentTitle} ({doc.id})
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-Side Review Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Document Preview (4 Cols) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">{activeOcrRecord.documentTitle}</h3>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {activeOcrRecord.documentType}
                  </span>
                </div>

                <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative group aspect-[3/4] flex items-center justify-center">
                  <img
                    src={activeOcrRecord.previewUrl}
                    alt={activeOcrRecord.documentTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                    <p className="text-xs font-bold">{activeOcrRecord.sampleFileName}</p>
                    <p className="text-[10px] text-slate-300">Certified Optical Scan • 300 DPI</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Simulation Document Node</span>
                <span className="font-mono text-purple-700 font-bold">{activeOcrRecord.id}</span>
              </div>
            </div>

            {/* Right: Field Comparison & Mismatch Resolution (7 Cols) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-7 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Extracted vs Master Record Comparison</h3>
                    <p className="text-[11px] text-slate-500">Mismatches flagged automatically for human verification</p>
                  </div>
                  {activeOcrRecord.humanConfirmed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <CheckCircle2 size={13} /> Confirmed by Officer
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <AlertCircle size={13} /> Requires Review
                    </span>
                  )}
                </div>

                {/* Field Comparison Table */}
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Field Name</th>
                        <th className="py-2.5 px-3">Extracted from Document</th>
                        <th className="py-2.5 px-3">Student Master Record</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeOcrRecord.extractedFields.map((field, idx) => {
                        const effectiveVal = field.humanOverride !== undefined ? field.humanOverride : field.extractedValue
                        const isFieldMatch = field.isMatch

                        return (
                          <tr
                            key={field.fieldName}
                            className={!isFieldMatch ? 'bg-rose-50/50' : 'hover:bg-slate-50/50'}
                          >
                            {/* Field Name */}
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {field.fieldName}
                              <span className="block text-[9px] text-slate-400 font-mono">
                                Conf: {field.confidencePercent}%
                              </span>
                            </td>

                            {/* Extracted / Editable Value */}
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={effectiveVal}
                                onChange={(e) => handleFieldEdit(idx, e.target.value)}
                                className={`w-full px-2 py-1 text-xs rounded border font-mono ${
                                  !isFieldMatch
                                    ? 'border-rose-300 bg-white text-rose-950 font-bold'
                                    : 'border-slate-200 bg-slate-50 text-slate-800'
                                }`}
                              />
                            </td>

                            {/* Master Record Value */}
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                              {field.studentRecordValue}
                            </td>

                            {/* Match Indicator */}
                            <td className="py-2.5 px-3 text-center">
                              {isFieldMatch ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold text-[11px]">
                                  <Check size={14} /> Match
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-rose-600 font-bold text-[11px]">
                                  <XCircle size={14} /> Mismatch
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

              {/* Confirmation & Human Override Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={humanConfirmCheck}
                    onChange={(e) => setHumanConfirmCheck(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                  />
                  <span className="text-xs text-slate-700 leading-tight">
                    <strong>Mandatory Human Confirmation:</strong> I have physically or visually reviewed the document image against the extracted and master records. I certify these entries under AICTE audit guidelines.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmOcrRecord}
                    disabled={!humanConfirmCheck}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Accept & Commit Verified Extraction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlatformQuality
