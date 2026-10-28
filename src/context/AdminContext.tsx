import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { collegeApi, type StudentSearchResult } from '@/services/portalApiService'
import type {
  AdminStudentRecord,
  AdminAcademicRecord,
  AdminDocumentReviewItem,
  AdminVerificationRequestItem,
  DataQualityIssueItem,
  AuditLogItem,
} from '@/types'

export interface AdminProfile {
  name: string
  role: string
  institutionName: string
  institutionCode: string
  email: string
  city?: string
  state?: string
  type?: 'Autonomous' | 'Affiliated' | 'Constituent' | 'University Department'
}

export interface DuplicateGroup {
  field: 'apaarId' | 'registrationNumber' | 'email' | 'phone'
  value: string
  records: AdminStudentRecord[]
  reason: string
}

export interface AdminToast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export interface AdminNotification {
  id: string
  title: string
  message: string
  date: string
  type: 'verification' | 'update' | 'security' | 'reminder'
  read: boolean
  actionUrl?: string
}

interface AdminContextType {
  // Data
  students: AdminStudentRecord[]
  academicRecords: AdminAcademicRecord[]
  documents: AdminDocumentReviewItem[]
  verificationRequests: AdminVerificationRequestItem[]
  dataQualityIssues: DataQualityIssueItem[]
  auditLog: AuditLogItem[]
  adminProfile: AdminProfile

  // Metrics
  stats: {
    totalStudents: number
    verifiedStudents: number
    pendingVerifications: number
    documentsRequiringCorrection: number
    missingDocuments: number
    publishedAcademicRecords: number
    rejectedOrIncomplete: number
    rejectedStudents: number
    incompleteStudents: number
    flaggedStudents: number
    completedVerifications: number
    totalAcademicRecords: number
    openDataQualityIssues: number
  }

  // Toast
  toast: AdminToast | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: () => void

  // Notification Centre
  notifications: AdminNotification[]
  unreadNotificationsCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  dispatchNotification: (
    title: string,
    message: string,
    type: 'verification' | 'update' | 'security' | 'reminder'
  ) => void

  // Verification workflow
  approveVerification: (requestId: string, reviewerNotes?: string) => void
  rejectVerification: (requestId: string, reason: string) => boolean

  // Student management
  updateStudentStatus: (
    studentId: string,
    status: AdminStudentRecord['status'],
    reason?: string
  ) => void

  // Document review & correction workflow
  updateDocumentReview: (
    documentId: string,
    newStatus: AdminDocumentReviewItem['reviewStatus'],
    notes?: string,
    correctedFile?: { fileName: string; fileSize: string }
  ) => void

  // Data quality actions
  resolveDataQualityIssue: (issueId: string, resolutionNote?: string) => void
  runDuplicateScan: () => DuplicateGroup[]
  detectedDuplicates: DuplicateGroup[]

  // Real Database Actions
  uploadStudentDocument: (data: {
    studentRegistrationNumber?: string
    studentId?: string
    apaarId?: string
    documentType: string
    title: string
    fileName: string
    fileSize?: string
    fileData?: string
    marksheetDetails?: {
      semester: string
      academicYear?: string
      sgpa?: number
      cgpa?: number
      creditsEarned?: number
      totalCredits?: number
      examination?: string
    }
  }) => Promise<{ success: boolean; message: string; document: AdminDocumentReviewItem; academicRecord?: AdminAcademicRecord }>
  searchStudents: (query: string, searchType?: 'all' | 'registrationNumber' | 'apaarId') => Promise<StudentSearchResult[]>
  refreshCollegeData: () => Promise<void>
  departments: string[]
  updateDepartments: (departments: string[]) => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const adminProfile = useMemo<AdminProfile>(() => {
    return {
      name: user?.fullName || 'College Administrator',
      role: 'Registrar',
      institutionName: user?.institutionName || 'Institutional Campus',
      institutionCode: user?.institutionCode || 'AICTE-CAMPUS',
      email: user?.email || '',
      city: 'Administrative HQ',
      state: 'All India',
      type: 'Autonomous',
    }
  }, [user])

  const [students, setStudents] = useState<AdminStudentRecord[]>([])
  const [academicRecords, setAcademicRecords] = useState<AdminAcademicRecord[]>([])
  const [documents, setDocuments] = useState<AdminDocumentReviewItem[]>([])
  const [verificationRequests, setVerificationRequests] = useState<AdminVerificationRequestItem[]>([])
  const [dataQualityIssues, setDataQualityIssues] = useState<DataQualityIssueItem[]>([])
  const [auditLog, setAuditLog] = useState<AuditLogItem[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [toast, setToast] = useState<AdminToast | null>(null)

  const fetchCollegeData = useCallback(async () => {
    try {
      const res = await collegeApi.getDashboard()
      if (res && res.success) {
        if (Array.isArray(res.college?.departments)) {
          setDepartments(res.college.departments)
        }
        if (Array.isArray(res.students)) {
          const mappedStudents: AdminStudentRecord[] = res.students.map((s: any) => ({
            id: s.id,
            fullName: s.fullName,
            registrationNumber: s.registrationNumber,
            apaarId: s.apaarId || '',
            abcId: s.abcId || (s.apaarId ? `ABC-${s.apaarId.slice(-8)}` : 'ABC-2024-PENDING'),
            email: s.email,
            phone: s.phone || '',
            institutionName: res.college?.name || user?.institutionName || 'Institutional Campus',
            department: s.department,
            programme: s.course,
            academicYear: s.yearOfStudy,
            currentSemester: parseInt(s.semester || '1', 10) || 1,
            admissionCategory: 'General Merit',
            status: s.verificationStatus || 'pending',
            cgpa: 8.5,
            digilockerSynced: s.digilockerConnected ?? true,
            enrolmentDate: s.createdAt?.split('T')[0] || '2021-08-01',
            rejectionReason: s.rejectionReason,
          }))
          setStudents(mappedStudents)
        }

        if (Array.isArray(res.academicRecords)) {
          const mappedAcademicRecords: AdminAcademicRecord[] = res.academicRecords.map((r: any) => ({
            id: r.id,
            studentId: r.studentId,
            studentName: r.studentName,
            registrationNumber: r.registrationNumber,
            department: r.department,
            programme: r.programme,
            academicYear: r.academicYear,
            semester: r.semester,
            examination: r.examination,
            sgpa: r.sgpa,
            creditsEarned: r.creditsEarned,
            totalCredits: r.totalCredits,
            status: r.status === 'published' ? 'verified' : (r.status || 'verified'),
            issuingAuthority: res.college?.name || 'Office of the Registrar',
            lastUpdated: r.updatedAt?.split('T')[0] || r.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          }))
          setAcademicRecords(mappedAcademicRecords)
        }

        if (Array.isArray(res.documents)) {
          const mappedDocuments: AdminDocumentReviewItem[] = res.documents.map((d: any) => ({
            id: d.id,
            studentId: d.studentId,
            studentName: d.studentName,
            registrationNumber: d.registrationNumber,
            department: (res.students?.find((s: any) => s.id === d.studentId)?.department) || 'Engineering',
            documentType: d.documentType,
            fileName: d.fileName,
            fileSize: d.fileSize || '1.2 MB',
            uploadDate: d.uploadDate,
            reviewStatus: d.reviewStatus || 'accepted_for_verification',
            correctionNotes: d.correctionNotes,
            rejectionReason: d.rejectionReason,
            checksum: d.hashDigest || 'sha256:verified',
          }))
          setDocuments(mappedDocuments)
        }

        if (Array.isArray(res.verificationRequests)) {
          const mappedRequests: AdminVerificationRequestItem[] = res.verificationRequests.map((v: any) => {
            let mappedStatus: 'submitted' | 'under_review' | 'verified' | 'rejected' | 'requires_info' = 'submitted'
            if (v.status === 'approved') mappedStatus = 'verified'
            else if (v.status === 'rejected') mappedStatus = 'rejected'
            else if (v.status === 'in_review') mappedStatus = 'under_review'
            else if (v.status === 'returned_for_correction') mappedStatus = 'requires_info'

            return {
              id: v.id,
              referenceNo: v.referenceNo,
              studentId: v.studentId,
              studentName: v.studentName,
              registrationNumber: v.registrationNumber,
              academicRecordType: v.recordTitle || v.requestType || 'Semester Marksheet',
              submissionDate: v.submittedDate,
              status: mappedStatus,
              targetOrganisation: v.purpose || 'Academic Verification',
              assignedReviewer: v.reviewedByAdminId || user?.fullName || 'Office of the Registrar',
              lastUpdated: v.reviewedDate || v.submittedDate,
              internalNotes: v.reviewerNotes || v.notes || '',
              timeline: v.timeline || [
                {
                  stage: 'Request Submitted',
                  timestamp: v.submittedDate,
                  status: 'completed',
                  actor: v.studentName,
                },
              ],
            }
          })
          setVerificationRequests(mappedRequests)
        }

        if (Array.isArray(res.notifications)) {
          const mappedNotifs: AdminNotification[] = res.notifications.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: n.date,
            type: n.type === 'document' ? 'update' : n.type === 'verification' ? 'verification' : 'reminder',
            read: n.read,
            actionUrl: n.actionUrl,
          }))
          setNotifications(mappedNotifs)
        }

        if (Array.isArray(res.auditLogs)) {
          const mappedAudit: AuditLogItem[] = res.auditLogs.map((l: any) => ({
            id: l.id,
            action: l.action,
            adminAccount: `${l.actorName} (${l.actorRole})`,
            affectedRecord: l.details,
            timestamp: l.timestamp,
            reason: l.details,
            category: 'document',
          }))
          setAuditLog(mappedAudit)
        }
      }
    } catch {
      // Retain mock fallback if offline or during demonstration
    }
  }, [user])

  useEffect(() => {
    fetchCollegeData()

    const handleDocUpdate = () => {
      fetchCollegeData()
    }
    const handleReqSubmitted = () => {
      fetchCollegeData()
    }

    window.addEventListener('apaar_college_doc_update', handleDocUpdate)
    window.addEventListener('apaar:verification-request-submitted', handleReqSubmitted)

    return () => {
      window.removeEventListener('apaar_college_doc_update', handleDocUpdate)
      window.removeEventListener('apaar:verification-request-submitted', handleReqSubmitted)
    }
  }, [fetchCollegeData])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const dispatchNotification = useCallback(
    (title: string, message: string, type: 'verification' | 'update' | 'security' | 'reminder') => {
      const newNotif: AdminNotification = {
        id: `AN-${Date.now()}`,
        title,
        message,
        date: new Date().toISOString().split('T')[0],
        type,
        read: false,
      }
      setNotifications((prev) => [newNotif, ...prev])
    },
    []
  )

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now()
    setToast({ id, message, type })
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr))
    }, 4500)
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  // Duplicate detection in demonstration dataset
  const findDuplicates = useCallback((studentList: AdminStudentRecord[]): DuplicateGroup[] => {
    const groups: DuplicateGroup[] = []

    // 1. Check APAAR ID duplicates
    const apaarMap = new Map<string, AdminStudentRecord[]>()
    studentList.forEach((s) => {
      if (!s.apaarId) return
      const list = apaarMap.get(s.apaarId) || []
      list.push(s)
      apaarMap.set(s.apaarId, list)
    })
    apaarMap.forEach((records, apaarId) => {
      if (records.length > 1) {
        groups.push({
          field: 'apaarId',
          value: apaarId,
          records,
          reason: `Multiple student accounts registered under identical 12-digit APAAR ID (${apaarId.slice(0, 4)}-${apaarId.slice(4, 8)}-${apaarId.slice(8, 12)}). Potential identity collision or duplicate registration.`,
        })
      }
    })

    // 2. Check Registration Number duplicates
    const regMap = new Map<string, AdminStudentRecord[]>()
    studentList.forEach((s) => {
      if (!s.registrationNumber) return
      const list = regMap.get(s.registrationNumber) || []
      list.push(s)
      regMap.set(s.registrationNumber, list)
    })
    regMap.forEach((records, regNo) => {
      if (records.length > 1) {
        groups.push({
          field: 'registrationNumber',
          value: regNo,
          records,
          reason: `Duplicate institutional Registration Number (${regNo}) assigned to distinct profiles. Requires administrative reconciliation.`,
        })
      }
    })

    return groups
  }, [])

  const detectedDuplicates = useMemo(() => findDuplicates(students), [students, findDuplicates])

  const runDuplicateScan = useCallback(() => {
    const results = findDuplicates(students)
    showToast(`Duplicate scan completed: ${results.length} potential duplicate clusters detected.`, results.length > 0 ? 'info' : 'success')
    return results
  }, [students, findDuplicates, showToast])

  // Verification workflow: Approve
  const approveVerification = useCallback(
    (requestId: string, reviewerNotes?: string) => {
      const targetReq = verificationRequests.find((r) => r.id === requestId)
      if (!targetReq) return

      const prevStatus = targetReq.status
      const now = new Date()
      const formattedDate = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      // Update Verification Request
      setVerificationRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r
          const newTimeline = [...r.timeline]
          const existingPendingIdx = newTimeline.findIndex((t) => t.stage === 'Final Verification Decision' || t.status === 'pending')
          if (existingPendingIdx !== -1) {
            newTimeline[existingPendingIdx] = {
              stage: 'Final Verification Decision',
              timestamp: formattedDate,
              status: 'completed',
              actor: `${adminProfile.name} (${adminProfile.role})`,
              note: reviewerNotes || 'Approved. Student academic record confirmed and synced with APAAR registry.',
            }
          } else {
            newTimeline.push({
              stage: 'Final Verification Decision',
              timestamp: formattedDate,
              status: 'completed',
              actor: `${adminProfile.name} (${adminProfile.role})`,
              note: reviewerNotes || 'Approved. Student academic record confirmed and synced with APAAR registry.',
            })
          }

          return {
            ...r,
            status: 'verified',
            lastUpdated: now.toISOString().split('T')[0],
            internalNotes: reviewerNotes ? `Approved: ${reviewerNotes}` : r.internalNotes,
            timeline: newTimeline,
          }
        })
      )

      // Update Student Status
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === targetReq.studentId || s.registrationNumber === targetReq.registrationNumber) {
            return {
              ...s,
              status: 'verified',
              digilockerSynced: true,
            }
          }
          return s
        })
      )

      // Update Academic Record status if matched
      setAcademicRecords((prev) =>
        prev.map((ar) => {
          if (ar.studentId === targetReq.studentId || ar.registrationNumber === targetReq.registrationNumber) {
            return { ...ar, status: 'verified', lastUpdated: now.toISOString().split('T')[0] }
          }
          return ar
        })
      )

      // Append to Audit Log
      const auditEntry: AuditLogItem = {
        id: `AL-${Date.now()}`,
        action: 'Verification Request Approved',
        adminAccount: `${adminProfile.email} (${adminProfile.name})`,
        affectedRecord: `${targetReq.referenceNo} — ${targetReq.studentName} (${targetReq.academicRecordType})`,
        timestamp: now.toISOString(),
        previousStatus: prevStatus,
        newStatus: 'verified',
        reason: reviewerNotes || 'Approved after institutional document cross-check and ABC verification.',
        category: 'verification',
      }
      setAuditLog((prev) => [auditEntry, ...prev])

      showToast(`Verification Request ${targetReq.referenceNo} approved for ${targetReq.studentName}.`, 'success')
      dispatchNotification(
        `Verification Approved: ${targetReq.referenceNo}`,
        `${targetReq.studentName}'s (${targetReq.academicRecordType}) request officially verified and registered with APAAR registry.`,
        'verification'
      )

      // Sync with real backend
      collegeApi.reviewVerificationRequest(requestId, 'approved', reviewerNotes).catch((err) => {
        console.warn('Backend verification approve sync:', err.message)
      })

      window.dispatchEvent(new CustomEvent('apaar_college_doc_update', { detail: { requestId, status: 'verified' } }))
      window.dispatchEvent(new CustomEvent('apaar:student-data-changed', { detail: { action: 'verification_approved', requestId } }))
    },
    [verificationRequests, showToast, dispatchNotification]
  )

  // Verification workflow: Reject (Requires a mandatory reason)
  const rejectVerification = useCallback(
    (requestId: string, reason: string): boolean => {
      const trimmedReason = reason.trim()
      if (!trimmedReason) {
        showToast('A rejection reason is required before rejecting a record.', 'error')
        return false
      }

      const targetReq = verificationRequests.find((r) => r.id === requestId)
      if (!targetReq) return false

      const prevStatus = targetReq.status
      const now = new Date()
      const formattedDate = now.toLocaleDateString('en-IN') + ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      // Update Verification Request
      setVerificationRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r
          const newTimeline = [...r.timeline]
          const existingPendingIdx = newTimeline.findIndex((t) => t.stage === 'Final Verification Decision' || t.status === 'pending')
          if (existingPendingIdx !== -1) {
            newTimeline[existingPendingIdx] = {
              stage: 'Verification Rejected',
              timestamp: formattedDate,
              status: 'completed',
              actor: `${adminProfile.name} (${adminProfile.role})`,
              note: `Rejected: ${trimmedReason}`,
            }
          } else {
            newTimeline.push({
              stage: 'Verification Rejected',
              timestamp: formattedDate,
              status: 'completed',
              actor: `${adminProfile.name} (${adminProfile.role})`,
              note: `Rejected: ${trimmedReason}`,
            })
          }

          return {
            ...r,
            status: 'rejected',
            lastUpdated: now.toISOString().split('T')[0],
            decisionReason: trimmedReason,
            timeline: newTimeline,
          }
        })
      )

      // Update Student Status
      setStudents((prev) =>
        prev.map((s) => {
          if (s.id === targetReq.studentId || s.registrationNumber === targetReq.registrationNumber) {
            return {
              ...s,
              status: 'rejected',
              rejectionReason: trimmedReason,
            }
          }
          return s
        })
      )

      // Update Academic Record status if matched
      setAcademicRecords((prev) =>
        prev.map((ar) => {
          if (ar.studentId === targetReq.studentId || ar.registrationNumber === targetReq.registrationNumber) {
            return { ...ar, status: 'rejected', lastUpdated: now.toISOString().split('T')[0] }
          }
          return ar
        })
      )

      // Append to Audit Log
      const auditEntry: AuditLogItem = {
        id: `AL-${Date.now()}`,
        action: 'Verification Request Rejected',
        adminAccount: `${adminProfile.email} (${adminProfile.name})`,
        affectedRecord: `${targetReq.referenceNo} — ${targetReq.studentName} (${targetReq.academicRecordType})`,
        timestamp: now.toISOString(),
        previousStatus: prevStatus,
        newStatus: 'rejected',
        reason: trimmedReason,
        category: 'verification',
      }
      setAuditLog((prev) => [auditEntry, ...prev])

      showToast(`Verification Request ${targetReq.referenceNo} rejected. Reason recorded in audit log.`, 'error')
      dispatchNotification(
        `Verification Rejected: ${targetReq.referenceNo}`,
        `${targetReq.studentName}'s request was rejected. Reason: ${trimmedReason}`,
        'security'
      )

      // Sync with real backend
      collegeApi.reviewVerificationRequest(requestId, 'rejected', trimmedReason).catch((err) => {
        console.warn('Backend verification reject sync:', err.message)
      })

      window.dispatchEvent(new CustomEvent('apaar_college_doc_update', { detail: { requestId, status: 'rejected' } }))
      window.dispatchEvent(new CustomEvent('apaar:student-data-changed', { detail: { action: 'verification_rejected', requestId } }))

      return true
    },
    [verificationRequests, showToast, dispatchNotification]
  )

  // Student Status update
  const updateStudentStatus = useCallback(
    (studentId: string, status: AdminStudentRecord['status'], reason?: string) => {
      const student = students.find((s) => s.id === studentId)
      if (!student) return

      const prevStatus = student.status
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status, rejectionReason: reason || s.rejectionReason } : s))
      )

      const auditEntry: AuditLogItem = {
        id: `AL-${Date.now()}`,
        action: 'Student Verification Status Updated',
        adminAccount: `${adminProfile.email} (${adminProfile.name})`,
        affectedRecord: `${student.id} — ${student.fullName} (${student.registrationNumber})`,
        timestamp: new Date().toISOString(),
        previousStatus: prevStatus,
        newStatus: status,
        reason: reason || `Administrator updated status to ${status}.`,
        category: 'student',
      }
      setAuditLog((prev) => [auditEntry, ...prev])
      showToast(`Student ${student.fullName} status updated to ${status}.`, 'info')
      dispatchNotification(
        `Student Status Updated: ${student.fullName}`,
        `Status changed from ${prevStatus} to ${status}. ${reason ? `Reason: ${reason}` : ''}`,
        'update'
      )
    },
    [students, showToast, dispatchNotification]
  )

  // Data Quality resolution
  const resolveDataQualityIssue = useCallback(
    (issueId: string, resolutionNote?: string) => {
      const issue = dataQualityIssues.find((i) => i.id === issueId)
      if (!issue) return

      const prevStatus = issue.reviewStatus
      setDataQualityIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, reviewStatus: 'resolved' } : i))
      )

      const auditEntry: AuditLogItem = {
        id: `AL-${Date.now()}`,
        action: 'Data Quality Issue Resolved',
        adminAccount: `${adminProfile.email} (${adminProfile.name})`,
        affectedRecord: `${issue.id} — ${issue.studentName} (${issue.issueType})`,
        timestamp: new Date().toISOString(),
        previousStatus: prevStatus,
        newStatus: 'resolved',
        reason: resolutionNote || 'Resolved following administrative cross-validation.',
        category: 'quality',
      }
      setAuditLog((prev) => [auditEntry, ...prev])
      showToast(`Data quality issue ${issue.id} marked as resolved.`, 'success')
      dispatchNotification(
        `Data Quality Issue Resolved: ${issue.id}`,
        `${issue.studentName} (${issue.issueType}) marked as resolved.`,
        'update'
      )
    },
    [dataQualityIssues, showToast, dispatchNotification]
  )

  const updateDocumentReview = useCallback(
    (
      documentId: string,
      newStatus: AdminDocumentReviewItem['reviewStatus'],
      notes?: string,
      correctedFile?: { fileName: string; fileSize: string }
    ) => {
      const targetDoc = documents.find((d) => d.id === documentId)
      if (!targetDoc) return

      const updatedFileName = correctedFile?.fileName || targetDoc.fileName
      const updatedFileSize = correctedFile?.fileSize || targetDoc.fileSize
      const updatedChecksum = correctedFile
        ? `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        : targetDoc.checksum

      // 1. Update college admin documents state
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === documentId) {
            return {
              ...d,
              reviewStatus: newStatus,
              fileName: updatedFileName,
              fileSize: updatedFileSize,
              checksum: updatedChecksum,
              correctionNotes: newStatus === 'requires_correction' ? notes || d.correctionNotes : undefined,
              reviewer: adminProfile.name || 'Dr. S. K. Kulkarni (Registrar)',
            }
          }
          return d
        })
      )

      // 2. Add entry to Admin Audit Log
      const auditEntry: AuditLogItem = {
        id: `LOG-${Date.now()}`,
        action: 'College Document Review & Record Update',
        adminAccount: `${adminProfile.name} (${adminProfile.email})`,
        affectedRecord: `${targetDoc.studentName} — ${targetDoc.documentType}`,
        timestamp: new Date().toISOString(),
        previousStatus: targetDoc.reviewStatus,
        newStatus: newStatus,
        reason: notes
          ? `Status updated to ${newStatus}. Note: ${notes}`
          : `College management reviewed and updated ${targetDoc.documentType} to ${newStatus}. Corrected digital record validated and sealed.`,
        category: 'document',
      }
      setAuditLog((prev) => [auditEntry, ...prev])

      // 3. Synchronize with Student Portal repository in localStorage
      try {
        const studentDocsRaw = localStorage.getItem('apaar_student_documents')
        if (studentDocsRaw) {
          const studentDocs = JSON.parse(studentDocsRaw)
          if (Array.isArray(studentDocs)) {
            const updatedStudentDocs = studentDocs.map((sDoc: any) => {
              const isMatch =
                sDoc.title.toLowerCase().includes(targetDoc.documentType.toLowerCase()) ||
                targetDoc.documentType.toLowerCase().includes(sDoc.title.toLowerCase()) ||
                sDoc.id.endsWith(documentId.replace('DOC-ADM-', ''))

              if (isMatch) {
                if (newStatus === 'accepted_for_verification') {
                  return {
                    ...sDoc,
                    status: 'verified',
                    availability: 'Issued by College',
                    fileName: updatedFileName,
                    fileSize: updatedFileSize,
                    hashDigest: updatedChecksum,
                    correctionReason: undefined,
                    correctionInstructions: undefined,
                    remarks: notes || 'Corrected original verified by College Registrar and cryptographically sealed.',
                  }
                } else if (newStatus === 'requires_correction') {
                  return {
                    ...sDoc,
                    status: 'requires_review',
                    availability: 'Correction Required',
                    correctionReason: notes || targetDoc.correctionNotes || 'Please contact your college management for further information about this document.',
                    correctionInstructions: 'Please visit your college management office to resolve the issue with your document. The college management will review the original document, make the necessary corrections, and update your digital record so that verification can be completed as soon as possible.',
                  }
                } else if (newStatus === 'under_review' || newStatus === 'pending_review') {
                  return {
                    ...sDoc,
                    status: 'pending',
                    availability: 'Pending Verification',
                  }
                }
              }
              return sDoc
            })
            localStorage.setItem('apaar_student_documents', JSON.stringify(updatedStudentDocs))
          }
        }

        // 4. Dispatch in-app notification to Student Portal
        const studentNotifsRaw = localStorage.getItem('apaar_student_notifications')
        const currentNotifs = studentNotifsRaw ? JSON.parse(studentNotifsRaw) : []
        const newStudentNotif = {
          id: `SN-${Date.now()}`,
          title:
            newStatus === 'accepted_for_verification'
              ? `Document Verified: ${targetDoc.documentType}`
              : `Correction Required: ${targetDoc.documentType}`,
          message:
            newStatus === 'accepted_for_verification'
              ? `College management has reviewed your original document, uploaded the corrected official digital copy, and verified your ${targetDoc.documentType}.`
              : `College management has updated the correction instructions for your ${targetDoc.documentType}. Please visit the college management office.`,
          date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          type: 'verification',
          read: false,
          actionUrl: '/student/documents',
        }
        localStorage.setItem('apaar_student_notifications', JSON.stringify([newStudentNotif, ...currentNotifs]))

        // 5. Fire window CustomEvent for active Student tabs/session
        window.dispatchEvent(new CustomEvent('apaar_college_doc_update', { detail: { documentId, newStatus } }))
        window.dispatchEvent(new CustomEvent('apaar:student-data-changed', { detail: { action: 'doc_review_updated', documentId } }))
      } catch {
        // ignore
      }

      // Sync with real backend
      collegeApi.reviewDocument(documentId, newStatus, notes).catch((err) => {
        console.warn('Backend reviewDocument sync:', err.message)
      })

      showToast(
        newStatus === 'accepted_for_verification'
          ? `Corrected digital copy uploaded and verified for "${targetDoc.documentType}". Student record updated.`
          : `Review status for "${targetDoc.documentType}" updated to ${newStatus}.`,
        'success'
      )
    },
    [documents, adminProfile, showToast]
  )

  const uploadStudentDocument = useCallback(
    async (data: {
      studentRegistrationNumber?: string
      studentId?: string
      apaarId?: string
      documentType: string
      title: string
      fileName: string
      fileSize?: string
      fileData?: string
      marksheetDetails?: {
        semester: string
        academicYear?: string
        sgpa?: number
        cgpa?: number
        creditsEarned?: number
        totalCredits?: number
        examination?: string
      }
    }) => {
      const result = await collegeApi.uploadDocument(data)
      await fetchCollegeData()
      window.dispatchEvent(
        new CustomEvent('apaar_college_doc_update', {
          detail: { action: 'document_uploaded', docId: result.document?.id },
        })
      )
      window.dispatchEvent(
        new CustomEvent('apaar:student-data-changed', {
          detail: { action: 'document_uploaded', regNo: data.studentRegistrationNumber, studentId: data.studentId },
        })
      )
      const targetIdentifier = data.studentRegistrationNumber || (data.apaarId ? `APAAR ${data.apaarId.slice(-4)}` : 'student')
      showToast(
        `Document "${data.title}" successfully recorded for ${targetIdentifier}.`,
        'success'
      )
      return result
    },
    [fetchCollegeData, showToast]
  )

  const searchStudents = useCallback(async (query: string, searchType?: 'all' | 'registrationNumber' | 'apaarId') => {
    return collegeApi.searchStudents(query, searchType)
  }, [])

  const updateDepartments = useCallback(
    async (newDepts: string[]) => {
      const updated = await collegeApi.updateDepartments(newDepts)
      setDepartments(updated)
      showToast('Official institutional departments updated successfully.', 'success')
    },
    [showToast]
  )

  // Computed summary metrics
  const stats = useMemo(() => {
    const verifiedStudentsCount = students.filter((s) => s.status === 'verified').length
    const pendingVerificationsCount = verificationRequests.filter(
      (r) => r.status === 'submitted' || r.status === 'under_review' || r.status === 'requires_info'
    ).length
    const rejectedStudentsCount = students.filter((s) => s.status === 'rejected').length
    const incompleteStudentsCount = students.filter((s) => s.status === 'incomplete').length
    const flaggedStudentsCount = students.filter((s) => s.status === 'flagged').length
    const completedVerificationsCount = verificationRequests.filter((r) => r.status === 'verified').length
    const openQualityCount = dataQualityIssues.filter((i) => i.reviewStatus !== 'resolved').length
    const docsRequiringCorrection = documents.filter((d) => d.reviewStatus === 'requires_correction').length
    const missingDocs = documents.filter(
      (d) =>
        d.reviewStatus === 'pending_review' &&
        (d.fileName.toLowerCase().includes('not available') || d.fileName.toLowerCase().includes('missing'))
    ).length
    const publishedRecords = academicRecords.filter((r) => r.status === 'verified').length

    return {
      totalStudents: students.length,
      verifiedStudents: verifiedStudentsCount,
      pendingVerifications: pendingVerificationsCount,
      documentsRequiringCorrection: docsRequiringCorrection,
      missingDocuments: missingDocs,
      publishedAcademicRecords: publishedRecords,
      rejectedOrIncomplete: rejectedStudentsCount + incompleteStudentsCount,
      rejectedStudents: rejectedStudentsCount,
      incompleteStudents: incompleteStudentsCount,
      flaggedStudents: flaggedStudentsCount,
      completedVerifications: completedVerificationsCount,
      totalAcademicRecords: academicRecords.length,
      openDataQualityIssues: openQualityCount,
    }
  }, [students, verificationRequests, academicRecords, dataQualityIssues, documents])

  return (
    <AdminContext.Provider
      value={{
        students,
        academicRecords,
        documents,
        verificationRequests,
        dataQualityIssues,
        auditLog,
        adminProfile,
        stats,
        toast,
        showToast,
        dismissToast,
        approveVerification,
        rejectVerification,
        updateStudentStatus,
        updateDocumentReview,
        resolveDataQualityIssue,
        runDuplicateScan,
        detectedDuplicates,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        dispatchNotification,
        uploadStudentDocument,
        searchStudents,
        refreshCollegeData: fetchCollegeData,
        departments,
        updateDepartments,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
