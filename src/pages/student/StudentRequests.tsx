import React, { useState } from 'react'
import { 
  FileCheck2, 
  Plus, 
  CheckCircle2, 
  Eye, 
  X, 
  Download, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Lock,
  Check,
  Ban,
  History
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { useStudent } from '@/context/StudentContext'
import type { VerificationRequestItem } from '@/types'
import { formatApaarId } from '@/utils/formatters'

interface VerificationDemoItem {
  id: string
  documentName: string
  classification: string
  status: 'Verified' | 'Pending Verification' | 'Correction Required'
  issuedBy: string
  submissionDate: string
  fileName: string
  fileSize: string
  verificationHash?: string
}

export const StudentRequests: React.FC = () => {
  const {
    profile,
    documents,
    verificationRequests: requests,
    addVerificationRequest,
    consentRequests,
    approveConsent,
    rejectConsent,
    revokeConsent,
    academicRecords,
  } = useStudent()

  // Main Tabs: Verification Requests vs DPDP Consent Sharing
  const [activeMainTab, setActiveMainTab] = useState<'requests_table' | 'institutional_audit' | 'consent_sharing'>('requests_table')

  // Selected Document for "View Document" Modal
  const [viewingDoc, setViewingDoc] = useState<VerificationDemoItem | null>(null)

  // Selected Request for Lifecycle Audit
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestItem | null>(null)
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false)

  // New Request Form State
  const [selectedRecordId, setSelectedRecordId] = useState(academicRecords[0]?.id || '')
  const [purpose, setPurpose] = useState('Higher Studies & Postgraduate Application')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // DPDP Consent State
  const [consentToast, setConsentToast] = useState<string | null>(null)

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const chosenRecord = academicRecords.find((r) => r.id === selectedRecordId)
    const recordTitle = chosenRecord
      ? `${chosenRecord.semester} Official Marksheet (${chosenRecord.examination})`
      : 'Academic Performance Record'

    setTimeout(() => {
      const newReq = addVerificationRequest(recordTitle, purpose, additionalNotes)
      setIsSubmitting(false)
      setIsNewRequestModalOpen(false)
      setFormSuccess(`Verification request ${newReq.referenceNo} generated successfully!`)
      setAdditionalNotes('')
      setTimeout(() => setFormSuccess(null), 5000)
    }, 600)
  }

  const handleDownloadDemoDoc = (doc: VerificationDemoItem) => {
    const dummyContent = `================================================================================
MINISTRY OF EDUCATION • GOVERNMENT OF INDIA
APAAR CONNECT AI • NATIONAL ACADEMIC DEPOSITORY
OFFICIAL VERIFIED DOCUMENT RECORD
================================================================================

Document Name       : ${doc.documentName}
Classification      : ${doc.classification}
Verification Status : ${doc.status.toUpperCase()}
Issuing Authority   : ${doc.issuedBy}
Submission Date     : ${doc.submissionDate}
File Name           : ${doc.fileName}
File Size           : ${doc.fileSize}
Tamper-Proof Digest : ${doc.verificationHash || 'Pending registrar issuance'}

STUDENT DETAILS
Student Name        : ${profile.fullName}
APAAR ID            : ${formatApaarId(profile.apaarId)}
Register Number     : ${profile.registrationNumber}
Institution         : ${profile.institutionName}

================================================================================
SEALED DIGITALLY UNDER AICTE NATIONAL ACADEMIC DEPOSITORY PROTOCOLS
================================================================================
`
    const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.documentName.replace(/[\s()]/g, '_')}_Verified.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getVerificationStatusBadge = (status: VerificationDemoItem['status']) => {
    switch (status) {
      case 'Verified':
        return <Badge status="verified" dot>Verified</Badge>
      case 'Pending Verification':
        return <Badge status="pending" dot>Pending Verification</Badge>
      case 'Correction Required':
        return <Badge status="flagged" dot>Correction Required</Badge>
      default:
        return <Badge status="default">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">

      {consentToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {consentToast}
        </div>
      )}

      {/* Header and Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="text-blue-600" />
            Verification Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review document verification statuses, audit registrar verification lifecycle, or manage third-party consent.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs">
          <button
            onClick={() => setActiveMainTab('requests_table')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeMainTab === 'requests_table'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Verification Requests Table
          </button>
          <button
            onClick={() => setActiveMainTab('institutional_audit')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeMainTab === 'institutional_audit'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lifecycle Audit ({requests.length})
          </button>
          <button
            onClick={() => setActiveMainTab('consent_sharing')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              activeMainTab === 'consent_sharing'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Third-Party Consent (DPDP)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: VERIFICATION REQUESTS TABLE (EXACT FORMAT FROM PROMPT)          */}
      {/* Document Name | Verification Status | Action (View Document)             */}
      {/* ========================================================================= */}
      {activeMainTab === 'requests_table' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Document Verification Requests & Scrutiny
                </CardTitle>
                <CardDescription>
                  Table of submitted student credentials with current verification status and document actions
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<Plus size={15} />}
                  onClick={() => setIsNewRequestModalOpen(true)}
                >
                  Initiate New Request
                </Button>
              </div>
            </CardHeader>

            {formSuccess && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                {formSuccess}
              </div>
            )}

            {/* MANDATED TABLE: Document | Status | Action */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.length > 0 ? (
                    documents.map((item) => {
                      const itemStatus = item.status === 'verified' ? 'Verified' : item.status === 'requires_review' ? 'Correction Required' : 'Pending Verification'
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                                itemStatus === 'Verified' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : itemStatus === 'Correction Required'
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}>
                                <FileText size={18} />
                              </div>
                              <div>
                                <span className="font-bold text-sm text-slate-900 block">
                                  {item.title}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {item.type} • {item.fileName}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {getVerificationStatusBadge(itemStatus)}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<Eye size={14} />}
                              onClick={() => setViewingDoc({
                                id: item.id,
                                documentName: item.title,
                                classification: item.type,
                                status: itemStatus,
                                issuedBy: profile.institutionName || 'College Administration',
                                submissionDate: item.uploadDate,
                                fileName: item.fileName,
                                fileSize: item.fileSize,
                                verificationHash: item.hashDigest,
                              })}
                              className="py-1 px-3 text-blue-600 hover:bg-blue-50 font-semibold"
                            >
                              View Document
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-400 text-xs">
                        <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        No documents have been uploaded for your account yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 mt-4">
              <span>Showing {documents.length} official document{documents.length === 1 ? '' : 's'} registered in your account</span>
              <span className="font-medium text-slate-600">DigiLocker National Academic Depository Verified</span>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: INSTITUTIONAL LIFECYCLE AUDIT TRAIL                            */}
      {/* ========================================================================= */}
      {activeMainTab === 'institutional_audit' && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardHeader className="p-0 pb-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Institutional Verification Lifecycle Cases
                </CardTitle>
                <CardDescription>
                  Detailed administrative audit stages registered with the college registrar
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Case Reference</th>
                    <th className="py-3 px-4">Academic Record</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Initiation Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{req.referenceNo}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{req.recordTitle}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate" title={req.purpose}>
                          {req.purpose}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{req.submissionDate}</td>
                        <td className="py-3 px-4">
                          <Badge
                            status={req.status === 'verified' ? 'verified' : req.status === 'under_review' ? 'pending' : 'default'}
                            dot
                          >
                            {req.status === 'under_review' ? 'Under Review' : req.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<Eye size={14} />}
                            onClick={() => setSelectedRequest(req)}
                          >
                            Audit Lifecycle
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        <FileCheck2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        No verification requests have been submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: THIRD-PARTY CONSENT & SHARING (DPDP ACT 2023)                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'consent_sharing' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-xs text-purple-950 flex items-start gap-3">
            <Lock size={18} className="text-purple-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Digital Personal Data Protection (DPDP) Act Compliance:</strong> External employers and background verification partners require your explicit consent. Access tokens expire automatically and grant zero unauthorized access.
            </p>
          </div>

          <div className="space-y-4">
            {consentRequests.map((req) => (
              <Card key={req.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{req.requesterName}</h4>
                      <Badge
                        status={
                          req.status === 'approved'
                            ? 'verified'
                            : req.status === 'pending_consent'
                            ? 'pending'
                            : 'rejected'
                        }
                      >
                        {req.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">{req.purpose}</p>
                    <div className="text-[11px] text-slate-400">
                      Requested on: {req.requestedAt} • Expiry: {req.expiresAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.status === 'pending_consent' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<Check size={14} />}
                          onClick={() => {
                            approveConsent(req.id)
                            setConsentToast('Consent granted to ' + req.requesterName)
                            setTimeout(() => setConsentToast(null), 4000)
                          }}
                        >
                          Authorize Access
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Ban size={14} />}
                          onClick={() => {
                            rejectConsent(req.id)
                            setConsentToast('Access rejected for ' + req.requesterName)
                            setTimeout(() => setConsentToast(null), 4000)
                          }}
                        >
                          Decline
                        </Button>
                      </>
                    )}

                    {req.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Ban size={14} />}
                        onClick={() => {
                          revokeConsent(req.id)
                          setConsentToast('Access revoked for ' + req.requesterName)
                          setTimeout(() => setConsentToast(null), 4000)
                        }}
                      >
                        Revoke Access
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* "VIEW DOCUMENT" PREVIEW MODAL                                             */}
      {/* ========================================================================= */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setViewingDoc(null)}
          />

          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                viewingDoc.status === 'Verified'
                  ? 'bg-emerald-50 text-emerald-600'
                  : viewingDoc.status === 'Correction Required'
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
              }`}>
                <FileCheck2 size={24} />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{viewingDoc.documentName}</h3>
                  {getVerificationStatusBadge(viewingDoc.status)}
                </div>
                <p className="text-xs text-slate-500">
                  {viewingDoc.classification} • {viewingDoc.fileName}
                </p>
              </div>
            </div>

            {/* Student & Document Verification Metadata */}
            <div className="space-y-4 my-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">Student Name</span>
                  <span className="font-bold text-slate-800">{profile.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Register Number</span>
                  <span className="font-bold font-mono text-slate-800">{profile.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">APAAR ID</span>
                  <span className="font-bold font-mono text-blue-700">{formatApaarId(profile.apaarId)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Issuing Authority</span>
                  <span className="font-bold text-slate-800 truncate block">{viewingDoc.issuedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Submission Date</span>
                  <span className="font-bold text-slate-800">{viewingDoc.submissionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">File Metadata</span>
                  <span className="font-bold text-slate-800">{viewingDoc.fileName} ({viewingDoc.fileSize})</span>
                </div>
              </div>

              {/* Status Notice */}
              {viewingDoc.status === 'Verified' ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Digitally Verified & Sealed</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    This document was officially verified and sealed in the National Academic Depository (NAD).
                  </p>
                </div>
              ) : viewingDoc.status === 'Correction Required' ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>Correction Required</span>
                  </div>
                  <p className="text-[11px] text-rose-800">
                    Registrar flagged this file for rescan. Please submit a clearer 300 DPI scan from the Document Management tab.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock size={16} className="text-amber-600 shrink-0" />
                    <span>Pending Verification</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    This document has been submitted and is currently queued for scrutiny by the institutional registrar office.
                  </p>
                </div>
              )}

              {/* Cryptographic Hash */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-600" />
                  Cryptographic Verification Digest:
                </span>
                <p className="font-mono text-[10px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200">
                  {viewingDoc.verificationHash || 'SHA256:7b2e4d6c8a0f2b5e7d9c1a3f5b8e0d2a4f6b9e1d3c5a7f9b2e4d6c8a0f2b5e7d'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDoc(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDownloadDemoDoc(viewingDoc)}
                leftIcon={<Download size={14} />}
              >
                Download Document
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUDIT LIFECYCLE MODAL                                                     */}
      {/* ========================================================================= */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedRequest(null)}
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <History size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Audit Lifecycle: {selectedRequest.referenceNo}
                </h3>
                <p className="text-xs text-slate-500">{selectedRequest.recordTitle}</p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              {selectedRequest.timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${
                    step.status === 'completed'
                      ? 'bg-emerald-600'
                      : step.status === 'current'
                      ? 'bg-blue-600 animate-pulse'
                      : 'bg-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">{step.stage}</p>
                    <p className="text-[11px] text-slate-400">{step.timestamp}</p>
                    {step.note && <p className="text-slate-600 text-[11px] italic bg-slate-50 p-1 rounded mt-0.5">{step.note}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button size="sm" variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INITIATE NEW VERIFICATION REQUEST MODAL                                   */}
      {/* ========================================================================= */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsNewRequestModalOpen(false)}
          />

          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsNewRequestModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Initiate Verification Request</h3>
                <p className="text-xs text-slate-500">Request formal scrutiny and cryptographic seal from registrar</p>
              </div>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 my-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Academic Record / Document
                </label>
                <select
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                >
                  {academicRecords.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.semester} — {r.examination} ({r.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Purpose of Verification
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Higher Studies, Campus Placement, Visa Application"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any specific instructions for the registrar office"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewRequestModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
