import React, { useState } from 'react'
import { 
  FolderArchive, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download, 
  Lock, 
  ShieldCheck, 
  X, 
  Building2,
  FileCheck2
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { useStudent } from '@/context/StudentContext'
import type { StudentDocumentItem } from '@/types'
import { formatApaarId } from '@/utils/formatters'

export const StudentDocuments: React.FC = () => {
  const { profile, documents, showToast } = useStudent()

  // Filter State (Supports all 4 verification states + all)
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'pending' | 'requires_review' | 'missing'>('all')

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<StudentDocumentItem | null>(null)

  // Download Document Action
  const handleDownloadDoc = (doc: StudentDocumentItem) => {
    if (doc.status === 'missing' || doc.fileName.includes('Not Available')) {
      showToast('Document file is not yet available for download. Original physical copy is required by the college registrar.', 'info')
      return
    }

    const dummyContent = `================================================================================
MINISTRY OF EDUCATION • GOVERNMENT OF INDIA
APAAR CONNECT AI • NATIONAL ACADEMIC DEPOSITORY
OFFICIAL DIGITAL RECORD CERTIFICATE
================================================================================

Document Title : ${doc.title}
File Name      : ${doc.fileName}
File Size      : ${doc.fileSize}
Classification : ${doc.type}
Upload Date    : ${doc.uploadDate}
Current Status : ${doc.status.toUpperCase()}
Availability   : ${doc.availability || 'Available'}
Cryptographic Digest: ${doc.hashDigest || 'SHA256:8f2a4b1c9e3d5f7a0b2c4e6d8f1a3b5c7e9d0f2a4b6c8e0d2f4a6b8c0e2d4f6a'}

STUDENT CREDENTIALS
Student Name    : ${profile.fullName}
Register Number : ${profile.registrationNumber}
APAAR ID        : ${formatApaarId(profile.apaarId)}
Institution     : ${profile.institutionName}

REMARKS
${doc.remarks || 'Verified by College Registrar and sealed in National Academic Depository.'}

================================================================================
DIGITALLY PRESERVED AND SEALED VIA APAAR ACADEMIC DOCUMENT PLATFORM
================================================================================
`
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = doc.fileName.endsWith('.pdf') ? doc.fileName.replace('.pdf', '_verified.txt') : `${doc.fileName}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: StudentDocumentItem['status']) => {
    switch (status) {
      case 'verified':
        return <Badge status="verified" dot>VERIFIED</Badge>
      case 'pending':
        return <Badge status="pending" dot>PENDING VERIFICATION</Badge>
      case 'requires_review':
        return <Badge status="flagged" dot>CORRECTION REQUIRED</Badge>
      case 'rejected':
        return <Badge status="rejected" dot>REJECTED</Badge>
      case 'missing':
        return <Badge status="default" dot className="bg-slate-100 text-slate-700 border-slate-300">MISSING</Badge>
      default:
        return <Badge status="default">UNKNOWN</Badge>
    }
  }

  const getAvailabilityBadge = (availability?: StudentDocumentItem['availability'], status?: StudentDocumentItem['status']) => {
    if (availability === 'Missing' || status === 'missing') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <AlertCircle size={11} className="text-slate-500" /> Missing
        </span>
      )
    }
    if (availability === 'Issued by College') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <Building2 size={11} /> Issued by College
        </span>
      )
    }
    if (status === 'verified' || availability === 'Available') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={11} /> Available
        </span>
      )
    }
    if (availability === 'Correction Required' || status === 'requires_review') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle size={11} /> Correction Required
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <FolderArchive size={11} /> Pending Verification
      </span>
    )
  }

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === 'all') return true
    return doc.status === activeTab
  })

  // List of documents requiring correction to prominently alert student
  const correctionNeededDocs = documents.filter((d) => d.status === 'requires_review' || d.status === 'rejected')

  return (
    <div className="space-y-6">
      {/* Platform Architecture & Access Restriction Banner */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-5 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm text-blue-950">
              College-Managed, Student-Accessible Academic Document Platform
            </h4>
            <p className="text-blue-800 leading-relaxed">
              <strong>Restricted Document Management:</strong> Official academic documents are managed, verified, and updated by college management in accordance with AICTE and DigiLocker guidelines. Students have view and download access to authorized digital records.
            </p>
          </div>
        </div>
        <Badge status="verified" variant="subtle" className="shrink-0 self-start sm:self-auto font-mono text-[10px]">
          Authorized Student Session
        </Badge>
      </div>

      {/* Prominent Correction Notices (if any document requires attention) */}
      {correctionNeededDocs.map((doc) => {
        const correctionReason = doc.correctionReason || doc.remarks || 'Please contact your college management for further information about this document.'
        const studentInstructions = doc.correctionInstructions || 'Please visit your college management office to resolve the issue with your document. The college management will review the original document, make the necessary corrections, and update your digital record so that verification can be completed as soon as possible.'

        return (
          <div key={doc.id} className="p-4 sm:p-5 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs text-rose-950 space-y-3 shadow-xs animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rose-200/70">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span className="text-sm font-bold text-rose-900">
                  <span className="text-slate-600 font-semibold">Document:</span> {doc.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-800">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200/80 text-rose-900 border border-rose-300">
                  Correction Required
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-white/90 border border-rose-100 shadow-xs space-y-1">
                <span className="font-bold text-rose-900 block">Correction Reason:</span>
                <p className="text-slate-800 leading-relaxed font-medium">{correctionReason}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/90 border border-rose-100 shadow-xs space-y-1">
                <span className="font-bold text-rose-900 block">Action Required — Please Contact Your College</span>
                <p className="text-slate-800 leading-relaxed italic">
                  "{studentInstructions}"
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="text-blue-600" />
            Academic Document Repository
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access institutional documents, review verification status and availability, or download official verified academic records.
          </p>
        </div>
      </div>

      {/* Academic Documents Repository Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Academic Documents & Availability</CardTitle>
            <CardDescription>
              Official institutional marksheets, certificates, and submitted credentials
            </CardDescription>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs overflow-x-auto self-start sm:self-auto">
            {(['all', 'verified', 'pending', 'requires_review', 'missing'] as const).map((tab) => {
              const label =
                tab === 'all'
                  ? 'All Documents'
                  : tab === 'verified'
                  ? 'Verified'
                  : tab === 'pending'
                  ? 'Pending Verification'
                  : tab === 'requires_review'
                  ? 'Correction Required'
                  : 'Missing'
              const count = tab === 'all' ? documents.length : documents.filter((d) => d.status === tab).length

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                    activeTab === tab
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {label}
                  <span className="ml-1 text-[10px] text-slate-400">
                    ({count})
                  </span>
                </button>
              )
            })}
          </div>
        </CardHeader>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="py-3 px-3 font-semibold">Document Title & File</th>
                <th className="py-3 px-3 font-semibold">Classification</th>
                <th className="py-3 px-3 font-semibold">Availability</th>
                <th className="py-3 px-3 font-semibold">Verification Status</th>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocuments.map((doc) => {
                const isVerified = doc.status === 'verified'

                return (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{doc.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-0.5">
                        <FileText size={12} className="text-blue-500" />
                        <span>{doc.fileName}</span>
                        {doc.fileSize !== '—' && <span>({doc.fileSize})</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {doc.type}
                    </td>

                    <td className="py-3 px-3">
                      {getAvailabilityBadge(doc.availability, doc.status)}
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(doc.status)}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {doc.uploadDate}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* VIEW ACTION */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewDoc(doc)}
                          className="py-1 px-2 text-blue-600 hover:bg-blue-50"
                          title="View Document Details"
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>

                        {/* DOWNLOAD ACTION */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadDoc(doc)}
                          disabled={doc.status === 'missing'}
                          className="py-1 px-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                          title={doc.status === 'missing' ? 'Document not available for download' : 'Download Authorized Document'}
                        >
                          <Download size={13} className="mr-1" />
                          Download
                        </Button>

                        {/* OFFICIAL RECORD LOCKED (prevent modifying verified records) */}
                        {isVerified && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md cursor-not-allowed"
                            title="Official Verified Record — Locked. Students cannot modify or delete verified institutional records."
                          >
                            <Lock size={12} className="text-slate-500" />
                            Locked
                          </span>
                        )}

                        {/* INSTRUCTION BADGE FOR CORRECTION REQUIRED */}
                        {doc.status === 'requires_review' && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200"
                            title="Please visit your college management office to resolve document corrections."
                          >
                            <AlertCircle size={12} className="text-rose-600" />
                            Contact College
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setPreviewDoc(null)}
          />

          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileCheck2 size={22} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
                  {getStatusBadge(previewDoc.status)}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {previewDoc.fileName} {previewDoc.fileSize !== '—' && `• ${previewDoc.fileSize}`}
                </p>
              </div>
            </div>

            <div className="space-y-4 my-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Availability Status</span>
                  <span className="font-bold text-slate-800">{previewDoc.availability || 'Available'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Classification</span>
                  <span className="font-bold text-slate-800">{previewDoc.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Upload / Issue Date</span>
                  <span className="font-bold text-slate-800">{previewDoc.uploadDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Modification Permission</span>
                  <span className="font-bold text-slate-800">
                    {previewDoc.status === 'verified' ? '🔒 Locked (Institutional Record)' : 'College Managed'}
                  </span>
                </div>
              </div>

              {/* Correction reason and student instructions for Correction Required status */}
              {(previewDoc.status === 'requires_review' || previewDoc.availability === 'Correction Required' || previewDoc.correctionReason) && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-rose-200/60">
                    <span className="font-bold text-rose-900 flex items-center gap-1.5 text-xs">
                      <AlertCircle size={15} className="text-rose-600 shrink-0" />
                      Status: Correction Required
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                      College Management Action Required
                    </span>
                  </div>

                  <div>
                    <strong className="text-rose-900 block mb-0.5">Correction Reason:</strong>
                    <p className="text-slate-800 bg-white/90 p-2.5 rounded-lg border border-rose-100 leading-relaxed font-medium">
                      {previewDoc.correctionReason || previewDoc.remarks || 'Please contact your college management for further information about this document.'}
                    </p>
                  </div>

                  <div>
                    <strong className="text-rose-900 block mb-0.5">Action Required — Please Contact Your College:</strong>
                    <p className="text-slate-800 bg-white/90 p-2.5 rounded-lg border border-rose-100 leading-relaxed italic">
                      "{previewDoc.correctionInstructions || 'Please visit your college management office to resolve the issue with your document. The college management will review the original document, make the necessary corrections, and update your digital record so that verification can be completed as soon as possible.'}"
                    </p>
                  </div>
                </div>
              )}

              {/* Cryptographic Hash */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-600" />
                  Tamper-Evident Digest & NAD Seal:
                </span>
                <p className="font-mono text-[10px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                  {previewDoc.hashDigest || 'SHA256:d8c9b26e0f7a4d2c1e8b5f3a9d7c4e1b8f2a5d3c0e7b4f1a8d5c2e9b6a3f4e1'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 space-y-1">
                <p className="font-bold">Institutional Security & Protection:</p>
                <p className="text-[11px] text-blue-800">
                  {previewDoc.status === 'verified'
                    ? 'This is an official verified academic record. In accordance with university regulations, students cannot edit or replace sealed credentials.'
                    : previewDoc.status === 'requires_review'
                    ? 'Corrections to college-managed documents must be carried out by authorized college management personnel. Please visit your college office with original documentation.'
                    : previewDoc.status === 'missing'
                    ? 'This document is missing from your institutional record. Please submit the physical original document to your college registrar counter.'
                    : 'This document is maintained by the college registrar. Authorized college management staff will review and update your record.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewDoc(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadDoc(previewDoc)}
                disabled={previewDoc.status === 'missing'}
                leftIcon={<Download size={14} />}
              >
                Download Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
