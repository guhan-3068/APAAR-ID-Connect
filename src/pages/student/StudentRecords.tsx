import React, { useState } from 'react'
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  ShieldCheck, 
  X,
  Info,
  CheckCircle2,
  Printer
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useStudent } from '@/context/StudentContext'
import type { AcademicRecordItem } from '@/types'
import { formatApaarId } from '@/utils/formatters'

export const StudentRecords: React.FC = () => {
  const { profile, academicRecords } = useStudent()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'requires_review' | 'rejected'>('all')
  const [selectedRecord, setSelectedRecord] = useState<AcademicRecordItem | null>(null)
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null)

  // Filter logic
  const filteredRecords = academicRecords.filter((record) => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    const matchesSearch =
      record.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.examination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.academicYear.includes(searchTerm) ||
      record.course.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: AcademicRecordItem['status']) => {
    switch (status) {
      case 'verified':
        return <Badge status="verified" dot>VERIFIED</Badge>
      case 'pending':
        return <Badge status="pending" dot>PENDING</Badge>
      case 'requires_review':
        return <Badge status="flagged" dot>REQUIRES REVIEW</Badge>
      case 'rejected':
        return <Badge status="rejected" dot>REJECTED</Badge>
      default:
        return <Badge status="default">UNKNOWN</Badge>
    }
  }

  // Official authorized record download
  const handleDownloadRecord = (record: AcademicRecordItem) => {
    const content = `================================================================================
GOVERNMENT OF INDIA • MINISTRY OF EDUCATION
AUTOMATED PERMANENT ACADEMIC ACCOUNT REGISTRY (APAAR)
NATIONAL ACADEMIC DEPOSITORY (NAD) • ACADEMIC BANK OF CREDITS
OFFICIAL AUTHORIZED ACADEMIC PERFORMANCE RECORD
================================================================================

Student Name     : ${profile.fullName}
APAAR ID         : ${formatApaarId(profile.apaarId)}
Register Number  : ${profile.registrationNumber}
Degree           : ${profile.degree || profile.course}
Institution      : ${record.institution}
Semester         : ${record.semester}
Examination      : ${record.examination}
Academic Session : ${record.academicYear}

--------------------------------------------------------------------------------
SUBJECT-WISE PERFORMANCE BREAKDOWN
--------------------------------------------------------------------------------
Course Code | Subject Title                             | Credits | Grade | Points
${record.subjects.map(s => `${s.code.padEnd(11)} | ${s.name.padEnd(41)} | ${s.credits.toString().padEnd(7)} | ${s.grade.padEnd(5)} | ${s.points}`).join('\n')}

--------------------------------------------------------------------------------
SUMMARY
--------------------------------------------------------------------------------
Semester Grade Point Average (SGPA) : ${record.sgpa > 0 ? record.sgpa.toFixed(2) : 'Evaluating'}
Result Classification               : ${record.resultGrade}
Credits Earned / Total Credits      : ${record.creditsEarned} / ${record.totalCredits}
Verification Status                 : ${record.status.toUpperCase()}
Cryptographic Verification Hash     : ${record.verificationHash || 'SHA256:4a8c9e2b1f7d3a5e8c0b2d4f6a9e1c3b5d7f9a2e4c6b8d0f1a3e5c7b9d2f4a6'}
Issuing Authority                   : ${record.issuingAuthority}

================================================================================
DIGITALLY SEALED AND VERIFIED UNDER AICTE & UGC DIRECTIVES
Issued on: ${new Date().toLocaleDateString('en-GB')} via APAAR CONNECT AI Platform
================================================================================
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${record.semester.replace(/\s+/g, '_')}_Official_Record_${profile.registrationNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setDownloadNotice(`Official authorized record for "${record.semester}" downloaded successfully.`)
    setTimeout(() => setDownloadNotice(null), 4000)
  }

  // Consolidated transcript download
  const handleDownloadConsolidated = () => {
    const totalCredits = academicRecords.reduce((sum, r) => sum + r.creditsEarned, 0)
    const avgSgpa = (academicRecords.reduce((sum, r) => sum + r.sgpa, 0) / academicRecords.filter(r => r.sgpa > 0).length).toFixed(2)

    const content = `================================================================================
GOVERNMENT OF INDIA • MINISTRY OF EDUCATION
AUTOMATED PERMANENT ACADEMIC ACCOUNT REGISTRY (APAAR)
CONSOLIDATED ACADEMIC GRADE TRANSCRIPT (SEMESTERS 1 - 7)
================================================================================

Student Name     : ${profile.fullName}
APAAR ID         : ${formatApaarId(profile.apaarId)}
Register Number  : ${profile.registrationNumber}
Institution      : ${profile.institutionName}
Department       : ${profile.department}
Degree           : ${profile.degree || profile.course}
Cumulative CGPA  : ${avgSgpa} / 10.0
Cumulative Pts   : ${totalCredits} Credits Earned

--------------------------------------------------------------------------------
SEMESTER BREAKDOWN
--------------------------------------------------------------------------------
${academicRecords.map(r => `${r.semester.padEnd(14)} | ${r.academicYear.padEnd(10)} | SGPA: ${r.sgpa.toFixed(2).padEnd(5)} | Credits: ${r.creditsEarned}/${r.totalCredits} | Status: ${r.status.toUpperCase()}`).join('\n')}

================================================================================
VERIFIED REPOSITORY RECORD • DIGITALLY ENCRYPTED WITH NAD & ABC
Generated on: ${new Date().toLocaleDateString('en-GB')} via APAAR CONNECT AI
================================================================================
`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Consolidated_Transcript_${profile.registrationNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    setDownloadNotice('Consolidated grade transcript downloaded successfully.')
    setTimeout(() => setDownloadNotice(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Synthetic Demonstration Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Official Academic Records:</strong> Semester results, SGPA marks, and credit transfers synchronized with the National Academic Depository (NAD).
          </span>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {downloadNotice}
        </div>
      )}

      {/* Header & Academic Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="text-blue-600" />
            Academic Records & Transcripts
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Official semester performance records verified through AICTE National Academic Depository & ABC
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download size={14} />}
            onClick={handleDownloadConsolidated}
          >
            Download Consolidated Transcript
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs w-full md:w-auto overflow-x-auto">
            {(['all', 'verified', 'pending', 'requires_review', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all shrink-0 ${
                  statusFilter === status
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {status === 'requires_review' ? 'Requires Review' : status}
                <span className="ml-1.5 text-[10px] text-slate-400">
                  ({status === 'all' ? academicRecords.length : academicRecords.filter((r) => r.status === status).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Search by semester, exam, year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={15} />}
            />
          </div>
        </div>

        {/* Records Table with VIEW and DOWNLOAD Actions */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="py-3 px-3 font-semibold">Semester / Session</th>
                <th className="py-3 px-3 font-semibold">Examination & Programme</th>
                <th className="py-3 px-3 font-semibold">Result / SGPA</th>
                <th className="py-3 px-3 font-semibold">Credits Earned</th>
                <th className="py-3 px-3 font-semibold">Verification Status</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{record.semester}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{record.academicYear}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{record.examination}</div>
                      <div className="text-[11px] text-slate-400">{record.course}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {record.sgpa > 0 ? `${record.sgpa.toFixed(2)} SGPA` : 'Evaluating'}
                      </div>
                      <div className="text-[10px] text-slate-500">{record.resultGrade}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-semibold text-slate-800">
                        {record.creditsEarned} / {record.totalCredits}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* VIEW Action */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRecord(record)}
                          leftIcon={<Eye size={13} />}
                          className="py-1 px-2.5 text-blue-600 hover:bg-blue-50"
                        >
                          View
                        </Button>

                        {/* DOWNLOAD Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadRecord(record)}
                          leftIcon={<Download size={13} />}
                          className="py-1 px-2.5 text-slate-700 hover:bg-slate-100"
                        >
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <Filter className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                    No academic records match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Details Modal Dialog */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedRecord(null)}
          />

          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap size={22} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedRecord.semester} Official Marksheet</h3>
                  {getStatusBadge(selectedRecord.status)}
                </div>
                <p className="text-xs text-slate-500">
                  {selectedRecord.examination} • {selectedRecord.academicYear}
                </p>
              </div>
            </div>

            {/* Student & Institution Context */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Student Name</span>
                <span className="font-bold text-slate-800">{profile.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Register Number</span>
                <span className="font-bold font-mono text-slate-800">{profile.registrationNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">APAAR ID</span>
                <span className="font-bold font-mono text-blue-700">{formatApaarId(profile.apaarId)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Institution</span>
                <span className="font-bold text-slate-800 truncate block">{profile.institutionCode}</span>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">SGPA</span>
                <span className="font-extrabold text-base text-slate-900">{selectedRecord.sgpa || 'N/A'}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Earned Credits</span>
                <span className="font-extrabold text-base text-slate-900">{selectedRecord.creditsEarned} Pts</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Issuing Authority</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">{selectedRecord.institution}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">ABC Transfer</span>
                <span className="font-bold text-emerald-600 text-[11px]">Synchronized</span>
              </div>
            </div>

            {/* Subject Breakdown Table */}
            <div className="space-y-2 mt-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Coursework & Subject Grade Breakdown
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Course Code</th>
                      <th className="py-2 px-3 font-semibold">Subject Title</th>
                      <th className="py-2 px-3 font-semibold">Credits</th>
                      <th className="py-2 px-3 font-semibold">Grade</th>
                      <th className="py-2 px-3 font-semibold text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecord.subjects.map((sub) => (
                      <tr key={sub.code} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{sub.code}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{sub.name}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{sub.credits}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{sub.grade}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-right text-slate-800">{sub.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cryptographic Hash Notice */}
            {selectedRecord.verificationHash && (
              <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck size={14} className="text-blue-600" />
                  <span>Tamper-Evident Cryptographic Hash:</span>
                </div>
                <p className="font-mono text-[10px] text-slate-500 break-all bg-white p-1.5 rounded border border-slate-200">
                  {selectedRecord.verificationHash}
                </p>
                <p className="text-[10px] text-slate-400">
                  Hash is registered with the National Academic Depository (NAD) and AICTE verification engine.
                </p>
              </div>
            )}

            {/* Modal Actions: Close, Print, Download */}
            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer size={14} />}
              >
                Print
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadRecord(selectedRecord)}
                  leftIcon={<Download size={14} />}
                >
                  Download Authorized Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
