/**
 * Core Type Definitions for APAAR CONNECT AI
 * Automated Permanent Academic Account Registry & AICTE Verification Platform
 */

export type VerificationStatus = 'verified' | 'pending' | 'flagged' | 'rejected' | 'requires_review'

export interface StudentRecord {
  id: string
  apaarId: string // 12-digit unique APAAR ID (Automated Permanent Academic Account Registry)
  abcId?: string // Academic Bank of Credits ID
  fullName: string
  dob: string
  gender: 'Male' | 'Female' | 'Other'
  institutionCode: string // AICTE institution approval code
  institutionName: string
  course: string
  branch: string
  enrollmentYear: number
  currentSemester: number
  status: 'verified' | 'pending' | 'flagged' | 'rejected'
  digilockerSynced: boolean
  lastVerifiedAt?: string
  cgpa?: number
}

export interface InstitutionProfile {
  id: string
  aicteCode: string
  name: string
  state: string
  district: string
  type: 'Government' | 'Govt-Aided' | 'Private' | 'Autonomous'
  totalStudentsEnrolled: number
  verifiedApaarCount: number
  pendingVerificationCount: number
}

export interface VerificationFilterOptions {
  status?: VerificationStatus | 'all'
  searchQuery?: string
  course?: string
  batch?: string
}

export interface NavItem {
  label: string
  path: string
  icon: string
  badge?: string
}

// Student Dashboard Specific Types

export interface StudentProfileData {
  id: string
  fullName: string
  studentEmail: string
  institutionName: string
  institutionCode: string
  department: string
  course: string
  yearOfStudy: string
  registrationNumber: string
  apaarId: string
  abcId: string
  phone: string
  dob: string
  gender: 'Male' | 'Female' | 'Other'
  bloodGroup: string
  admissionCategory: string
  digilockerConnected: boolean
  lastSync: string
  currentSemester?: number | string
  degree?: string
  admissionYear?: string
  academicStatus?: string
  enrollmentVerificationStatus?: string
  avatarUrl?: string
}

export interface SubjectGrade {
  code: string
  name: string
  credits: number
  grade: string
  points: number
}

export interface AcademicRecordItem {
  id: string
  academicYear: string
  institution: string
  course: string
  semester: string
  examination: string
  resultGrade: string
  sgpa: number
  creditsEarned: number
  totalCredits: number
  status: 'verified' | 'pending' | 'requires_review' | 'rejected'
  verificationHash?: string
  issuingAuthority: string
  subjects: SubjectGrade[]
}

export interface StudentDocumentItem {
  id: string
  title: string
  type: 'Degree Certificate' | 'Semester Marksheet' | 'Migration Certificate' | 'Transfer Certificate' | 'APAAR Consent Form' | 'Identity Verification' | string
  fileName: string
  fileSize: string
  uploadDate: string
  status: 'verified' | 'pending' | 'requires_review' | 'rejected' | 'missing'
  remarks?: string
  canRemove: boolean
  hashDigest?: string
  availability?: 'Available' | 'Issued by College' | 'Pending Verification' | 'Correction Required' | 'Missing'
  correctionReason?: string
  correctionInstructions?: string
}

export interface RequestTimelineStage {
  stage: string
  timestamp: string
  status: 'completed' | 'current' | 'pending'
  note?: string
}

export interface VerificationRequestItem {
  id: string
  referenceNo: string
  recordTitle: string
  purpose: string
  submissionDate: string
  status: 'submitted' | 'under_review' | 'digilocker_check' | 'verified' | 'flagged' | 'rejected'
  lastUpdated: string
  timeline: RequestTimelineStage[]
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  date: string
  type: 'verification' | 'reminder' | 'update' | 'security'
  read: boolean
  actionUrl?: string
}

// ==========================================
// College Administrator Dashboard Types
// ==========================================

export interface AdminStudentRecord {
  id: string
  registrationNumber: string
  fullName: string
  email: string
  phone: string
  institutionName?: string
  department: string
  programme: string
  academicYear: string
  currentSemester: number
  apaarId: string
  abcId: string
  status: 'verified' | 'pending' | 'rejected' | 'incomplete' | 'flagged' | 'active'
  cgpa: number
  digilockerSynced: boolean
  enrolmentDate: string
  missingFields?: string[]
  rejectionReason?: string
}

export interface AdminAcademicRecord {
  id: string
  studentId: string
  studentName: string
  registrationNumber: string
  department: string
  programme: string
  academicYear: string
  semester: string
  examination: string
  sgpa: number
  creditsEarned: number
  totalCredits: number
  status: 'verified' | 'pending' | 'requires_review' | 'rejected' | 'incomplete'
  isIncomplete?: boolean
  missingFields?: string[]
  issuingAuthority: string
  lastUpdated: string
}

export interface AdminDocumentReviewItem {
  id: string
  studentId: string
  studentName: string
  registrationNumber: string
  department: string
  documentType: string
  fileName: string
  fileSize: string
  uploadDate: string
  reviewStatus: 'pending_review' | 'under_review' | 'accepted_for_verification' | 'requires_correction' | 'rejected'
  correctionNotes?: string
  rejectionReason?: string
  reviewer?: string
  checksum: string
}

export interface AdminVerificationRequestItem {
  id: string
  referenceNo: string
  studentId: string
  studentName: string
  registrationNumber: string
  academicRecordType: string
  submissionDate: string
  status: 'submitted' | 'under_review' | 'accepted_for_verification' | 'requires_info' | 'verified' | 'flagged' | 'rejected'
  assignedReviewer: string
  lastUpdated: string
  internalNotes?: string
  decisionReason?: string
  timeline: { stage: string; timestamp: string; status: 'completed' | 'current' | 'pending'; actor?: string; note?: string }[]
}

export interface DataQualityIssueItem {
  id: string
  issueType: 'Missing Fields' | 'Duplicate Reg Number' | 'Duplicate Record' | 'Invalid Date Format' | 'Missing Academic Document' | 'Inconsistent Programme' | 'Document-Record Mismatch'
  affectedRecord: string
  studentName: string
  registrationNumber: string
  severity: 'high' | 'medium' | 'low'
  explanation: string
  suggestedCorrection: string
  reviewStatus: 'open' | 'under_review' | 'resolved'
  detectedAt: string
}

export interface AuditLogItem {
  id: string
  action: string
  adminAccount: string
  affectedRecord: string
  timestamp: string
  previousStatus?: string
  newStatus?: string
  reason: string
  category: 'student' | 'academic' | 'document' | 'verification' | 'quality'
}

// ==========================================
// Stage 6: Platform Administrator Types
// ==========================================

export interface PlatformInstitution {
  id: string
  aicteCode: string
  name: string
  type: 'Autonomous' | 'Government' | 'Govt-Aided' | 'Private'
  state: string
  district: string
  city: string
  registrarName: string
  registrarEmail: string
  phone: string
  status: 'active' | 'pending_approval' | 'suspended' | 'under_review'
  onboardingDate: string
  totalEnrolled: number
  verifiedCount: number
  complianceScore: number
  naacAccreditation: string
  suspensionReason?: string
}

export interface PlatformMetricStats {
  totalStudents: number
  totalInstitutions: number
  totalVerificationRequests: number
  verifiedRecords: number
  pendingRecords: number
  rejectedRecords: number
  incompleteRecords: number
  activeInstitutions: number
  suspendedInstitutions: number
}

export interface PlatformMonitoringService {
  id: string
  serviceName: string
  endpoint: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  uptimePercent: number
  lastIncident?: string
}

export interface PlatformLogEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  severity: 'info' | 'warning' | 'critical'
  details: string
}

// ==========================================
// Stage 7: AI-Assisted Data Quality & Anomaly Types
// ==========================================

export interface QualityScoringBreakdown {
  recordId: string
  studentName: string
  registrationNumber: string
  overallScore: number
  grade: 'A+' | 'A' | 'B' | 'C' | 'Needs Attention'
  deductions: {
    ruleId: string
    description: string
    pointsDeducted: number
    category: 'missing' | 'format' | 'consistency' | 'duplicate'
  }[]
  recommendations: string[]
  calculatedAt: string
}

export interface AnomalyFlagItem {
  id: string
  affectedRecordId: string
  recordType: 'Student' | 'Academic Record' | 'Document' | 'Institution'
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'duplicate_identifier' | 'academic_discrepancy' | 'rapid_resubmission' | 'format_mismatch' | 'unverified_institution'
  explanation: string
  recommendedReviewAction: string
  status: 'flagged' | 'under_review' | 'resolved' | 'dismissed_as_false_positive'
  reviewedBy?: string
  reviewedAt?: string
  resolutionNotes?: string
}

export interface OcrExtractedField {
  fieldName: string
  extractedValue: string
  studentRecordValue: string
  confidencePercent: number
  isMatch: boolean
  humanOverride?: string
}

export interface OcrExtractionRecord {
  id: string
  documentTitle: string
  sampleFileName: string
  documentType: 'Semester Marksheet' | 'Degree Certificate' | 'APAAR Consent Form'
  previewUrl?: string
  extractedFields: OcrExtractedField[]
  humanConfirmed: boolean
  status: 'pending_review' | 'confirmed_match' | 'discrepancy_flagged'
  reviewedBy?: string
}

// ==========================================
// Stage 8: Secure Verification & Controlled Sharing Types
// ==========================================

export interface SharingConsentRequest {
  id: string
  referenceCode: string
  studentId: string
  studentName: string
  apaarId: string
  requesterName: string
  requesterType: 'Employer' | 'Higher Education' | 'Government Agency' | 'Financial/Scholarship'
  purpose: string
  requestedFields: string[]
  status: 'pending_consent' | 'approved' | 'rejected' | 'revoked' | 'expired'
  requestedAt: string
  expiresAt: string
  consentGivenAt?: string
  revokedAt?: string
  temporaryAccessToken?: string
  verificationHash?: string
}

export interface VerificationAuditTrailItem {
  id: string
  timestamp: string
  eventType: 'request_initiated' | 'consent_granted' | 'consent_denied' | 'credentials_accessed' | 'consent_revoked'
  actor: string
  details: string
  ipSubnetHash: string
}
