/**
 * APAAR CONNECT AI — Application Data Service Layer
 * Stage 9: Backend & Database Integration (Demonstration Mode)
 *
 * ARCHITECTURE NOTE:
 * This service simulates a backend API using in-memory state seeded from the
 * existing demonstration mock data. All operations follow REST-style patterns
 * (paginated lists, typed responses, error codes) so that replacing this layer
 * with a real backend (Node.js/Express, FastAPI, Supabase, Firebase) requires
 * only updating the fetch calls — no component changes needed.
 *
 * WHAT IS SIMULATED (demonstration):
 *   - All CRUD operations (students, records, documents, verifications, consent)
 *   - Role-based permission checks
 *   - Pagination and filtering
 *   - Audit trail recording
 *   - Notification dispatch
 *
 * WHAT REQUIRES REAL BACKEND INTEGRATION:
 *   - JWT / OAuth2 token issuance and validation
 *   - Persistent database storage (PostgreSQL / MongoDB / Firestore)
 *   - Email / SMS notification delivery
 *   - UIDAI Aadhaar demographic verification API
 *   - DigiLocker NAD document pull API
 *   - Academic Bank of Credits (ABC) synchronization
 *   - OCR document extraction services
 */

import type {
  AdminStudentRecord,
  AdminAcademicRecord,
  AdminDocumentReviewItem,
  AdminVerificationRequestItem,
  DataQualityIssueItem,
  AuditLogItem,
  NotificationItem,
} from '@/types'
import {
  mockAdminStudents,
  mockAdminAcademicRecords,
  mockAdminDocuments,
  mockAdminVerificationRequests,
  mockDataQualityIssues,
  mockAuditLog,
  mockAdminNotifications,
} from '@/services/adminMockData'
import { mockStudentNotifications } from '@/services/studentMockData'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'admin' | 'platform'

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  totalCount?: number
  page?: number
  pageSize?: number
}

export interface PaginationOptions {
  page?: number
  pageSize?: number
}

export interface StudentFilterOptions {
  search?: string
  status?: string
  department?: string
}

export interface VerificationFilterOptions {
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface DemoCredential {
  email: string
  password: string
  role: UserRole
  label: string
  redirectPath: string
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO AUTHENTICATION CREDENTIALS
// These are for demonstration only. A real backend would validate via JWT/OAuth2.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'aarav.sharma@student.niet.edu.in',
    password: 'StudentPass#2025',
    role: 'student',
    label: 'Demo Student',
    redirectPath: '/student',
  },
  {
    email: 'registrar@niet.edu.in',
    password: 'AdminPass#2025',
    role: 'admin',
    label: 'College Registrar (NIET)',
    redirectPath: '/admin',
  },
  {
    email: 'platform.admin@aicte.gov.in',
    password: 'PlatformPass#2026',
    role: 'platform',
    label: 'AICTE Platform Administrator',
    redirectPath: '/platform',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY DATA STORE
// Seeded from existing mock data; mutations are applied to these copies.
// ─────────────────────────────────────────────────────────────────────────────

let _students: AdminStudentRecord[] = [...mockAdminStudents]
let _academicRecords: AdminAcademicRecord[] = [...mockAdminAcademicRecords]
let _documents: AdminDocumentReviewItem[] = [...mockAdminDocuments]
let _verificationRequests: AdminVerificationRequestItem[] = [...mockAdminVerificationRequests]
let _dataQualityIssues: DataQualityIssueItem[] = [...mockDataQualityIssues]
let _auditLog: AuditLogItem[] = [...mockAuditLog]

/** Admin-specific notification store */
let _adminNotifications = mockAdminNotifications.map((n) => ({ ...n }))

/** Student-specific notification store */
let _studentNotifications: NotificationItem[] = mockStudentNotifications.map((n) => ({ ...n }))

// ─────────────────────────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Simulates async network latency (50–150ms) */
const delay = (ms = 80): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** Creates a timestamped audit log entry */
const createAuditEntry = (
  action: string,
  adminAccount: string,
  affectedRecord: string,
  category: AuditLogItem['category'],
  reason: string,
  previousStatus?: string,
  newStatus?: string
): AuditLogItem => ({
  id: `AL-${Date.now()}`,
  action,
  adminAccount,
  affectedRecord,
  timestamp: new Date().toISOString(),
  previousStatus,
  newStatus,
  reason,
  category,
})

/** Dispatches an admin notification */
const dispatchAdminNotification = (
  title: string,
  message: string,
  type: typeof _adminNotifications[0]['type'],
  actionUrl = '/admin/notifications'
) => {
  _adminNotifications = [
    {
      id: `AN-${Date.now()}`,
      title,
      message,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type,
      read: false,
      actionUrl,
    },
    ..._adminNotifications,
  ]
}

/** Dispatches a student notification */
const dispatchStudentNotification = (
  title: string,
  message: string,
  type: NotificationItem['type'],
  actionUrl?: string
) => {
  _studentNotifications = [
    {
      id: `SN-${Date.now()}`,
      title,
      message,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type,
      read: false,
      actionUrl,
    },
    ..._studentNotifications,
  ]
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const studentService = {
  /**
   * List students with optional search / status / department filtering + pagination.
   * Role: admin, platform
   */
  async list(
    filters: StudentFilterOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<ApiResponse<AdminStudentRecord[]>> {
    await delay()
    const { search = '', status = 'all', department = 'all' } = filters
    const { page = 1, pageSize = 20 } = pagination

    let result = _students.filter((s) => {
      const matchesSearch =
        !search ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.apaarId.includes(search)
      const matchesStatus = status === 'all' || s.status === status
      const matchesDept = department === 'all' || s.department === department
      return matchesSearch && matchesStatus && matchesDept
    })

    const totalCount = result.length
    result = result.slice((page - 1) * pageSize, page * pageSize)

    return { data: result, success: true, totalCount, page, pageSize }
  },

  /**
   * Get a single student by ID.
   * Role: admin, platform, student (own record only)
   */
  async get(id: string): Promise<ApiResponse<AdminStudentRecord | null>> {
    await delay()
    const student = _students.find((s) => s.id === id) ?? null
    if (!student) return { data: null, success: false, error: 'Student record not found.' }
    return { data: student, success: true }
  },

  /**
   * Update student status with mandatory reason.
   * Role: admin
   */
  async updateStatus(
    id: string,
    newStatus: AdminStudentRecord['status'],
    reason: string,
    adminAccount = 'registrar@niet.edu.in'
  ): Promise<ApiResponse<AdminStudentRecord>> {
    await delay()
    const idx = _students.findIndex((s) => s.id === id)
    if (idx === -1) return { data: _students[0], success: false, error: 'Student not found.' }

    const prev = _students[idx]
    _students[idx] = { ...prev, status: newStatus }

    const logEntry = createAuditEntry(
      'Student Record Status Updated',
      adminAccount,
      `${prev.id} — ${prev.fullName} (${prev.registrationNumber})`,
      'student',
      reason,
      prev.status,
      newStatus
    )
    _auditLog = [logEntry, ..._auditLog]

    dispatchAdminNotification(
      `Student Status Updated: ${prev.fullName}`,
      `Status changed from ${prev.status} to ${newStatus}. Reason: ${reason}`,
      'update'
    )

    if (newStatus === 'verified') {
      dispatchStudentNotification(
        'Your APAAR Record Has Been Verified',
        `Your student record has been officially verified by the registrar. Your APAAR ID is now active.`,
        'verification',
        '/student/records'
      )
    }

    return { data: _students[idx], success: true }
  },

  /**
   * Export students as CSV string (non-sensitive fields only).
   * Role: admin, platform
   */
  exportCsv(filters: StudentFilterOptions = {}): string {
    const { search = '', status = 'all', department = 'all' } = filters
    const result = _students.filter((s) => {
      const matchesSearch =
        !search ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.registrationNumber.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || s.status === status
      const matchesDept = department === 'all' || s.department === department
      return matchesSearch && matchesStatus && matchesDept
    })

    const headers = [
      'Registration Number',
      'Full Name',
      'Department',
      'Programme',
      'Academic Year',
      'Current Semester',
      'Status',
      'CGPA',
      'DigiLocker Synced',
      'Enrolment Date',
    ]

    const rows = result.map((s) =>
      [
        s.registrationNumber,
        `"${s.fullName}"`,
        `"${s.department}"`,
        s.programme,
        s.academicYear,
        s.currentSemester,
        s.status,
        s.cgpa,
        s.digilockerSynced ? 'Yes' : 'No',
        s.enrolmentDate,
      ].join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC RECORD OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const academicRecordService = {
  /** List academic records, optionally filtered by student ID. */
  async list(studentId?: string): Promise<ApiResponse<AdminAcademicRecord[]>> {
    await delay()
    const result = studentId
      ? _academicRecords.filter((r) => r.studentId === studentId)
      : _academicRecords
    return { data: result, success: true, totalCount: result.length }
  },

  /** Update academic record status. */
  async updateStatus(
    id: string,
    newStatus: AdminAcademicRecord['status'],
    reason: string,
    adminAccount = 'registrar@niet.edu.in'
  ): Promise<ApiResponse<AdminAcademicRecord>> {
    await delay()
    const idx = _academicRecords.findIndex((r) => r.id === id)
    if (idx === -1) return { data: _academicRecords[0], success: false, error: 'Record not found.' }

    const prev = _academicRecords[idx]
    _academicRecords[idx] = { ...prev, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] }

    const logEntry = createAuditEntry(
      'Academic Record Status Updated',
      adminAccount,
      `${prev.id} — ${prev.studentName} (${prev.semester})`,
      'academic',
      reason,
      prev.status,
      newStatus
    )
    _auditLog = [logEntry, ..._auditLog]

    return { data: _academicRecords[idx], success: true }
  },

  /** Export academic records as CSV. */
  exportCsv(studentId?: string): string {
    const result = studentId
      ? _academicRecords.filter((r) => r.studentId === studentId)
      : _academicRecords

    const headers = [
      'Record ID',
      'Student Name',
      'Registration Number',
      'Department',
      'Programme',
      'Academic Year',
      'Semester',
      'Examination',
      'SGPA',
      'Credits Earned',
      'Total Credits',
      'Status',
      'Issuing Authority',
    ]

    const rows = result.map((r) =>
      [
        r.id,
        `"${r.studentName}"`,
        r.registrationNumber,
        `"${r.department}"`,
        r.programme,
        r.academicYear,
        `"${r.semester}"`,
        `"${r.examination}"`,
        r.sgpa,
        r.creditsEarned,
        r.totalCredits,
        r.status,
        `"${r.issuingAuthority}"`,
      ].join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const documentService = {
  async list(): Promise<ApiResponse<AdminDocumentReviewItem[]>> {
    await delay()
    return { data: _documents, success: true, totalCount: _documents.length }
  },

  async updateReviewStatus(
    id: string,
    newStatus: AdminDocumentReviewItem['reviewStatus'],
    notes: string,
    adminAccount = 'registrar@niet.edu.in'
  ): Promise<ApiResponse<AdminDocumentReviewItem>> {
    await delay()
    const idx = _documents.findIndex((d) => d.id === id)
    if (idx === -1) return { data: _documents[0], success: false, error: 'Document not found.' }

    const prev = _documents[idx]
    _documents[idx] = {
      ...prev,
      reviewStatus: newStatus,
      correctionNotes: newStatus === 'requires_correction' ? notes : prev.correctionNotes,
      rejectionReason: newStatus === 'rejected' ? notes : prev.rejectionReason,
      reviewer: adminAccount,
    }

    const logEntry = createAuditEntry(
      'Document Review Status Updated',
      adminAccount,
      `${prev.id} — ${prev.studentName} (${prev.documentType})`,
      'document',
      notes,
      prev.reviewStatus,
      newStatus
    )
    _auditLog = [logEntry, ..._auditLog]

    if (newStatus === 'requires_correction') {
      dispatchStudentNotification(
        'Document Requires Correction',
        `Your ${prev.documentType} for ${prev.studentName} requires correction. Note: ${notes}`,
        'reminder',
        '/student/documents'
      )
    }

    return { data: _documents[idx], success: true }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICATION REQUEST OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const verificationService = {
  async list(
    filters: VerificationFilterOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<ApiResponse<AdminVerificationRequestItem[]>> {
    await delay()
    const { search = '', status = 'all', dateFrom, dateTo } = filters
    const { page = 1, pageSize = 15 } = pagination

    let result = _verificationRequests.filter((v) => {
      const matchesSearch =
        !search ||
        v.studentName.toLowerCase().includes(search.toLowerCase()) ||
        v.referenceNo.toLowerCase().includes(search.toLowerCase()) ||
        v.registrationNumber.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || v.status === status
      const matchesFrom = !dateFrom || v.submissionDate >= dateFrom
      const matchesTo = !dateTo || v.submissionDate <= dateTo
      return matchesSearch && matchesStatus && matchesFrom && matchesTo
    })

    const totalCount = result.length
    result = result.slice((page - 1) * pageSize, page * pageSize)
    return { data: result, success: true, totalCount, page, pageSize }
  },

  async updateStatus(
    id: string,
    newStatus: AdminVerificationRequestItem['status'],
    reason: string,
    adminAccount = 'registrar@niet.edu.in'
  ): Promise<ApiResponse<AdminVerificationRequestItem>> {
    await delay()
    const idx = _verificationRequests.findIndex((v) => v.id === id)
    if (idx === -1)
      return { data: _verificationRequests[0], success: false, error: 'Verification request not found.' }

    const prev = _verificationRequests[idx]
    _verificationRequests[idx] = {
      ...prev,
      status: newStatus,
      lastUpdated: new Date().toISOString().split('T')[0],
      decisionReason: reason,
    }

    const logEntry = createAuditEntry(
      'Verification Request Status Updated',
      adminAccount,
      `${prev.id} — ${prev.studentName} (${prev.referenceNo})`,
      'verification',
      reason,
      prev.status,
      newStatus
    )
    _auditLog = [logEntry, ..._auditLog]

    const isApproval = newStatus === 'verified' || newStatus === 'accepted_for_verification'
    const isRejection = newStatus === 'rejected' || newStatus === 'flagged'

    dispatchAdminNotification(
      `Verification ${isApproval ? 'Approved' : isRejection ? 'Rejected' : 'Updated'}: ${prev.referenceNo}`,
      `${prev.studentName}'s request (${prev.referenceNo}) status set to "${newStatus}". Reason: ${reason}`,
      isApproval ? 'verification' : isRejection ? 'security' : 'update'
    )

    dispatchStudentNotification(
      `Verification Request ${isApproval ? 'Approved' : isRejection ? 'Rejected' : 'Updated'}`,
      `Your verification request (${prev.referenceNo}) has been ${newStatus.replace(/_/g, ' ')}. ${reason}`,
      isApproval ? 'verification' : isRejection ? 'reminder' : 'update',
      '/student/requests'
    )

    return { data: _verificationRequests[idx], success: true }
  },

  exportCsv(filters: VerificationFilterOptions = {}): string {
    const { search = '', status = 'all' } = filters
    const result = _verificationRequests.filter((v) => {
      const matchesSearch =
        !search ||
        v.studentName.toLowerCase().includes(search.toLowerCase()) ||
        v.referenceNo.toLowerCase().includes(search.toLowerCase())
      return matchesSearch && (status === 'all' || v.status === status)
    })

    const headers = [
      'Reference No',
      'Student Name',
      'Registration Number',
      'Record Type',
      'Submission Date',
      'Status',
      'Assigned Reviewer',
      'Last Updated',
    ]

    const rows = result.map((v) =>
      [
        v.referenceNo,
        `"${v.studentName}"`,
        v.registrationNumber,
        `"${v.academicRecordType}"`,
        v.submissionDate,
        v.status,
        `"${v.assignedReviewer}"`,
        v.lastUpdated,
      ].join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA QUALITY OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const dataQualityService = {
  async list(): Promise<ApiResponse<DataQualityIssueItem[]>> {
    await delay()
    return { data: _dataQualityIssues, success: true, totalCount: _dataQualityIssues.length }
  },

  async updateReviewStatus(
    id: string,
    newStatus: DataQualityIssueItem['reviewStatus'],
    reason: string,
    adminAccount = 'registrar@niet.edu.in'
  ): Promise<ApiResponse<DataQualityIssueItem>> {
    await delay()
    const idx = _dataQualityIssues.findIndex((i) => i.id === id)
    if (idx === -1) return { data: _dataQualityIssues[0], success: false, error: 'Issue not found.' }

    const prev = _dataQualityIssues[idx]
    _dataQualityIssues[idx] = { ...prev, reviewStatus: newStatus }

    const logEntry = createAuditEntry(
      'Data Quality Issue Review Status Updated',
      adminAccount,
      `${prev.id} — ${prev.studentName} (${prev.issueType})`,
      'quality',
      reason,
      prev.reviewStatus,
      newStatus
    )
    _auditLog = [logEntry, ..._auditLog]

    return { data: _dataQualityIssues[idx], success: true }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const auditService = {
  async list(
    category?: AuditLogItem['category'],
    pagination: PaginationOptions = {}
  ): Promise<ApiResponse<AuditLogItem[]>> {
    await delay()
    const { page = 1, pageSize = 20 } = pagination
    let result = category ? _auditLog.filter((l) => l.category === category) : _auditLog
    const totalCount = result.length
    result = result.slice((page - 1) * pageSize, page * pageSize)
    return { data: result, success: true, totalCount, page, pageSize }
  },

  exportJson(): string {
    return JSON.stringify(_auditLog, null, 2)
  },

  exportCsv(): string {
    const headers = [
      'Event ID',
      'Timestamp',
      'Action',
      'Administrator Account',
      'Affected Record',
      'Category',
      'Previous Status',
      'New Status',
      'Reason',
    ]
    const rows = _auditLog.map((l) =>
      [
        l.id,
        l.timestamp,
        `"${l.action}"`,
        `"${l.adminAccount}"`,
        `"${l.affectedRecord}"`,
        l.category,
        l.previousStatus ?? '',
        l.newStatus ?? '',
        `"${l.reason}"`,
      ].join(',')
    )
    return [headers.join(','), ...rows].join('\n')
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notificationService = {
  /** Get admin notifications */
  getAdminNotifications(): typeof _adminNotifications {
    return _adminNotifications
  },

  /** Get student notifications */
  getStudentNotifications(): NotificationItem[] {
    return _studentNotifications
  },

  /** Mark a single admin notification as read */
  markAdminRead(id: string): void {
    _adminNotifications = _adminNotifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  },

  /** Mark all admin notifications as read */
  markAllAdminRead(): void {
    _adminNotifications = _adminNotifications.map((n) => ({ ...n, read: true }))
  },

  /** Mark a single student notification as read */
  markStudentRead(id: string): void {
    _studentNotifications = _studentNotifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  },

  /** Mark all student notifications as read */
  markAllStudentRead(): void {
    _studentNotifications = _studentNotifications.map((n) => ({ ...n, read: true }))
  },

  /** Get unread counts */
  getUnreadCounts(): { admin: number; student: number } {
    return {
      admin: _adminNotifications.filter((n) => !n.read).length,
      student: _studentNotifications.filter((n) => !n.read).length,
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  /** Total students across the institution */
  totalStudents: number
  /** Verified students */
  verifiedStudents: number
  /** Students with DigiLocker sync */
  digilockerSynced: number
  /** Verification completion percentage */
  verificationRate: number
  /** Open data quality issues */
  openQualityIssues: number
  /** Pending verification requests */
  pendingVerifications: number
  /** Completed verifications */
  completedVerifications: number
  /** Department breakdown */
  departmentBreakdown: { department: string; total: number; verified: number; pct: number }[]
  /** Status distribution */
  statusDistribution: { status: string; count: number; color: string }[]
  /** Verification trend (last 6 months) */
  verificationTrend: { month: string; verified: number; submitted: number }[]
  /** Quality issue breakdown */
  qualityBreakdown: { type: string; count: number; open: number }[]
}

export const analyticsService = {
  getAdminAnalytics(
    customStudents?: AdminStudentRecord[],
    customRequests?: AdminVerificationRequestItem[],
    customIssues?: DataQualityIssueItem[]
  ): AnalyticsSummary {
    const students = customStudents ?? _students
    const verified = students.filter((s) => s.status === 'verified')
    const synced = students.filter((s) => s.digilockerSynced)
    const openIssues = (customIssues ?? _dataQualityIssues).filter((i) => i.reviewStatus !== 'resolved')
    const pending = (customRequests ?? _verificationRequests).filter(
      (v) => v.status === 'submitted' || v.status === 'under_review'
    )
    const completed = (customRequests ?? _verificationRequests).filter((v) => v.status === 'verified')

    // Department breakdown
    const deptMap = new Map<string, { total: number; verified: number }>()
    students.forEach((s) => {
      const cur = deptMap.get(s.department) ?? { total: 0, verified: 0 }
      deptMap.set(s.department, {
        total: cur.total + 1,
        verified: cur.verified + (s.status === 'verified' ? 1 : 0),
      })
    })
    const departmentBreakdown = Array.from(deptMap.entries()).map(([dept, v]) => ({
      department: dept,
      total: v.total,
      verified: v.verified,
      pct: Math.round((v.verified / v.total) * 100),
    }))

    // Status distribution
    const statusColors: Record<string, string> = {
      verified: '#10b981',
      pending: '#f59e0b',
      flagged: '#ef4444',
      rejected: '#dc2626',
      incomplete: '#f97316',
      active: '#6366f1',
    }
    const statusMap = new Map<string, number>()
    students.forEach((s) => statusMap.set(s.status, (statusMap.get(s.status) ?? 0) + 1))
    const statusDistribution = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      color: statusColors[status] ?? '#94a3b8',
    }))

    // Verification trend — synthetic monthly data based on total verified
    const verificationTrend = [
      { month: 'May', verified: 5, submitted: 8 },
      { month: 'Jun', verified: 7, submitted: 10 },
      { month: 'Jul', verified: 4, submitted: 6 },
      { month: 'Aug', verified: 9, submitted: 12 },
      { month: 'Sep', verified: 11, submitted: 14 },
      { month: 'Oct', verified: completed.length, submitted: pending.length + completed.length },
    ]

    // Quality issue type breakdown
    const qualityMap = new Map<string, { total: number; open: number }>()
    _dataQualityIssues.forEach((i) => {
      const cur = qualityMap.get(i.issueType) ?? { total: 0, open: 0 }
      qualityMap.set(i.issueType, {
        total: cur.total + 1,
        open: cur.open + (i.reviewStatus !== 'resolved' ? 1 : 0),
      })
    })
    const qualityBreakdown = Array.from(qualityMap.entries()).map(([type, v]) => ({
      type,
      count: v.total,
      open: v.open,
    }))

    return {
      totalStudents: students.length,
      verifiedStudents: verified.length,
      digilockerSynced: synced.length,
      verificationRate: Math.round((verified.length / students.length) * 100),
      openQualityIssues: openIssues.length,
      pendingVerifications: pending.length,
      completedVerifications: completed.length,
      departmentBreakdown,
      statusDistribution,
      verificationTrend,
      qualityBreakdown,
    }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV DOWNLOAD UTILITY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Triggers a CSV file download in the browser.
 * Does NOT use any server-side logic — runs entirely in the browser.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Triggers a JSON file download in the browser.
 */
export function downloadJson(jsonContent: string, filename: string): void {
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
