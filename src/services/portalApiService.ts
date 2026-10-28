/**
 * APAAR CONNECT AI — Portal API Service Layer
 * Connects frontend portals directly to the authenticated database backend
 */

import { authService } from './authService'
import type {
  AdminStudentRecord,
  AdminAcademicRecord,
  AdminDocumentReviewItem,
  AdminVerificationRequestItem,
  StudentProfileData,
  AcademicRecordItem,
  StudentDocumentItem,
  VerificationRequestItem,
  NotificationItem,
  PlatformInstitution,
} from '@/types'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const token = authService.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`)
  }

  return data as T
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT PORTAL API
// ─────────────────────────────────────────────────────────────────────────────

export interface StudentDashboardResponse {
  success: boolean
  student: StudentProfileData
  college: {
    id: string
    code: string
    name: string
    state: string
    district: string
    contactEmail: string
  }
  academicRecords: AcademicRecordItem[]
  documents: StudentDocumentItem[]
  verificationRequests: VerificationRequestItem[]
  notifications: NotificationItem[]
}

export const studentApi = {
  async getDashboard(): Promise<StudentDashboardResponse> {
    return request<StudentDashboardResponse>('/api/student/dashboard', { method: 'GET' })
  },

  async submitVerificationRequest(recordTitle: string, purpose: string, notes?: string): Promise<VerificationRequestItem> {
    const res = await request<{ success: boolean; request: VerificationRequestItem }>('/api/student/verification-requests', {
      method: 'POST',
      body: JSON.stringify({ recordTitle, purpose, notes }),
    })
    return res.request
  },

  async downloadDocument(documentId: string): Promise<{
    id: string
    title: string
    fileName: string
    fileSize: string
    fileData: string
    mimeType: string
    hashDigest: string
  }> {
    const res = await request<{
      success: boolean
      document: {
        id: string
        title: string
        fileName: string
        fileSize: string
        fileData: string
        mimeType: string
        hashDigest: string
      }
    }>(`/api/student/documents/${documentId}/download`, { method: 'GET' })
    return res.document
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/api/student/notifications/${id}/read`, { method: 'PUT' })
  },

  async markAllNotificationsRead(): Promise<void> {
    await request('/api/student/notifications/read-all', { method: 'PUT' })
  },

  async updateProfile(updates: Partial<StudentProfileData>): Promise<StudentProfileData> {
    const res = await request<{ success: boolean; student: StudentProfileData }>('/api/student/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return res.student
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLEGE MANAGEMENT PORTAL API
// ─────────────────────────────────────────────────────────────────────────────

export interface CollegeDashboardResponse {
  success: boolean
  college: {
    id: string
    code: string
    name: string
    state: string
    district: string
    type: string
    status: string
    contactEmail: string
    departments?: string[]
  }
  students: AdminStudentRecord[]
  academicRecords: AdminAcademicRecord[]
  documents: AdminDocumentReviewItem[]
  verificationRequests: AdminVerificationRequestItem[]
  notifications: Array<{
    id: string
    title: string
    message: string
    date: string
    type: 'verification' | 'update' | 'security' | 'reminder'
    read: boolean
    actionUrl?: string
  }>
  auditLogs: Array<{
    id: string
    actorName: string
    actorRole: string
    action: string
    targetType: string
    details: string
    timestamp: string
  }>
  stats: {
    totalStudents: number
    verifiedStudents: number
    pendingVerifications: number
    documentsRequiringCorrection: number
    totalDocuments: number
    totalAcademicRecords: number
  }
}

export interface StudentSearchResult {
  id: string
  fullName: string
  registrationNumber: string
  apaarId?: string
  department: string
  course: string
  yearOfStudy: string
  semester: string
  verificationStatus: string
}

export const collegeApi = {
  async getDashboard(): Promise<CollegeDashboardResponse> {
    return request<CollegeDashboardResponse>('/api/college/dashboard', { method: 'GET' })
  },

  async searchStudents(query: string, searchType: 'all' | 'registrationNumber' | 'apaarId' = 'all'): Promise<StudentSearchResult[]> {
    const params = new URLSearchParams()
    if (query) params.append('q', query)
    if (searchType && searchType !== 'all') params.append('searchType', searchType)
    const res = await request<{ success: boolean; students: StudentSearchResult[] }>(
      `/api/college/students/search?${params.toString()}`,
      { method: 'GET' }
    )
    return res.students
  },

  async updateDepartments(departments: string[]): Promise<string[]> {
    const res = await request<{ success: boolean; departments: string[] }>('/api/college/departments', {
      method: 'PUT',
      body: JSON.stringify({ departments }),
    })
    return res.departments
  },

  async uploadDocument(data: {
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
  }): Promise<{ success: boolean; message: string; document: AdminDocumentReviewItem; academicRecord?: AdminAcademicRecord }> {
    return request('/api/college/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async reviewDocument(
    documentId: string,
    status: AdminDocumentReviewItem['reviewStatus'],
    correctionNotes?: string
  ): Promise<AdminDocumentReviewItem> {
    const res = await request<{ success: boolean; document: AdminDocumentReviewItem }>(
      `/api/college/documents/${documentId}/review`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, correctionNotes }),
      }
    )
    return res.document
  },

  async reviewVerificationRequest(
    requestId: string,
    decision: 'approved' | 'rejected' | 'returned_for_correction',
    reviewerNotes?: string
  ): Promise<AdminVerificationRequestItem> {
    const res = await request<{ success: boolean; request: AdminVerificationRequestItem }>(
      `/api/college/verification-requests/${requestId}/review`,
      {
        method: 'PUT',
        body: JSON.stringify({ decision, reviewerNotes }),
      }
    )
    return res.request
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM ADMINISTRATION PORTAL API
// ─────────────────────────────────────────────────────────────────────────────

export interface PlatformDashboardResponse {
  success: boolean
  colleges: PlatformInstitution[]
  stats: {
    totalColleges: number
    approvedColleges: number
    pendingColleges: number
    totalStudents: number
    totalDocuments: number
    totalVerificationRequests: number
    pendingVerificationRequests: number
  }
  recentAuditLogs: Array<{
    id: string
    actorName: string
    action: string
    details: string
    timestamp: string
  }>
}

export interface CollegeDetailForPlatform {
  college: PlatformInstitution
  students: AdminStudentRecord[]
  documents: AdminDocumentReviewItem[]
  academicRecords: AdminAcademicRecord[]
  verificationRequests: AdminVerificationRequestItem[]
}

export const platformApi = {
  async getDashboard(): Promise<PlatformDashboardResponse> {
    return request<PlatformDashboardResponse>('/api/platform/dashboard', { method: 'GET' })
  },

  async getCollegeDetails(collegeId: string): Promise<CollegeDetailForPlatform> {
    return request<CollegeDetailForPlatform>(`/api/platform/colleges/${collegeId}/details`, { method: 'GET' })
  },

  async updateCollegeStatus(collegeId: string, status: string): Promise<void> {
    await request(`/api/platform/colleges/${collegeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC VERIFICATION API
// ─────────────────────────────────────────────────────────────────────────────

export interface PublicVerificationResponse {
  success: boolean
  verified: boolean
  message?: string
  record?: {
    fullName: string
    maskedApaar: string
    registrationNumber: string
    institutionName: string
    institutionCode: string
    department: string
    course: string
    status: string
    verifiedDocumentsCount: number
    lastVerifiedAt: string
  }
}

export const publicApi = {
  async verifyApaar(query: string): Promise<PublicVerificationResponse> {
    return request<PublicVerificationResponse>('/api/public/verify', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  },
}
