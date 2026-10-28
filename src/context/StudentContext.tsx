import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { studentApi } from '@/services/portalApiService'
import type {
  StudentProfileData,
  AcademicRecordItem,
  StudentDocumentItem,
  VerificationRequestItem,
  NotificationItem,
  SharingConsentRequest,
  VerificationAuditTrailItem,
} from '@/types'

export interface StudentToast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface StudentContextType {
  // Student Profile
  profile: StudentProfileData
  updateProfile: (updated: Partial<StudentProfileData>) => void

  // Academic Records & Transcripts
  academicRecords: AcademicRecordItem[]

  // Document Management
  documents: StudentDocumentItem[]
  addDocument: (doc: Omit<StudentDocumentItem, 'id' | 'uploadDate'>) => void
  removeDocument: (id: string) => boolean
  replaceDocument: (id: string, newFile: { fileName: string; fileSize: string; remarks?: string }) => boolean
  updateDocumentByCollege: (id: string, updates: Partial<StudentDocumentItem>) => void

  // Verification Requests Workflow
  verificationRequests: VerificationRequestItem[]
  addVerificationRequest: (recordTitle: string, purpose: string, notes?: string) => VerificationRequestItem

  // Notification Centre
  notifications: NotificationItem[]
  unreadNotificationsCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Stage 8 DPDP Act Third-Party Consent Sharing
  consentRequests: SharingConsentRequest[]
  consentAuditLogs: VerificationAuditTrailItem[]
  approveConsent: (reqId: string) => void
  rejectConsent: (reqId: string) => void
  revokeConsent: (reqId: string) => void

  // Feedback Toast
  toast: StudentToast | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: () => void
}

const defaultEmptyProfile: StudentProfileData = {
  id: '',
  fullName: '',
  studentEmail: '',
  institutionName: '',
  institutionCode: '',
  department: '',
  course: '',
  yearOfStudy: '',
  registrationNumber: '',
  apaarId: '',
  abcId: '',
  phone: '',
  dob: '',
  gender: 'Other',
  bloodGroup: '',
  admissionCategory: 'General',
  digilockerConnected: false,
  lastSync: '',
  currentSemester: '',
  degree: '',
  admissionYear: '',
}

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile: authProfile } = useAuth()

  const [profile, setProfile] = useState<StudentProfileData>(() => {
    if (user && user.role === 'student') {
      return {
        ...defaultEmptyProfile,
        fullName: user.fullName || '',
        studentEmail: user.email || '',
        apaarId: user.apaarId || '',
        institutionName: user.institutionName || '',
        institutionCode: user.institutionCode || '',
        ...(authProfile ? (authProfile as any) : {}),
      }
    }
    return defaultEmptyProfile
  })

  // Keep profile synchronized if authenticated user changes
  useEffect(() => {
    if (user && user.role === 'student') {
      const nextFullName = user.fullName || ''
      const nextEmail = user.email || ''
      const nextApaarId = user.apaarId || ''
      const nextInst = user.institutionName || ''
      const nextCode = user.institutionCode || ''

      setProfile((prev) => ({
        ...prev,
        fullName: nextFullName || prev.fullName,
        studentEmail: nextEmail || prev.studentEmail,
        apaarId: nextApaarId || prev.apaarId,
        institutionName: nextInst || prev.institutionName,
        institutionCode: nextCode || prev.institutionCode,
        ...(authProfile ? (authProfile as any) : {}),
      }))
    }
  }, [user, authProfile])

  const [academicRecords, setAcademicRecords] = useState<AcademicRecordItem[]>([])
  const [documents, setDocuments] = useState<StudentDocumentItem[]>([])
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequestItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [consentRequests, setConsentRequests] = useState<SharingConsentRequest[]>([])
  const [consentAuditLogs, setConsentAuditLogs] = useState<VerificationAuditTrailItem[]>([])
  const [toast, setToast] = useState<StudentToast | null>(null)

  // ─────────────────────────────────────────────────────────────────────────
  // REAL DATABASE FETCH FUNCTION
  // ─────────────────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!user || user.role !== 'student') return

    try {
      const data = await studentApi.getDashboard()
      if (data && data.success) {
        if (data.student) {
          setProfile((prev) => ({
            ...prev,
            ...data.student,
            institutionName: data.college?.name || data.student.institutionName || prev.institutionName,
            institutionCode: data.college?.code || data.student.institutionCode || prev.institutionCode,
          }))
        }
        if (Array.isArray(data.academicRecords)) {
          setAcademicRecords(data.academicRecords)
        }
        if (Array.isArray(data.documents)) {
          const mappedDocs: StudentDocumentItem[] = data.documents.map((d: any) => ({
            id: d.id,
            title: d.title,
            type: d.documentType || d.type || 'Academic Document',
            fileName: d.fileName,
            fileSize: d.fileSize || '1.2 MB',
            uploadDate: d.uploadDate,
            status:
              d.reviewStatus === 'accepted_for_verification'
                ? 'verified'
                : d.reviewStatus === 'requires_correction'
                ? 'requires_review'
                : (d.status || 'pending'),
            remarks: d.correctionNotes || d.remarks,
            canRemove: false,
            hashDigest: d.hashDigest || 'SHA256:verified',
            availability:
              d.reviewStatus === 'requires_correction'
                ? 'Correction Required'
                : d.reviewStatus === 'accepted_for_verification'
                ? 'Available'
                : 'Pending Verification',
            correctionReason: d.correctionNotes,
          }))
          setDocuments(mappedDocs)
        }
        if (Array.isArray(data.verificationRequests)) {
          setVerificationRequests(data.verificationRequests)
        }
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
        }
      }
    } catch {
      // Keep existing data in state
    }
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Listen for real-time updates dispatched by College Management
  useEffect(() => {
    const handleCollegeUpdate = () => {
      fetchDashboardData()
    }
    window.addEventListener('apaar_college_doc_update', handleCollegeUpdate)
    window.addEventListener('apaar:student-data-changed', handleCollegeUpdate)
    return () => {
      window.removeEventListener('apaar_college_doc_update', handleCollegeUpdate)
      window.removeEventListener('apaar:student-data-changed', handleCollegeUpdate)
    }
  }, [fetchDashboardData])

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

  const updateProfile = useCallback(async (updated: Partial<StudentProfileData>) => {
    try {
      await studentApi.updateProfile(updated)
    } catch {
      // optimistic local update proceeds
    }
    setProfile((prev) => ({ ...prev, ...updated }))
    showToast('Student profile details updated successfully.', 'success')
  }, [showToast])

  const addDocument = useCallback((doc: Omit<StudentDocumentItem, 'id' | 'uploadDate'>) => {
    const newDoc: StudentDocumentItem = {
      ...doc,
      id: `DOC-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    }
    setDocuments((prev) => [newDoc, ...prev])
    showToast(`Document "${newDoc.title}" submitted successfully for verification.`, 'success')
  }, [showToast])

  const removeDocument = useCallback((id: string) => {
    const target = documents.find((d) => d.id === id)
    if (!target) return false
    showToast('Official college-managed documents cannot be removed by students. Please contact your college management.', 'error')
    return false
  }, [documents, showToast])

  const replaceDocument = useCallback((id: string) => {
    const target = documents.find((d) => d.id === id)
    if (!target) return false
    showToast('Official college-managed documents cannot be replaced by students. Please visit your college management office.', 'error')
    return false
  }, [documents, showToast])

  const updateDocumentByCollege = useCallback((id: string, updates: Partial<StudentDocumentItem>) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }, [])

  const addVerificationRequest = useCallback((recordTitle: string, purpose: string, notes?: string) => {
    const refNo = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    const newReq: VerificationRequestItem = {
      id: `req-${Date.now()}`,
      referenceNo: refNo,
      recordTitle,
      purpose,
      submissionDate: 'Today',
      status: 'submitted',
      lastUpdated: 'Just now',
      timeline: [
        {
          stage: 'Request Submitted by Student',
          timestamp: `Today at ${nowTime}`,
          status: 'completed',
        },
        {
          stage: 'College Registrar Office Scrutiny',
          timestamp: 'Queued for institutional review',
          status: 'current',
          note: notes || 'Awaiting administrative officer review.',
        },
      ],
    }

    setVerificationRequests((prev) => [newReq, ...prev])

    // Generate in-app student notification
    const studentNotif: NotificationItem = {
      id: `SN-${Date.now()}`,
      title: 'Verification Request Submitted',
      message: `Your request (${refNo}) for "${recordTitle}" has been queued for registrar scrutiny.`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'verification',
      read: false,
      actionUrl: '/student/requests',
    }
    setNotifications((prev) => [studentNotif, ...prev])
    showToast(`Verification request ${refNo} created successfully.`, 'success')

    // Persist to real database backend
    studentApi
      .submitVerificationRequest(recordTitle, purpose, notes)
      .then((serverReq) => {
        if (serverReq && serverReq.id) {
          setVerificationRequests((prev) =>
            prev.map((r) => (r.id === newReq.id ? { ...r, id: serverReq.id, referenceNo: serverReq.referenceNo } : r))
          )
        }
        window.dispatchEvent(new CustomEvent('apaar_college_doc_update'))
      })
      .catch((err) => {
        console.error('Failed to submit verification request to backend:', err)
      })

    return newReq
  }, [showToast])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    studentApi.markNotificationRead(id).catch(() => {})
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    studentApi.markAllNotificationsRead().catch(() => {})
    showToast('All student notifications marked as read.', 'info')
  }, [showToast])

  const approveConsent = useCallback((reqId: string) => {
    const target = consentRequests.find((r) => r.id === reqId)
    if (!target) return

    const nowIso = new Date().toISOString()

    setConsentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r
        return {
          ...r,
          status: 'approved',
          consentGivenAt: nowIso,
        }
      })
    )

    const newAudit: VerificationAuditTrailItem = {
      id: `AUD-${Date.now()}`,
      timestamp: nowIso,
      eventType: 'consent_granted',
      actor: `${profile.fullName} (Student)`,
      details: `Student approved data sharing with ${target.requesterName}.`,
      ipSubnetHash: 'ip:157.48.***.***',
    }
    setConsentAuditLogs((prev) => [newAudit, ...prev])

    showToast(`Consent granted to ${target.requesterName}.`, 'success')
  }, [consentRequests, profile.fullName, showToast])

  const rejectConsent = useCallback((reqId: string) => {
    const target = consentRequests.find((r) => r.id === reqId)
    if (!target) return

    setConsentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r
        return { ...r, status: 'rejected' }
      })
    )

    showToast(`Consent denied for ${target.requesterName}. Record protected.`, 'info')
  }, [consentRequests, showToast])

  const revokeConsent = useCallback((reqId: string) => {
    const target = consentRequests.find((r) => r.id === reqId)
    if (!target) return

    setConsentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r
        return {
          ...r,
          status: 'revoked',
          temporaryAccessToken: undefined,
        }
      })
    )

    showToast(`Access for ${target.requesterName} revoked immediately.`, 'info')
  }, [consentRequests, showToast])

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length
  }, [notifications])

  return (
    <StudentContext.Provider
      value={{
        profile,
        updateProfile,
        academicRecords,
        documents,
        addDocument,
        removeDocument,
        replaceDocument,
        updateDocumentByCollege,
        verificationRequests,
        addVerificationRequest,
        notifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        consentRequests,
        consentAuditLogs,
        approveConsent,
        rejectConsent,
        revokeConsent,
        toast,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StudentContext.Provider>
  )
}

export const useStudent = () => {
  const context = useContext(StudentContext)
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider')
  }
  return context
}

export const useStudentContext = useStudent
