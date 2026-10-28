import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONAL DATABASE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export interface CollegeRecord {
  id: string
  code: string // e.g. "NIET-2006-AICTE"
  name: string
  state: string
  district: string
  type: string
  status: 'active' | 'approved' | 'pending_approval' | 'suspended'
  contactEmail: string
  adminUserId?: string
  departments?: string[]
  createdAt: string
}

export interface AdminInvitationRecord {
  id: string
  code: string
  createdByAdminId: string
  createdDate: string
  expiresAt: string
  used: boolean
  usedByEmail?: string
  usedAt?: string
}

export interface UserRecord {
  id: string
  fullName: string
  email: string
  username?: string
  role: 'student' | 'college_admin' | 'platform_admin'
  passwordHash: string // salt:hash (pbkdf2)
  createdAt: string
  apaarId?: string
  institutionName?: string
  institutionCode?: string
  collegeId?: string
  status?: 'active' | 'approved' | 'pending_approval' | 'suspended'
  securityQuestion?: string
  securityAnswerHash?: string // salt:hash (pbkdf2)
  failedLoginAttempts?: number
  lockoutUntil?: number
  employeeId?: string
  designation?: string
  invitationCodeUsed?: string
  approvedAt?: string
  approvedByAdminId?: string
  resetOtp?: {
    code: string
    expiresAt: number
  }
}

export interface StudentRecord {
  id: string // Unique internal student record ID e.g. "stu_niet_001"
  userId: string // Foreign key to users.id
  collegeId: string // Foreign key to colleges.id
  institutionName: string
  institutionCode: string
  fullName: string
  email: string
  apaarId?: string // 12-digit number when legitimately provided
  registrationNumber: string // College registration number e.g. "2021NIET0841"
  admissionNumber: string
  department: string
  course: string
  yearOfStudy: string
  academicYear?: string
  admissionYear?: string
  semester: string
  phone: string
  dob: string
  gender: string
  bloodGroup: string
  digilockerConnected: boolean
  verificationStatus: 'verified' | 'pending' | 'flagged' | 'rejected'
  createdAt: string
  lastSync?: string
}

export interface AcademicRecord {
  id: string
  studentId: string // Foreign key to StudentRecord.id
  collegeId: string // Foreign key to CollegeRecord.id
  registrationNumber: string
  studentName: string
  academicYear: string
  semester: string
  programme: string
  department: string
  examination: string
  sgpa: number
  cgpa: number
  creditsEarned: number
  totalCredits: number
  status: 'verified' | 'pending' | 'published'
  subjects: Array<{ code: string; name: string; credits: number; grade: string; marks: number }>
  uploadedByAdminId: string
  createdAt: string
  updatedAt: string
}

export interface DocumentRecord {
  id: string
  studentId: string // Foreign key to StudentRecord.id
  collegeId: string // Foreign key to CollegeRecord.id
  registrationNumber: string
  studentName: string
  title: string
  documentType: string
  fileName: string
  fileSize: string
  fileData?: string // Text or base64 data for secure download
  mimeType: string
  uploadDate: string
  uploadedBy: 'student' | 'college_admin'
  uploadedByAdminId?: string
  reviewStatus: 'accepted_for_verification' | 'pending_review' | 'under_review' | 'requires_correction' | 'rejected'
  correctionNotes?: string
  hashDigest: string
  verifiedAt?: string
}

export interface VerificationRequestRecord {
  id: string
  referenceNo: string
  studentId: string // Foreign key to StudentRecord.id
  collegeId: string // Foreign key to CollegeRecord.id
  registrationNumber: string
  studentName: string
  apaarId?: string
  recordTitle: string
  requestType: string
  purpose: string
  notes?: string
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'returned_for_correction'
  submittedDate: string
  reviewedByAdminId?: string
  reviewerNotes?: string
  reviewedDate?: string
  timeline: Array<{
    stage: string
    timestamp: string
    status: 'completed' | 'current' | 'pending'
    actor?: string
    note?: string
  }>
}

export interface NotificationRecord {
  id: string
  recipientRole: 'student' | 'college_admin' | 'platform_admin'
  recipientUserId?: string // Student or Admin user ID
  recipientCollegeId?: string // College ID for college-wide alerts
  title: string
  message: string
  type: 'document' | 'verification' | 'academic' | 'announcement' | 'security'
  date: string
  read: boolean
  actionUrl?: string
}

export interface AuditLogRecord {
  id: string
  collegeId?: string
  actorId: string
  actorName: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  details: string
  timestamp: string
}

export interface CollegeAnnouncementRecord {
  id: string
  collegeId: string
  title: string
  message: string
  publishedByAdminId: string
  publishedDate: string
}

export interface DatabaseSchema {
  colleges: CollegeRecord[]
  users: UserRecord[]
  students: StudentRecord[]
  academicRecords: AcademicRecord[]
  documents: DocumentRecord[]
  verificationRequests: VerificationRequestRecord[]
  notifications: NotificationRecord[]
  announcements?: CollegeAnnouncementRecord[]
  auditLogs: AuditLogRecord[]
  invitationCodes?: AdminInvitationRecord[]
  // Legacy compatibility
  studentProfiles?: any[]
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE SYSTEM & PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), 'server/data')
const DB_FILE = path.join(DATA_DIR, 'auth_database.json')

export function resolveDbFilePath(): string {
  const tmpDbFile = path.join('/tmp', 'auth_database.json')
  if (fs.existsSync(tmpDbFile)) return tmpDbFile

  const candidates = [
    DB_FILE,
    path.resolve(process.cwd(), 'server', 'data', 'auth_database.json'),
    path.resolve(process.cwd(), 'server/data/auth_database.json'),
    path.resolve(process.cwd(), 'IMPORTANT SIH/APAAR ID (1)/APAAR ID/server/data/auth_database.json'),
  ]
  try {
    const metaDir = (import.meta as any).dirname || path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
    candidates.push(path.join(metaDir, 'data', 'auth_database.json'))
    candidates.push(path.resolve(metaDir, '..', 'server', 'data', 'auth_database.json'))
    candidates.push(path.resolve(metaDir, 'server', 'data', 'auth_database.json'))
  } catch {}

  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }
  return DB_FILE
}

let dbCache: DatabaseSchema | null = null

// Helper for PBKDF2 Password Hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, originalHash] = stored.split(':')
    if (!salt || !originalHash) return false
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'))
  } catch {
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY QUESTION NORMALIZATION & HASHING (PBKDF2)
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeSecurityAnswer(answer: string): string {
  return (answer || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
}

export function hashSecurityAnswer(answer: string, customSalt?: string): string {
  const norm = normalizeSecurityAnswer(answer)
  const salt = customSalt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(norm, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifySecurityAnswer(providedAnswer: string, storedHashString?: string): boolean {
  try {
    if (!providedAnswer || !storedHashString) return false
    const [salt, expectedHash] = storedHashString.split(':')
    if (!salt || !expectedHash) return false
    const norm = normalizeSecurityAnswer(providedAnswer)
    const computedHash = crypto.pbkdf2Sync(norm, salt, 100000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(expectedHash, 'hex'))
  } catch {
    return false
  }
}

// Generates a mock SHA256 checksum digest
export function generateChecksum(content: string): string {
  return 'SHA256:' + crypto.createHash('sha256').update(content).digest('hex').slice(0, 32)
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLEGE-SPECIFIC DEPARTMENT CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_COLLEGE_DEPARTMENTS: Record<string, string[]> = {
  // VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY
  'col_1793115697005': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Medical Electronics',
  ],
  'col_1793120711999': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Medical Electronics',
  ],
  'AICTE -2026': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Medical Electronics',
  ],
  'AICTE-2026': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Medical Electronics',
  ],
  'AICTE-3456': [
    'Computer Science and Engineering',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Biomedical Engineering',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Civil Engineering',
  ],
  'AICTE -2027': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biomedical Engineering',
    'Medical Electronics',
  ],
  // NATIONAL INSTITUTE OF ENGINEERING & TECHNOLOGY (NIET)
  'col_niet_01': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence & Machine Learning',
    'Electronics and Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
  ],
  'NIET-2006-AICTE': [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence & Machine Learning',
    'Electronics and Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Biotechnology',
  ],
  // COIMBATORE INSTITUTE OF TECHNOLOGY (CIT)
  'col_cit_02': [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Chemical Engineering',
    'Civil Engineering',
  ],
  'CIT-1956-AICTE': [
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Chemical Engineering',
    'Civil Engineering',
  ],
  // R. V. COLLEGE OF ENGINEERING (RVCE)
  'col_rvce_03': [
    'Computer Science and Engineering',
    'Information Science and Engineering',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Aerospace Engineering',
    'Biotechnology',
  ],
  '1-4270909': [
    'Computer Science and Engineering',
    'Information Science and Engineering',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Aerospace Engineering',
    'Biotechnology',
  ],
  // KPR INSTITUTE OF ENGINEERING AND TECHNOLOGY
  'col_1793096977650': [
    'Computer Science and Engineering',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Biomedical Engineering',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Civil Engineering',
  ],
  'AICTE - 3456': [
    'Computer Science and Engineering',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Biomedical Engineering',
    'Mechanical Engineering',
    'Mechatronics Engineering',
    'Civil Engineering',
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL SEED DATA BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function createInitialSeed(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('Apaar@2026')
  const defaultSecuritySalt = 'c1a8d052b947e3f1'
  const defaultSecurityAnswerHash = hashSecurityAnswer('Kendriya Vidyalaya', defaultSecuritySalt)

  // Bootstrap Platform Administrator (Root Administrative Access)
  const users: UserRecord[] = [
    {
      id: 'usr_platform_admin_01',
      email: 'admin@aicte.gov.in',
      username: 'aicte_central_admin',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Anil Sahasrabudhe (Central Administration)',
      role: 'platform_admin',
      status: 'active',
      employeeId: 'AICTE-HQ-001',
      designation: 'Central Platform Administrator',
      securityQuestion: 'What was the name of your first school?',
      securityAnswerHash: defaultSecurityAnswerHash,
      failedLoginAttempts: 0,
      lockoutUntil: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]

  const invitationCodes: AdminInvitationRecord[] = [
    {
      id: 'inv_root_01',
      code: 'AICTE-ADMIN-ENROLL-2026',
      createdByAdminId: 'usr_platform_admin_01',
      createdDate: '2026-01-01T00:00:00.000Z',
      expiresAt: '2030-01-01T00:00:00.000Z',
      used: false,
    },
  ]

  return {
    colleges: [],
    users,
    students: [],
    academicRecords: [],
    documents: [],
    verificationRequests: [],
    notifications: [],
    announcements: [],
    auditLogs: [],
    invitationCodes,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTITUTION IDENTIFIER & NAME NORMALIZATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeInstitutionCode(code: string): string {
  if (!code) return ''
  return code
    .trim()
    .toUpperCase()
    .replace(/\s*([-\/._])\s*/g, '$1') // remove unnecessary spaces around hyphens/slashes/dots
    .replace(/\s+/g, ' ')
}

export function normalizeInstitutionName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE INITIALIZATION & CANONICAL COLLEGE RECONCILIATION
// ─────────────────────────────────────────────────────────────────────────────

export function reconcileAndMergeDuplicateColleges(db: DatabaseSchema): DatabaseSchema {
  if (!db || !Array.isArray(db.colleges)) return db

  const canonicalColleges: CollegeRecord[] = []
  const idRedirectionMap = new Map<string, CollegeRecord>()

  // 1. Deduplicate & establish canonical colleges
  for (const college of db.colleges) {
    const normCode = normalizeInstitutionCode(college.code)
    const normName = normalizeInstitutionName(college.name)

    // Search existing canonical entries for matching code or exact name
    let matchedCanonical = canonicalColleges.find((c) => {
      const cNormCode = normalizeInstitutionCode(c.code)
      const cNormName = normalizeInstitutionName(c.name)
      if (normCode && cNormCode && normCode === cNormCode) return true
      if (normName && cNormName && normName === cNormName) return true
      return false
    })

    if (!matchedCanonical) {
      college.code = normalizeInstitutionCode(college.code)
      college.name = college.name.trim()
      canonicalColleges.push(college)
      idRedirectionMap.set(college.id, college)
    } else {
      idRedirectionMap.set(college.id, matchedCanonical)

      // Merge configured departments
      if (Array.isArray(college.departments) && college.departments.length > 0) {
        if (!matchedCanonical.departments) matchedCanonical.departments = []
        for (const dept of college.departments) {
          const dTrim = dept.trim()
          if (dTrim && !matchedCanonical.departments.some((d) => d.toLowerCase() === dTrim.toLowerCase())) {
            matchedCanonical.departments.push(dTrim)
          }
        }
      }

      // Preserve status if any duplicate is active/approved
      if (college.status === 'active' || college.status === 'approved') {
        matchedCanonical.status = 'approved'
      }

      // Preserve adminUserId
      if (!matchedCanonical.adminUserId && college.adminUserId) {
        matchedCanonical.adminUserId = college.adminUserId
      }
    }
  }

  // Set canonical deduplicated list
  db.colleges = canonicalColleges

  // 2. Re-point child entities whose collegeId pointed to a merged duplicate
  // Students
  if (Array.isArray(db.students)) {
    for (const s of db.students) {
      if (s.collegeId && idRedirectionMap.has(s.collegeId)) {
        const canonical = idRedirectionMap.get(s.collegeId)!
        s.collegeId = canonical.id
        s.institutionName = canonical.name
        s.institutionCode = canonical.code
      } else {
        const sNormCode = normalizeInstitutionCode(s.institutionCode)
        const sNormName = normalizeInstitutionName(s.institutionName)
        const matched = canonicalColleges.find((c) => {
          if (sNormCode && normalizeInstitutionCode(c.code) === sNormCode) return true
          if (sNormName && normalizeInstitutionName(c.name) === sNormName) return true
          return false
        })
        if (matched) {
          s.collegeId = matched.id
          s.institutionName = matched.name
          s.institutionCode = matched.code
        }
      }
    }
  }

  // Users (Students & College Admins)
  if (Array.isArray(db.users)) {
    for (const u of db.users) {
      if (u.role === 'student') {
        const s = db.students.find((stu) => stu.userId === u.id || (u.apaarId && stu.apaarId === u.apaarId))
        if (s) {
          u.collegeId = s.collegeId
          u.institutionName = s.institutionName
          u.institutionCode = s.institutionCode
        }
      } else if (u.role === 'college_admin') {
        if (u.collegeId && idRedirectionMap.has(u.collegeId)) {
          const canonical = idRedirectionMap.get(u.collegeId)!
          u.collegeId = canonical.id
          u.institutionName = canonical.name
          u.institutionCode = canonical.code
        } else {
          const uNormCode = normalizeInstitutionCode(u.institutionCode || '')
          const uNormName = normalizeInstitutionName(u.institutionName || '')
          const matched = canonicalColleges.find((c) => {
            if (uNormCode && normalizeInstitutionCode(c.code) === uNormCode) return true
            if (uNormName && normalizeInstitutionName(c.name) === uNormName) return true
            return false
          })
          if (matched) {
            u.collegeId = matched.id
            u.institutionName = matched.name
            u.institutionCode = matched.code
          }
        }

        // If college has no active adminUserId or matches this user, associate
        if (u.collegeId) {
          const col = canonicalColleges.find((c) => c.id === u.collegeId)
          if (col && (!col.adminUserId || col.adminUserId === u.id)) {
            col.adminUserId = u.id
          }
        }
      }
    }
  }

  // Academic Records
  if (Array.isArray(db.academicRecords)) {
    for (const r of db.academicRecords) {
      if (r.collegeId && idRedirectionMap.has(r.collegeId)) {
        r.collegeId = idRedirectionMap.get(r.collegeId)!.id
      }
    }
  }

  // Documents
  if (Array.isArray(db.documents)) {
    for (const d of db.documents) {
      if (d.collegeId && idRedirectionMap.has(d.collegeId)) {
        d.collegeId = idRedirectionMap.get(d.collegeId)!.id
      }
    }
  }

  // Verification Requests
  if (Array.isArray(db.verificationRequests)) {
    for (const v of db.verificationRequests) {
      if (v.collegeId && idRedirectionMap.has(v.collegeId)) {
        v.collegeId = idRedirectionMap.get(v.collegeId)!.id
      }
    }
  }

  // Notifications
  if (Array.isArray(db.notifications)) {
    for (const n of db.notifications) {
      if (n.recipientCollegeId && idRedirectionMap.has(n.recipientCollegeId)) {
        n.recipientCollegeId = idRedirectionMap.get(n.recipientCollegeId)!.id
      }
    }
  }

  // Audit Logs
  if (Array.isArray(db.auditLogs)) {
    for (const a of db.auditLogs) {
      if (a.collegeId && idRedirectionMap.has(a.collegeId)) {
        a.collegeId = idRedirectionMap.get(a.collegeId)!.id
      }
    }
  }

  // Announcements
  if (Array.isArray(db.announcements)) {
    for (const ann of db.announcements) {
      if (ann.collegeId && idRedirectionMap.has(ann.collegeId)) {
        ann.collegeId = idRedirectionMap.get(ann.collegeId)!.id
      }
    }
  }

  return db
}

export function sanitizeDatabase(db: DatabaseSchema): DatabaseSchema {
  if (!db || !Array.isArray(db.colleges) || !Array.isArray(db.students)) return db

  // Reconcile and merge duplicate colleges dynamically
  reconcileAndMergeDuplicateColleges(db)

  // Ensure user records remain synchronized with canonical college
  if (Array.isArray(db.users)) {
    for (const u of db.users) {
      if (u.role === 'student') {
        const s = db.students.find((stu) => stu.userId === u.id || (u.apaarId && stu.apaarId === u.apaarId))
        if (s) {
          u.collegeId = s.collegeId
          u.institutionName = s.institutionName
          u.institutionCode = s.institutionCode
        } else if (u.collegeId) {
          const col = db.colleges.find((c) => c.id === u.collegeId)
          if (col) {
            u.institutionName = col.name
            u.institutionCode = col.code
          }
        }
      } else if (u.role === 'college_admin' && u.collegeId) {
        const col = db.colleges.find((c) => c.id === u.collegeId)
        if (col) {
          u.institutionName = col.name
          u.institutionCode = col.code
        }
      }
    }
  }

  // Ensure platform admin has security question, username and identification
  if (Array.isArray(db.users)) {
    const rootAdmin = db.users.find(
      (u) => u.id === 'usr_platform_admin_01' || u.email.toLowerCase() === 'admin@aicte.gov.in'
    )
    if (rootAdmin) {
      if (!rootAdmin.username) rootAdmin.username = 'aicte_central_admin'
      if (!rootAdmin.securityQuestion) rootAdmin.securityQuestion = 'What was the name of your first school?'
      if (!rootAdmin.securityAnswerHash) {
        rootAdmin.securityAnswerHash = hashSecurityAnswer('Kendriya Vidyalaya', 'c1a8d052b947e3f1')
      }
      if (!rootAdmin.employeeId) rootAdmin.employeeId = 'AICTE-HQ-001'
      if (!rootAdmin.designation) rootAdmin.designation = 'Central Platform Administrator'
      if (rootAdmin.failedLoginAttempts === undefined) rootAdmin.failedLoginAttempts = 0
      if (rootAdmin.lockoutUntil === undefined) rootAdmin.lockoutUntil = 0
      if (!rootAdmin.status) rootAdmin.status = 'active'
    }
  }

  // Ensure invitation codes array exists
  if (!Array.isArray(db.invitationCodes) || db.invitationCodes.length === 0) {
    db.invitationCodes = [
      {
        id: 'inv_root_01',
        code: 'AICTE-ADMIN-ENROLL-2026',
        createdByAdminId: 'usr_platform_admin_01',
        createdDate: '2026-01-01T00:00:00.000Z',
        expiresAt: '2030-01-01T00:00:00.000Z',
        used: false,
      },
    ]
  }

  return db
}

export function getDatabase(): DatabaseSchema {
  if (dbCache) return sanitizeDatabase(dbCache)

  const tmpDbFile = path.join('/tmp', 'auth_database.json')

  // Check /tmp first for serverless warm container
  if (fs.existsSync(tmpDbFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(tmpDbFile, 'utf-8'))
      if (parsed.colleges && parsed.students) {
        dbCache = sanitizeDatabase(parsed)
        return dbCache
      }
    } catch {}
  }

  // Check persistent DB_FILE and candidate paths
  const dbPath = resolveDbFilePath()
  if (fs.existsSync(dbPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
      if (parsed.colleges && parsed.students && parsed.academicRecords) {
        dbCache = sanitizeDatabase(parsed)
        // In serverless environments, mirror to /tmp for persistent mutations during container lifetime
        if (process.env.VERCEL) {
          try {
            fs.writeFileSync(tmpDbFile, JSON.stringify(dbCache, null, 2), 'utf-8')
          } catch {}
        }
        return dbCache
      }
      // Migrate legacy schema to relational schema
      dbCache = sanitizeDatabase(migrateLegacyDatabase(parsed))
      saveDatabase(dbCache)
      return dbCache
    } catch {}
  }

  // Otherwise, create fresh initial relational seed
  dbCache = sanitizeDatabase(createInitialSeed())
  saveDatabase(dbCache)
  return dbCache
}

export function saveDatabase(db: DatabaseSchema): void {
  dbCache = db
  const jsonStr = JSON.stringify(db, null, 2)

  // In Vercel serverless environments, the deployment directory is strictly read-only.
  // Directly persist to /tmp to avoid EROFS exceptions and ensure instant response times.
  if (process.env.VERCEL) {
    try {
      const tmpDbFile = path.join('/tmp', 'auth_database.json')
      fs.writeFileSync(tmpDbFile, jsonStr, 'utf-8')
      return
    } catch {
      // Kept in memory cache
      return
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, jsonStr, 'utf-8')
  } catch {
    try {
      const tmpDbFile = path.join('/tmp', 'auth_database.json')
      fs.writeFileSync(tmpDbFile, jsonStr, 'utf-8')
    } catch {
      // Kept in memory
    }
  }
}

function migrateLegacyDatabase(legacy: any): DatabaseSchema {
  const seed = createInitialSeed()
  const colleges = Array.isArray(legacy.colleges) ? legacy.colleges : []
  const users = Array.isArray(legacy.users) ? legacy.users : [...seed.users]
  const students = Array.isArray(legacy.students) ? legacy.students : []
  const academicRecords = Array.isArray(legacy.academicRecords) ? legacy.academicRecords : []
  const documents = Array.isArray(legacy.documents) ? legacy.documents : []
  const verificationRequests = Array.isArray(legacy.verificationRequests) ? legacy.verificationRequests : []
  const notifications = Array.isArray(legacy.notifications) ? legacy.notifications : []
  const announcements = Array.isArray(legacy.announcements) ? legacy.announcements : []
  const auditLogs = Array.isArray(legacy.auditLogs) ? legacy.auditLogs : []
  const invitationCodes = Array.isArray(legacy.invitationCodes) ? legacy.invitationCodes : [...(seed.invitationCodes || [])]

  return {
    colleges,
    users,
    students,
    academicRecords,
    documents,
    verificationRequests,
    notifications,
    announcements,
    auditLogs,
    invitationCodes,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONAL DATA ACCESS HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const dbService = {
  getDb(): DatabaseSchema {
    return getDatabase()
  },

  findCollegeById(id: string): CollegeRecord | undefined {
    const db = getDatabase()
    return db.colleges.find((c) => c.id === id)
  },

  findCollegeByCode(code: string): CollegeRecord | undefined {
    const db = getDatabase()
    if (!code) return undefined
    const norm = normalizeInstitutionCode(code)
    return db.colleges.find((c) => normalizeInstitutionCode(c.code) === norm)
  },

  findCollegeByName(name: string): CollegeRecord | undefined {
    const db = getDatabase()
    if (!name) return undefined
    const norm = normalizeInstitutionName(name)
    return db.colleges.find((c) => {
      const cNorm = normalizeInstitutionName(c.name)
      return cNorm === norm || cNorm.includes(norm) || norm.includes(cNorm)
    })
  },

  findMatchingCollege(query: { id?: string; code?: string; name?: string }): CollegeRecord | undefined {
    const db = getDatabase()
    if (query.id) {
      const col = db.colleges.find((c) => c.id === query.id)
      if (col) return col
    }
    if (query.code) {
      const normCode = normalizeInstitutionCode(query.code)
      if (normCode) {
        const col = db.colleges.find((c) => normalizeInstitutionCode(c.code) === normCode)
        if (col) return col
      }
    }
    if (query.name) {
      const normName = normalizeInstitutionName(query.name)
      if (normName) {
        const col = db.colleges.find((c) => {
          const cNorm = normalizeInstitutionName(c.name)
          return cNorm === normName || cNorm.includes(normName) || normName.includes(cNorm)
        })
        if (col) return col
      }
    }
    return undefined
  },

  findUserById(id: string): UserRecord | undefined {
    const db = getDatabase()
    return db.users.find((u) => u.id === id)
  },

  updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const db = getDatabase()
    const user = db.users.find((u) => u.id === id)
    if (!user) return undefined
    Object.assign(user, updates)
    saveDatabase(db)
    return user
  },

  findStudentByUserId(userId: string): StudentRecord | undefined {
    const db = getDatabase()
    return db.students.find((s) => s.userId === userId)
  },

  findStudentById(studentId: string): StudentRecord | undefined {
    const db = getDatabase()
    return db.students.find((s) => s.id === studentId)
  },

  findStudentByRegistrationNumber(collegeId: string, regNo: string): StudentRecord | undefined {
    const db = getDatabase()
    const cleanReg = (regNo || '').replace(/[\s-]+/g, '').toUpperCase()
    return db.students.find(
      (s) => s.collegeId === collegeId && (s.registrationNumber || '').replace(/[\s-]+/g, '').toUpperCase() === cleanReg
    )
  },

  getCollegeDepartments(collegeIdOrCode: string): string[] {
    const db = getDatabase()
    const clean = (collegeIdOrCode || '').trim()
    const normCode = normalizeInstitutionCode(clean)
    const college = db.colleges.find(
      (c) =>
        c.id === clean ||
        c.code.toLowerCase() === clean.toLowerCase() ||
        normalizeInstitutionCode(c.code) === normCode
    )

    if (college && Array.isArray(college.departments)) {
      return college.departments
    }

    // Default configuration for known recognized institutions
    const lookupKey = college ? college.id : clean
    const codeKey = college ? normalizeInstitutionCode(college.code) : normCode
    const defaults =
      DEFAULT_COLLEGE_DEPARTMENTS[lookupKey] ||
      DEFAULT_COLLEGE_DEPARTMENTS[codeKey] ||
      DEFAULT_COLLEGE_DEPARTMENTS[clean]

    if (defaults && defaults.length > 0) {
      return defaults
    }

    return []
  },

  updateCollegeDepartments(collegeId: string, departments: string[]): string[] {
    const db = getDatabase()
    const college = db.colleges.find((c) => c.id === collegeId)
    if (!college) return []
    college.departments = departments
      .map((d) => d.trim())
      .filter((d) => d.length > 0)
    saveDatabase(db)
    return college.departments
  },

  updateStudentProfile(userId: string, updates: Partial<StudentRecord>): StudentRecord | undefined {
    const db = getDatabase()
    const student = db.students.find((s) => s.userId === userId)
    if (!student) return undefined

    // Allowed student self-service profile updates
    if (updates.department && updates.department.trim()) {
      student.department = updates.department.trim()
    }
    if (updates.course && updates.course.trim()) {
      student.course = updates.course.trim()
    }
    if (updates.phone !== undefined) {
      student.phone = updates.phone.trim()
    }
    if (updates.bloodGroup && updates.bloodGroup.trim()) {
      student.bloodGroup = updates.bloodGroup.trim()
    }
    if (updates.dob && updates.dob.trim()) {
      student.dob = updates.dob.trim()
    }

    saveDatabase(db)
    return student
  },

  searchStudentsInCollege(
    collegeId: string,
    query: string,
    filters?: {
      department?: string
      academicYear?: string
      searchType?: 'registrationNumber' | 'apaarId' | 'all'
    }
  ): StudentRecord[] {
    const db = getDatabase()
    const rawQ = (query || '').trim()
    const q = rawQ.toLowerCase()
    const cleanDigits = rawQ.replace(/\D/g, '')
    const cleanRegQ = rawQ.replace(/[\s-]+/g, '').toUpperCase()
    const searchType = filters?.searchType || 'all'

    return db.students.filter((s) => {
      // 1. Mandatory College Isolation: Student must belong to this college's unique college_id
      if (s.collegeId !== collegeId) return false

      // 2. Department filter if provided
      if (filters?.department && filters.department !== 'all') {
        if (s.department.toLowerCase() !== filters.department.toLowerCase()) return false
      }

      // 3. Academic year or batch filter if provided
      if (filters?.academicYear && filters.academicYear !== 'all') {
        const matchesYear =
          (s.academicYear && s.academicYear.toLowerCase().includes(filters.academicYear.toLowerCase())) ||
          (s.admissionYear && String(s.admissionYear).includes(filters.academicYear))
        if (!matchesYear) return false
      }

      // 4. Query matching
      if (!rawQ) return true

      const studentApaarDigits = (s.apaarId || '').replace(/\D/g, '')
      const studentCleanReg = (s.registrationNumber || '').replace(/[\s-]+/g, '').toUpperCase()

      // Explicit Search Type: APAAR ID Search
      if (searchType === 'apaarId') {
        // Enforce 12-digit APAAR specification validation
        if (cleanDigits.length !== 12) return false
        return studentApaarDigits === cleanDigits
      }

      // Explicit Search Type: College Registration Number Search
      if (searchType === 'registrationNumber') {
        if (!cleanRegQ) return false
        return (
          studentCleanReg === cleanRegQ ||
          (cleanRegQ.length >= 3 && studentCleanReg.includes(cleanRegQ))
        )
      }

      // Default 'all'
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        studentCleanReg === cleanRegQ ||
        (cleanRegQ.length >= 3 && studentCleanReg.includes(cleanRegQ)) ||
        (cleanDigits.length >= 4 && studentApaarDigits.includes(cleanDigits)) ||
        (s.apaarId && s.apaarId.toLowerCase().includes(q)) ||
        s.department.toLowerCase().includes(q) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.academicYear && s.academicYear.toLowerCase().includes(q)) ||
        (s.admissionYear && String(s.admissionYear).includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      )
    })
  },

  getStudentDashboard(userId: string) {
    const db = getDatabase()
    const student = db.students.find((s) => s.userId === userId)
    if (!student) return null

    const college = db.colleges.find((c) => c.id === student.collegeId)
    if (college) {
      student.institutionName = college.name
      student.institutionCode = college.code
    }
    const academicRecords = db.academicRecords.filter((r) => r.studentId === student.id)
    const documents = db.documents.filter((d) => d.studentId === student.id)
    const verificationRequests = db.verificationRequests.filter((v) => v.studentId === student.id)
    // Strictly isolate notifications: specific student notifications must match recipientUserId
    const notifications = db.notifications.filter(
      (n) =>
        n.recipientUserId === userId ||
        (n.recipientRole === 'student' && n.recipientCollegeId === student.collegeId && !n.recipientUserId)
    )

    return {
      student,
      college,
      academicRecords,
      documents,
      verificationRequests,
      notifications,
    }
  },

  getCollegeDashboard(adminUser: UserRecord) {
    const db = getDatabase()
    const college = db.colleges.find(
      (c) =>
        c.adminUserId === adminUser.id ||
        (adminUser.collegeId && c.id === adminUser.collegeId) ||
        (adminUser.institutionCode && c.code.toLowerCase() === adminUser.institutionCode.toLowerCase())
    )
    if (!college) return null

    const students = db.students.filter((s) => s.collegeId === college.id)
    const academicRecords = db.academicRecords.filter((r) => r.collegeId === college.id)
    const documents = db.documents.filter((d) => d.collegeId === college.id)
    const verificationRequests = db.verificationRequests.filter((v) => v.collegeId === college.id)
    const notifications = db.notifications.filter(
      (n) => n.recipientCollegeId === college.id || n.recipientUserId === adminUser.id
    )
    const auditLogs = db.auditLogs.filter((a) => a.collegeId === college.id)

    const stats = {
      totalStudents: students.length,
      verifiedStudents: students.filter((s) => s.verificationStatus === 'verified').length,
      pendingVerifications: verificationRequests.filter((r) => r.status === 'pending').length,
      documentsRequiringCorrection: documents.filter((d) => d.reviewStatus === 'requires_correction').length,
      totalDocuments: documents.length,
      totalAcademicRecords: academicRecords.length,
    }

    return {
      college,
      students,
      academicRecords,
      documents,
      verificationRequests,
      notifications,
      auditLogs,
      stats,
    }
  },

  getPlatformDashboard() {
    const db = getDatabase()
    const stats = {
      totalColleges: db.colleges.length,
      approvedColleges: db.colleges.filter((c) => c.status === 'approved' || c.status === 'active').length,
      pendingColleges: db.colleges.filter((c) => c.status === 'pending_approval').length,
      totalStudents: db.students.length,
      totalDocuments: db.documents.length,
      totalVerificationRequests: db.verificationRequests.length,
      pendingVerificationRequests: db.verificationRequests.filter((r) => r.status === 'pending').length,
    }

    return {
      colleges: db.colleges,
      stats,
      recentAuditLogs: db.auditLogs.slice(-15),
    }
  },

  getCollegeDetailsForPlatform(collegeId: string) {
    const db = getDatabase()
    const college = db.colleges.find((c) => c.id === collegeId)
    if (!college) return null

    const students = db.students.filter((s) => s.collegeId === collegeId)
    const documents = db.documents.filter((d) => d.collegeId === collegeId)
    const academicRecords = db.academicRecords.filter((r) => r.collegeId === collegeId)
    const verificationRequests = db.verificationRequests.filter((r) => r.collegeId === collegeId)

    return {
      college,
      students,
      documents,
      academicRecords,
      verificationRequests,
    }
  },

  // Document Upload
  uploadDocument(params: {
    collegeId: string
    adminUserId: string
    studentRegistrationNumber?: string
    studentId?: string
    apaarId?: string
    title: string
    documentType: string
    fileName: string
    fileSize: string
    fileData?: string
    mimeType?: string
    marksheetDetails?: {
      semester: string
      academicYear?: string
      sgpa?: number
      cgpa?: number
      creditsEarned?: number
      totalCredits?: number
      examination?: string
      subjects?: { code: string; name: string; credits: number; grade: string; marks?: number }[]
    }
  }): { success: boolean; document?: DocumentRecord; academicRecord?: AcademicRecord; error?: string } {
    const db = getDatabase()
    const college = db.colleges.find((c) => c.id === params.collegeId)
    if (!college) return { success: false, error: 'Unauthorized college access' }

    // Validate file type (Allowed: pdf, png, jpg, jpeg, docx, doc, txt)
    const ext = path.extname(params.fileName).toLowerCase()
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc', '.txt']
    if (params.fileName && !allowedExts.includes(ext)) {
      return {
        success: false,
        error: `Invalid file format "${ext}". Allowed formats are PDF, PNG, JPG, JPEG, DOCX, DOC, and TXT.`,
      }
    }

    // Search student in THIS college by Registration Number, Student Database ID, or APAAR ID
    const normReg = (params.studentRegistrationNumber || '').replace(/[\s-]+/g, '').toUpperCase()
    const normApaar = (params.apaarId || params.studentRegistrationNumber || '').replace(/\D/g, '')
    const student = db.students.find(
      (s) =>
        s.collegeId === college.id &&
        (
          (normReg && (s.registrationNumber || '').replace(/[\s-]+/g, '').toUpperCase() === normReg) ||
          (params.studentId && s.id === params.studentId) ||
          (normApaar.length >= 4 && s.apaarId && s.apaarId.replace(/\D/g, '') === normApaar)
        )
    )

    if (!student) {
      const searchIdentifier = params.studentRegistrationNumber || params.apaarId || params.studentId || 'unknown'
      return {
        success: false,
        error: `No registered student found with identifier "${searchIdentifier}" in ${college.name}. Please confirm student enrollment before uploading official records.`,
      }
    }

    const docId = `doc_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const digest = generateChecksum(`${student.id}:${params.title}:${Date.now()}`)

    const newDoc: DocumentRecord = {
      id: docId,
      studentId: student.id,
      collegeId: college.id,
      registrationNumber: student.registrationNumber,
      studentName: student.fullName,
      title: params.title.trim(),
      documentType: params.documentType.trim(),
      fileName: params.fileName.trim(),
      fileSize: params.fileSize.trim() || '1.2 MB',
      fileData: params.fileData || `OFFICIAL DIGITAL ACADEMIC DOCUMENT\nTitle: ${params.title}\nStudent: ${student.fullName} (${student.registrationNumber})\nCollege: ${college.name}\nIssuing Authority: Office of the Registrar\nSeal: Cryptographically Verified`,
      mimeType: params.mimeType || 'application/pdf',
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'college_admin',
      uploadedByAdminId: params.adminUserId,
      reviewStatus: 'accepted_for_verification',
      hashDigest: digest,
      verifiedAt: new Date().toISOString(),
    }

    db.documents.push(newDoc)

    // Optional marksheet creation
    let newAcadRec: AcademicRecord | undefined
    if (params.marksheetDetails && params.marksheetDetails.semester) {
      const acadId = `acad_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      newAcadRec = {
        id: acadId,
        studentId: student.id,
        collegeId: college.id,
        registrationNumber: student.registrationNumber,
        studentName: student.fullName,
        academicYear: params.marksheetDetails.academicYear || '2024-2025',
        semester: params.marksheetDetails.semester,
        programme: student.course,
        department: student.department,
        examination: params.marksheetDetails.examination || 'Regular Semester Examination',
        sgpa: params.marksheetDetails.sgpa ?? 8.5,
        cgpa: params.marksheetDetails.cgpa ?? 8.5,
        creditsEarned: params.marksheetDetails.creditsEarned ?? 24,
        totalCredits: params.marksheetDetails.totalCredits ?? 24,
        status: 'published',
        subjects: (params.marksheetDetails.subjects || []).map((s: any) => ({
          code: s.code,
          name: s.name,
          credits: s.credits,
          grade: s.grade,
          marks: s.marks ?? 85,
        })),
        uploadedByAdminId: params.adminUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      db.academicRecords.push(newAcadRec)
    }

    // Create Notification specifically for this student per Section 4.A
    const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    db.notifications.unshift({
      id: notifId,
      recipientRole: 'student',
      recipientUserId: student.userId,
      recipientCollegeId: college.id,
      title: 'New Document Uploaded',
      message: `New Document Uploaded: Your college has uploaded your ${params.title}. Log in to your Student Portal to view and download it.`,
      type: 'document',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: false,
      actionUrl: '/student/documents',
    })

    // Audit log
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      collegeId: college.id,
      actorId: params.adminUserId,
      actorName: 'College Administrator',
      actorRole: 'college_admin',
      action: 'UPLOAD_STUDENT_DOCUMENT',
      targetType: 'DOCUMENT',
      targetId: docId,
      details: `Uploaded ${params.title} for student ${student.fullName} (${student.registrationNumber})`,
      timestamp: new Date().toISOString(),
    })

    saveDatabase(db)
    return { success: true, document: newDoc, academicRecord: newAcadRec }
  },

  // Document Review / Correction
  reviewDocument(params: {
    collegeId: string
    adminUserId: string
    documentId: string
    status: DocumentRecord['reviewStatus']
    correctionNotes?: string
  }): { success: boolean; document?: DocumentRecord; error?: string } {
    const db = getDatabase()
    const doc = db.documents.find((d) => d.id === params.documentId && d.collegeId === params.collegeId)
    if (!doc) return { success: false, error: 'Document not found or unauthorized' }

    doc.reviewStatus = params.status
    if (params.correctionNotes) doc.correctionNotes = params.correctionNotes
    if (params.status === 'accepted_for_verification') {
      doc.verifiedAt = new Date().toISOString()
    }

    const student = db.students.find((s) => s.id === doc.studentId)
    if (student) {
      let notifTitle = 'Certificate Update'
      let notifMessage = `Certificate Update: Your ${doc.title} status has been updated to "${params.status}".`

      if (params.status === 'accepted_for_verification') {
        notifTitle = 'Certificate Verified'
        notifMessage = `Certificate Verified: Your ${doc.title} has been verified. You can view its current status in your Student Portal.`
      } else if (params.status === 'rejected') {
        notifTitle = 'Certificate Update'
        notifMessage = `Certificate Update: Your ${doc.title} has been rejected.${params.correctionNotes ? ' Reason: ' + params.correctionNotes + '.' : ''} Please check the details and contact your college if clarification is required.`
      } else if (params.status === 'under_review' || params.status === 'pending_review') {
        notifTitle = 'Certificate Verification Pending'
        notifMessage = `Certificate Verification: Your ${doc.title} is awaiting verification.`
      } else if (params.status === 'requires_correction') {
        notifTitle = 'Certificate Requires Correction'
        notifMessage = `Certificate Update: Your ${doc.title} requires correction.${params.correctionNotes ? ' Details: ' + params.correctionNotes + '.' : ''} Please check the details and contact your college if clarification is required.`
      }

      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipientRole: 'student',
        recipientUserId: student.userId,
        recipientCollegeId: params.collegeId,
        title: notifTitle,
        message: notifMessage,
        type: 'document',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: false,
        actionUrl: '/student/documents',
      })
    }

    saveDatabase(db)
    return { success: true, document: doc }
  },

  // Submit Verification Request by Student
  submitVerificationRequest(params: {
    studentUserId: string
    recordTitle: string
    purpose: string
    notes?: string
  }): { success: boolean; request?: VerificationRequestRecord; error?: string } {
    const db = getDatabase()
    const student = db.students.find((s) => s.userId === params.studentUserId)
    if (!student) return { success: false, error: 'Student record not found' }

    const college = db.colleges.find((c) => c.id === student.collegeId)
    const collegeCode = college?.code || 'COLL'
    const shortCode = collegeCode.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()

    const reqId = `vreq_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    const refNo = `VR-${new Date().getFullYear()}-${shortCode}-${Math.floor(1000 + Math.random() * 9000)}`

    const newReq: VerificationRequestRecord = {
      id: reqId,
      referenceNo: refNo,
      studentId: student.id,
      collegeId: student.collegeId,
      registrationNumber: student.registrationNumber,
      studentName: student.fullName,
      apaarId: student.apaarId,
      recordTitle: params.recordTitle.trim(),
      requestType: 'Academic Verification',
      purpose: params.purpose.trim(),
      notes: params.notes?.trim() || '',
      status: 'pending',
      submittedDate: new Date().toISOString(),
      timeline: [
        {
          stage: 'Request Submitted by Student',
          timestamp: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          status: 'completed',
          actor: student.fullName,
        },
        {
          stage: 'Pending College Review',
          timestamp: 'In Queue',
          status: 'current',
        },
        {
          stage: 'Official Institutional Endorsement',
          timestamp: 'Pending',
          status: 'pending',
        },
      ],
    }

    db.verificationRequests.unshift(newReq)

    // Notify College Admin
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      recipientRole: 'college_admin',
      recipientCollegeId: student.collegeId,
      title: 'New Verification Request',
      message: `Student ${student.fullName} (${student.registrationNumber}) submitted verification request ${refNo} for "${params.recordTitle}".`,
      type: 'verification',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      read: false,
      actionUrl: '/admin/verifications',
    })

    saveDatabase(db)
    return { success: true, request: newReq }
  },

  // Review Verification Request by College Admin
  reviewVerificationRequest(params: {
    collegeId: string
    adminUserId: string
    requestId: string
    decision: 'approved' | 'rejected' | 'returned_for_correction'
    reviewerNotes?: string
  }): { success: boolean; request?: VerificationRequestRecord; error?: string } {
    const db = getDatabase()
    const req = db.verificationRequests.find((r) => r.id === params.requestId && r.collegeId === params.collegeId)
    if (!req) return { success: false, error: 'Verification request not found or unauthorized' }

    req.status = params.decision
    req.reviewedByAdminId = params.adminUserId
    req.reviewerNotes = params.reviewerNotes || (params.decision === 'approved' ? 'Physical ledger reconciled and endorsed.' : 'Verification rejected.')
    req.reviewedDate = new Date().toISOString()

    req.timeline.push({
      stage: params.decision === 'approved' ? 'Verification Approved & Signed' : `Verification ${params.decision}`,
      timestamp: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      note: req.reviewerNotes,
    })

    // Notify the Student per Section 4.B & 4.C
    const student = db.students.find((s) => s.id === req.studentId)
    if (student) {
      let notifTitle = 'Certificate Update'
      let notifMessage = `Certificate Update: Your ${req.recordTitle} status has been updated.`

      if (params.decision === 'approved') {
        notifTitle = 'Certificate Verified'
        notifMessage = `Certificate Verified: Your ${req.recordTitle} (${req.referenceNo}) has been verified. You can view its current status in your Student Portal.`
      } else if (params.decision === 'rejected') {
        notifTitle = 'Certificate Update'
        notifMessage = `Certificate Update: Your ${req.recordTitle} (${req.referenceNo}) has been rejected.${req.reviewerNotes ? ' Reason: ' + req.reviewerNotes + '.' : ''} Please check the details and contact your college if clarification is required.`
      } else if (params.decision === 'returned_for_correction') {
        notifTitle = 'Certificate Requires Correction'
        notifMessage = `Certificate Update: Your ${req.recordTitle} (${req.referenceNo}) requires correction.${req.reviewerNotes ? ' Details: ' + req.reviewerNotes + '.' : ''} Please check the details and contact your college if clarification is required.`
      }

      db.notifications.unshift({
        id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipientRole: 'student',
        recipientUserId: student.userId,
        recipientCollegeId: params.collegeId,
        title: notifTitle,
        message: notifMessage,
        type: 'verification',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        read: false,
        actionUrl: '/student/requests',
      })
    }

    // Audit log
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      collegeId: params.collegeId,
      actorId: params.adminUserId,
      actorName: 'College Administrator',
      actorRole: 'college_admin',
      action: `VERIFICATION_${params.decision.toUpperCase()}`,
      targetType: 'VERIFICATION_REQUEST',
      targetId: req.id,
      details: `${req.referenceNo} for ${req.studentName} marked ${params.decision}`,
      timestamp: new Date().toISOString(),
    })

    saveDatabase(db)
    return { success: true, request: req }
  },

  // College Announcements
  publishAnnouncement(params: {
    collegeId: string
    adminUserId: string
    title: string
    message: string
  }): { success: boolean; announcement?: CollegeAnnouncementRecord; error?: string } {
    const db = getDatabase()
    if (!db.announcements) db.announcements = []
    const ann: CollegeAnnouncementRecord = {
      id: `ann_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      collegeId: params.collegeId,
      title: params.title.trim(),
      message: params.message.trim(),
      publishedByAdminId: params.adminUserId,
      publishedDate: new Date().toISOString(),
    }
    db.announcements.unshift(ann)
    saveDatabase(db)
    return { success: true, announcement: ann }
  },

  getAnnouncementsForCollege(collegeId: string): CollegeAnnouncementRecord[] {
    const db = getDatabase()
    return (db.announcements || []).filter((a) => a.collegeId === collegeId)
  },

  // Mark Notification Read
  markNotificationRead(userId: string, notificationId: string): boolean {
    const db = getDatabase()
    const notif = db.notifications.find(
      (n) => n.id === notificationId && (n.recipientUserId === userId || !n.recipientUserId)
    )
    if (notif) {
      notif.read = true
      saveDatabase(db)
      return true
    }
    return false
  },

  markAllNotificationsRead(userId: string, collegeId?: string): boolean {
    const db = getDatabase()
    for (const n of db.notifications) {
      if (n.recipientUserId === userId || (collegeId && n.recipientCollegeId === collegeId)) {
        n.read = true
      }
    }
    saveDatabase(db)
    return true
  },

  // Platform Administrator Invitations & Enrollment
  createAdminInvitation(createdByAdminId: string, expiresInDays: number = 7, customCode?: string): AdminInvitationRecord {
    const db = getDatabase()
    if (!db.invitationCodes) db.invitationCodes = []
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase()
    const code = customCode ? customCode.trim().toUpperCase() : `AICTE-INV-${new Date().getFullYear()}-${randomSuffix}`
    const days = typeof expiresInDays === 'number' && !isNaN(expiresInDays) && expiresInDays > 0 ? expiresInDays : 7
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
    const inv: AdminInvitationRecord = {
      id: `inv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      code,
      createdByAdminId,
      createdDate: new Date().toISOString(),
      expiresAt,
      used: false,
    }
    db.invitationCodes.unshift(inv)
    saveDatabase(db)
    return inv
  },

  findAdminInvitation(code: string): AdminInvitationRecord | undefined {
    const db = getDatabase()
    const clean = (code || '').trim().toUpperCase()
    return (db.invitationCodes || []).find((i) => i.code.trim().toUpperCase() === clean)
  },

  markAdminInvitationUsed(code: string, email: string): boolean {
    const db = getDatabase()
    const clean = (code || '').trim().toUpperCase()
    const inv = (db.invitationCodes || []).find((i) => i.code.trim().toUpperCase() === clean)
    if (!inv || inv.used) return false
    inv.used = true
    inv.usedByEmail = email.trim().toLowerCase()
    inv.usedAt = new Date().toISOString()
    saveDatabase(db)
    return true
  },

  getPendingAdminRequests(): Array<Omit<UserRecord, 'passwordHash' | 'securityAnswerHash'>> {
    const db = getDatabase()
    return db.users
      .filter((u) => u.role === 'platform_admin' && u.status === 'pending_approval')
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        username: u.username,
        role: u.role,
        status: u.status,
        employeeId: u.employeeId,
        designation: u.designation,
        securityQuestion: u.securityQuestion,
        createdAt: u.createdAt,
      }))
  },

  approveAdminRequest(userId: string, approvedByAdminId: string): { success: boolean; user?: UserRecord; error?: string } {
    const db = getDatabase()
    const user = db.users.find((u) => u.id === userId && u.role === 'platform_admin')
    if (!user) return { success: false, error: 'Platform administrator request not found.' }
    if (user.status === 'active' || user.status === 'approved') {
      return { success: false, error: 'Administrator account is already active.' }
    }
    user.status = 'active'
    user.approvedAt = new Date().toISOString()
    user.approvedByAdminId = approvedByAdminId

    // Record in audit log
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      actorId: approvedByAdminId,
      actorName: 'AICTE Super Administrator',
      actorRole: 'platform_admin',
      action: 'ADMIN_ACCOUNT_APPROVED',
      targetType: 'PLATFORM_ADMIN_USER',
      targetId: user.id,
      details: `Platform Administrator enrollment approved for ${user.fullName} (${user.email})`,
      timestamp: new Date().toISOString(),
    })

    saveDatabase(db)
    return { success: true, user }
  },
}
