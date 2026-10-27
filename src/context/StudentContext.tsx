import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  mockStudentProfile,
  mockAcademicRecords,
  mockStudentDocuments,
  mockVerificationRequests,
  mockStudentNotifications,
} from '@/services/studentMockData'
import {
  mockSharingConsentRequests,
  mockConsentAuditTrail,
  generateAccessToken,
} from '@/services/consentSharingService'
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

const StudentContext = createContext<StudentContextType | undefined>(undefined)

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile: authProfile } = useAuth()
  const [profile, setProfile] = useState<StudentProfileData>(() => {
    if (user && user.role === 'student') {
      return {
        ...mockStudentProfile,
        fullName: user.fullName || mockStudentProfile.fullName,
        studentEmail: user.email || mockStudentProfile.studentEmail,
        apaarId: user.apaarId || mockStudentProfile.apaarId,
        institutionName: user.institutionName || mockStudentProfile.institutionName,
        ...(authProfile ? (authProfile as any) : {}),
      }
    }
    return mockStudentProfile
  })

  // Keep profile synchronized if authenticated user changes
  useEffect(() => {
    if (user && user.role === 'student') {
      const nextFullName = user.fullName || mockStudentProfile.fullName
      const nextEmail = user.email || mockStudentProfile.studentEmail
      const nextApaarId = user.apaarId || mockStudentProfile.apaarId
      const nextInst = user.institutionName || mockStudentProfile.institutionName

      setProfile((prev) => {
        if (
          prev.fullName === nextFullName &&
          prev.studentEmail === nextEmail &&
          prev.apaarId === nextApaarId &&
          prev.institutionName === nextInst &&
          !authProfile
        ) {
          return prev
        }
        return {
          ...prev,
          fullName: nextFullName,
          studentEmail: nextEmail,
          apaarId: nextApaarId,
          institutionName: nextInst,
          ...(authProfile ? (authProfile as any) : {}),
        }
      })
    }
  }, [user, authProfile])
  const [academicRecords] = useState<AcademicRecordItem[]>(mockAcademicRecords)
  const [documents, setDocuments] = useState<StudentDocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('apaar_student_documents')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return mockStudentDocuments
  })
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequestItem[]>(mockVerificationRequests)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('apaar_student_notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return mockStudentNotifications
  })
  const [consentRequests, setConsentRequests] = useState<SharingConsentRequest[]>(mockSharingConsentRequests)
  const [consentAuditLogs, setConsentAuditLogs] = useState<VerificationAuditTrailItem[]>(mockConsentAuditTrail)
  const [toast, setToast] = useState<StudentToast | null>(null)

  // Persist documents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apaar_student_documents', JSON.stringify(documents))
    } catch {
      // ignore
    }
  }, [documents])

  // Persist notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apaar_student_notifications', JSON.stringify(notifications))
    } catch {
      // ignore
    }
  }, [notifications])

  // Listen for real-time updates dispatched by College Management
  useEffect(() => {
    const handleCollegeUpdate = () => {
      try {
        const savedDocs = localStorage.getItem('apaar_student_documents')
        if (savedDocs) {
          setDocuments(JSON.parse(savedDocs))
        }
        const savedNotifs = localStorage.getItem('apaar_student_notifications')
        if (savedNotifs) {
          setNotifications(JSON.parse(savedNotifs))
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('apaar_college_doc_update', handleCollegeUpdate)
    window.addEventListener('storage', handleCollegeUpdate)
    return () => {
      window.removeEventListener('apaar_college_doc_update', handleCollegeUpdate)
      window.removeEventListener('storage', handleCollegeUpdate)
    }
  }, [])

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

  const updateProfile = useCallback((updated: Partial<StudentProfileData>) => {
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
    setDocuments((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      try {
        localStorage.setItem('apaar_student_documents', JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const addVerificationRequest = useCallback((recordTitle: string, purpose: string, notes?: string) => {
    const refNo = `REQ-2025-${Math.floor(1000 + Math.random() * 9000)}`
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
          note: notes || 'Awaiting administrative officer allocation.',
        },
        {
          stage: 'DigiLocker NAD Depository Cross-Check',
          timestamp: 'Pending',
          status: 'pending',
        },
        {
          stage: 'Cryptographic Credential Seal Attached',
          timestamp: 'Pending',
          status: 'pending',
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
    return newReq
  }, [showToast])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    showToast('All student notifications marked as read.', 'info')
  }, [showToast])

  const approveConsent = useCallback((reqId: string) => {
    const target = consentRequests.find((r) => r.id === reqId)
    if (!target) return

    const { token, hash } = generateAccessToken(target.referenceCode)
    const nowIso = new Date().toISOString()

    setConsentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r
        return {
          ...r,
          status: 'approved',
          consentGivenAt: nowIso,
          temporaryAccessToken: token,
          verificationHash: hash,
        }
      })
    )

    const newAudit: VerificationAuditTrailItem = {
      id: `AUD-${Date.now()}`,
      timestamp: nowIso,
      eventType: 'consent_granted',
      actor: `${profile.fullName} (Student)`,
      details: `Student approved data sharing with ${target.requesterName}. Token ${token} generated (Valid until ${target.expiresAt.split('T')[0]}).`,
      ipSubnetHash: 'ip:157.48.***.***',
    }
    setConsentAuditLogs((prev) => [newAudit, ...prev])

    // Student notification
    const notif: NotificationItem = {
      id: `SN-${Date.now()}`,
      title: 'Data Sharing Consent Approved',
      message: `Temporary verification token generated for ${target.requesterName}. Valid until ${target.expiresAt.split('T')[0]}.`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'security',
      read: false,
      actionUrl: '/student/requests',
    }
    setNotifications((prev) => [notif, ...prev])

    showToast(`Consent granted to ${target.requesterName}. Verification token active.`, 'success')
  }, [consentRequests, profile.fullName, showToast])

  const rejectConsent = useCallback((reqId: string) => {
    const target = consentRequests.find((r) => r.id === reqId)
    if (!target) return

    const nowIso = new Date().toISOString()

    setConsentRequests((prev) =>
      prev.map((r) => {
        if (r.id !== reqId) return r
        return { ...r, status: 'rejected' }
      })
    )

    const newAudit: VerificationAuditTrailItem = {
      id: `AUD-${Date.now()}`,
      timestamp: nowIso,
      eventType: 'consent_denied',
      actor: `${profile.fullName} (Student)`,
      details: `Student rejected data sharing request from ${target.requesterName}. Zero academic data disclosed.`,
      ipSubnetHash: 'ip:157.48.***.***',
    }
    setConsentAuditLogs((prev) => [newAudit, ...prev])

    showToast(`Consent denied for ${target.requesterName}. Record protected.`, 'info')
  }, [consentRequests, profile.fullName, showToast])

  const revokeConsent = useCallback((reqId: string) => {
    const target = consentRequests.find((r) => r.id === reqId)
    if (!target) return

    const nowIso = new Date().toISOString()

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

    const newAudit: VerificationAuditTrailItem = {
      id: `AUD-${Date.now()}`,
      timestamp: nowIso,
      eventType: 'consent_revoked',
      actor: `${profile.fullName} (Student)`,
      details: `Student revoked access previously granted to ${target.requesterName}. Token invalidation broadcasted.`,
      ipSubnetHash: 'ip:157.48.***.***',
    }
    setConsentAuditLogs((prev) => [newAudit, ...prev])

    const notif: NotificationItem = {
      id: `SN-${Date.now()}`,
      title: 'Consent Revoked',
      message: `Access authorization for ${target.requesterName} has been immediately revoked.`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'security',
      read: false,
      actionUrl: '/student/requests',
    }
    setNotifications((prev) => [notif, ...prev])

    showToast(`Access for ${target.requesterName} revoked immediately. Access token terminated.`, 'info')
  }, [consentRequests, profile.fullName, showToast])

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
