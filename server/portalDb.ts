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
  createdAt: string
}

export interface UserRecord {
  id: string
  fullName: string
  email: string
  role: 'student' | 'college_admin' | 'platform_admin'
  passwordHash: string // salt:hash (pbkdf2)
  createdAt: string
  apaarId?: string
  institutionName?: string
  institutionCode?: string
  collegeId?: string
  status?: 'active' | 'approved' | 'pending_approval' | 'suspended'
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

export interface DatabaseSchema {
  colleges: CollegeRecord[]
  users: UserRecord[]
  students: StudentRecord[]
  academicRecords: AcademicRecord[]
  documents: DocumentRecord[]
  verificationRequests: VerificationRequestRecord[]
  notifications: NotificationRecord[]
  auditLogs: AuditLogRecord[]
  // Legacy compatibility
  studentProfiles?: any[]
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE SYSTEM & PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), 'server/data')
const DB_FILE = path.join(DATA_DIR, 'auth_database.json')

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

// Generates a mock SHA256 checksum digest
export function generateChecksum(content: string): string {
  return 'SHA256:' + crypto.createHash('sha256').update(content).digest('hex').slice(0, 32)
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL SEED DATA BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function createInitialSeed(): DatabaseSchema {
  const defaultPasswordHash = hashPassword('Apaar@2026')

  // Colleges
  const colleges: CollegeRecord[] = [
    {
      id: 'col_niet_01',
      code: 'NIET-2006-AICTE',
      name: 'National Institute of Engineering & Technology',
      state: 'Uttar Pradesh',
      district: 'Gautam Buddha Nagar',
      type: 'Autonomous Technical Campus',
      status: 'approved',
      contactEmail: 'registrar@niet.edu.in',
      adminUserId: 'usr_college_admin_01',
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'col_cit_02',
      code: 'CIT-1956-AICTE',
      name: 'Coimbatore Institute of Technology',
      state: 'Tamil Nadu',
      district: 'Coimbatore',
      type: 'Government-Aided Autonomous Institution',
      status: 'approved',
      contactEmail: 'registrar@cit.edu.in',
      adminUserId: 'usr_college_admin_02',
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'col_rvce_03',
      code: '1-4270909',
      name: 'R. V. College of Engineering',
      state: 'Karnataka',
      district: 'Bengaluru Urban',
      type: 'Private Autonomous Engineering College',
      status: 'approved',
      contactEmail: 'registrar@rvce.edu.in',
      adminUserId: 'usr_col_1792905896285',
      createdAt: '2026-02-10T10:00:00.000Z',
    },
  ]

  // Users
  const users: UserRecord[] = [
    {
      id: 'usr_platform_admin_01',
      fullName: 'Dr. Anil Sahasrabudhe (Central Administration)',
      email: 'admin@aicte.gov.in',
      role: 'platform_admin',
      passwordHash: defaultPasswordHash,
      status: 'active',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'usr_college_admin_01',
      fullName: 'Dr. S. K. Kulkarni',
      email: 'registrar@niet.edu.in',
      role: 'college_admin',
      collegeId: 'col_niet_01',
      institutionName: 'National Institute of Engineering & Technology',
      institutionCode: 'NIET-2006-AICTE',
      passwordHash: defaultPasswordHash,
      status: 'approved',
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'usr_college_admin_02',
      fullName: 'Dr. V. Radhakrishnan',
      email: 'registrar@cit.edu.in',
      role: 'college_admin',
      collegeId: 'col_cit_02',
      institutionName: 'Coimbatore Institute of Technology',
      institutionCode: 'CIT-1956-AICTE',
      passwordHash: defaultPasswordHash,
      status: 'approved',
      createdAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'usr_student_01',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@student.niet.edu.in',
      apaarId: '210420241234',
      role: 'student',
      collegeId: 'col_niet_01',
      institutionName: 'National Institute of Engineering & Technology',
      institutionCode: 'NIET-2006-AICTE',
      passwordHash: defaultPasswordHash,
      status: 'active',
      createdAt: '2026-01-20T10:00:00.000Z',
    },
    {
      id: 'usr_student_02',
      fullName: 'Riya Sen',
      email: 'riya.sen@student.niet.edu.in',
      apaarId: '210420241235',
      role: 'student',
      collegeId: 'col_niet_01',
      institutionName: 'National Institute of Engineering & Technology',
      institutionCode: 'NIET-2006-AICTE',
      passwordHash: defaultPasswordHash,
      status: 'active',
      createdAt: '2026-01-20T11:00:00.000Z',
    },
    {
      id: 'usr_student_03',
      fullName: 'Pooja Hegde',
      email: 'pooja.hegde@student.cit.edu.in',
      apaarId: '989443768456',
      role: 'student',
      collegeId: 'col_cit_02',
      institutionName: 'Coimbatore Institute of Technology',
      institutionCode: 'CIT-1956-AICTE',
      passwordHash: defaultPasswordHash,
      status: 'active',
      createdAt: '2026-01-21T09:00:00.000Z',
    },
    {
      id: 'usr_student_04',
      fullName: 'Rohan Varma',
      email: 'rohan.varma@student.cit.edu.in',
      apaarId: '989443768457',
      role: 'student',
      collegeId: 'col_cit_02',
      institutionName: 'Coimbatore Institute of Technology',
      institutionCode: 'CIT-1956-AICTE',
      passwordHash: defaultPasswordHash,
      status: 'active',
      createdAt: '2026-01-21T10:00:00.000Z',
    },
  ]

  // Students Table
  const students: StudentRecord[] = [
    {
      id: 'stu_niet_001',
      userId: 'usr_student_01',
      collegeId: 'col_niet_01',
      institutionName: 'National Institute of Engineering & Technology',
      institutionCode: 'NIET-2006-AICTE',
      fullName: 'Aarav Sharma',
      email: 'aarav.sharma@student.niet.edu.in',
      apaarId: '210420241234',
      registrationNumber: '2021NIET0841',
      admissionNumber: 'ADM20210841',
      department: 'Computer Science & Engineering',
      course: 'B.Tech — Computer Science & Engineering',
      yearOfStudy: '4th Year (Final Year)',
      semester: 'Semester 7',
      phone: '+91 98765 43210',
      dob: '15 Aug 2003',
      gender: 'Male',
      bloodGroup: 'B+',
      digilockerConnected: true,
      verificationStatus: 'verified',
      createdAt: '2026-01-20T10:00:00.000Z',
      lastSync: '27/10/2026, 10:45:00 AM',
    },
    {
      id: 'stu_niet_002',
      userId: 'usr_student_02',
      collegeId: 'col_niet_01',
      institutionName: 'National Institute of Engineering & Technology',
      institutionCode: 'NIET-2006-AICTE',
      fullName: 'Riya Sen',
      email: 'riya.sen@student.niet.edu.in',
      apaarId: '210420241235',
      registrationNumber: '2021NIET0842',
      admissionNumber: 'ADM20210842',
      department: 'Information Technology',
      course: 'B.Tech — Information Technology',
      yearOfStudy: '4th Year',
      semester: 'Semester 7',
      phone: '+91 98765 43211',
      dob: '22 Nov 2003',
      gender: 'Female',
      bloodGroup: 'O+',
      digilockerConnected: true,
      verificationStatus: 'verified',
      createdAt: '2026-01-20T11:00:00.000Z',
      lastSync: '27/10/2026, 11:00:00 AM',
    },
    {
      id: 'stu_cit_001',
      userId: 'usr_student_03',
      collegeId: 'col_cit_02',
      institutionName: 'Coimbatore Institute of Technology',
      institutionCode: 'CIT-1956-AICTE',
      fullName: 'Pooja Hegde',
      email: 'pooja.hegde@student.cit.edu.in',
      apaarId: '989443768456',
      registrationNumber: '2021CIT0101',
      admissionNumber: 'ADM2021CIT0101',
      department: 'Electrical & Electronics Engineering',
      course: 'B.E. — Electrical & Electronics Engineering',
      yearOfStudy: '3rd Year',
      semester: 'Semester 5',
      phone: '+91 98401 23456',
      dob: '05 Mar 2004',
      gender: 'Female',
      bloodGroup: 'A+',
      digilockerConnected: false,
      verificationStatus: 'pending',
      createdAt: '2026-01-21T09:00:00.000Z',
      lastSync: '27/10/2026, 09:30:00 AM',
    },
    {
      id: 'stu_cit_002',
      userId: 'usr_student_04',
      collegeId: 'col_cit_02',
      institutionName: 'Coimbatore Institute of Technology',
      institutionCode: 'CIT-1956-AICTE',
      fullName: 'Rohan Varma',
      email: 'rohan.varma@student.cit.edu.in',
      apaarId: '989443768457',
      registrationNumber: '2021CIT0102',
      admissionNumber: 'ADM2021CIT0102',
      department: 'Mechanical Engineering',
      course: 'B.E. — Mechanical Engineering',
      yearOfStudy: '3rd Year',
      semester: 'Semester 5',
      phone: '+91 98401 65432',
      dob: '12 Jul 2004',
      gender: 'Male',
      bloodGroup: 'B-',
      digilockerConnected: true,
      verificationStatus: 'verified',
      createdAt: '2026-01-21T10:00:00.000Z',
      lastSync: '27/10/2026, 10:15:00 AM',
    },
  ]

  // Academic Records (Marksheets)
  const academicRecords: AcademicRecord[] = [
    {
      id: 'acad_rec_001',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      academicYear: '2023-2024',
      semester: 'Semester 6',
      programme: 'B.Tech — Computer Science & Engineering',
      department: 'Computer Science & Engineering',
      examination: 'April-May 2024 Regular',
      sgpa: 8.85,
      cgpa: 8.72,
      creditsEarned: 24,
      totalCredits: 24,
      status: 'published',
      subjects: [
        { code: 'CS601', name: 'Machine Learning & Neural Networks', credits: 4, grade: 'A+', marks: 91 },
        { code: 'CS602', name: 'Cloud Computing Architecture', credits: 4, grade: 'A', marks: 86 },
        { code: 'CS603', name: 'Compiler Design', credits: 4, grade: 'A', marks: 84 },
        { code: 'CS604', name: 'Cryptography & Cyber Security', credits: 4, grade: 'A+', marks: 93 },
        { code: 'CS605', name: 'Web Services & API Design Lab', credits: 4, grade: 'O', marks: 96 },
        { code: 'CS606', name: 'Capstone Phase 1 Project', credits: 4, grade: 'O', marks: 98 },
      ],
      uploadedByAdminId: 'usr_college_admin_01',
      createdAt: '2026-06-15T10:00:00.000Z',
      updatedAt: '2026-06-15T10:00:00.000Z',
    },
    {
      id: 'acad_rec_002',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      academicYear: '2023-2024',
      semester: 'Semester 5',
      programme: 'B.Tech — Computer Science & Engineering',
      department: 'Computer Science & Engineering',
      examination: 'Nov-Dec 2023 Regular',
      sgpa: 8.65,
      cgpa: 8.69,
      creditsEarned: 24,
      totalCredits: 24,
      status: 'published',
      subjects: [
        { code: 'CS501', name: 'Design and Analysis of Algorithms', credits: 4, grade: 'A', marks: 85 },
        { code: 'CS502', name: 'Operating Systems & Linux Kernel', credits: 4, grade: 'A+', marks: 89 },
        { code: 'CS503', name: 'Computer Networks Protocols', credits: 4, grade: 'A', marks: 84 },
        { code: 'CS504', name: 'Database Management Systems', credits: 4, grade: 'A+', marks: 92 },
        { code: 'CS505', name: 'Algorithms & DBMS Lab', credits: 4, grade: 'O', marks: 95 },
        { code: 'CS506', name: 'Industrial Internship Evaluation', credits: 4, grade: 'O', marks: 94 },
      ],
      uploadedByAdminId: 'usr_college_admin_01',
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'acad_rec_003',
      studentId: 'stu_cit_001',
      collegeId: 'col_cit_02',
      registrationNumber: '2021CIT0101',
      studentName: 'Pooja Hegde',
      academicYear: '2023-2024',
      semester: 'Semester 4',
      programme: 'B.E. — Electrical & Electronics Engineering',
      department: 'Electrical & Electronics Engineering',
      examination: 'April 2024 Regular',
      sgpa: 8.45,
      cgpa: 8.38,
      creditsEarned: 22,
      totalCredits: 22,
      status: 'published',
      subjects: [
        { code: 'EE401', name: 'Electrical Machines II', credits: 4, grade: 'A', marks: 82 },
        { code: 'EE402', name: 'Control Systems Engineering', credits: 4, grade: 'A', marks: 85 },
        { code: 'EE403', name: 'Power Electronics', credits: 4, grade: 'A+', marks: 88 },
        { code: 'EE404', name: 'Linear Integrated Circuits', credits: 4, grade: 'B+', marks: 78 },
        { code: 'EE405', name: 'Control Systems Lab', credits: 3, grade: 'O', marks: 94 },
        { code: 'EE406', name: 'Power Electronics Lab', credits: 3, grade: 'A+', marks: 90 },
      ],
      uploadedByAdminId: 'usr_college_admin_02',
      createdAt: '2026-06-20T10:00:00.000Z',
      updatedAt: '2026-06-20T10:00:00.000Z',
    },
  ]

  // Documents
  const documents: DocumentRecord[] = [
    {
      id: 'doc_niet_001',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      title: 'Class 10 (Secondary) Passing Certificate',
      documentType: 'Secondary Certificate',
      fileName: 'Aarav_Sharma_Class10_Certificate.pdf',
      fileSize: '1.2 MB',
      mimeType: 'application/pdf',
      uploadDate: '2026-01-20',
      uploadedBy: 'college_admin',
      uploadedByAdminId: 'usr_college_admin_01',
      reviewStatus: 'accepted_for_verification',
      hashDigest: 'SHA256:4b9a1c8e2f0d5a3c7b6e9f1a0d4c8b2e',
      verifiedAt: '2026-01-22T14:30:00.000Z',
      correctionNotes: 'Verified against Central Board Secondary database.',
    },
    {
      id: 'doc_niet_002',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      title: 'Class 12 (Higher Secondary) Marksheet',
      documentType: 'Higher Secondary Certificate',
      fileName: 'Aarav_Sharma_Class12_Marksheet.pdf',
      fileSize: '1.4 MB',
      mimeType: 'application/pdf',
      uploadDate: '2026-01-20',
      uploadedBy: 'college_admin',
      uploadedByAdminId: 'usr_college_admin_01',
      reviewStatus: 'accepted_for_verification',
      hashDigest: 'SHA256:7c1d3e5f8a0b2c4e6d9f1a3b5c7e0d2f',
      verifiedAt: '2026-01-22T14:35:00.000Z',
      correctionNotes: 'Physical original attested by admissions committee.',
    },
    {
      id: 'doc_niet_003',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      title: 'Semester 4 Official Grade Card',
      documentType: 'Semester Marksheet',
      fileName: 'Aarav_Sharma_Sem4_GradeCard.pdf',
      fileSize: '980 KB',
      mimeType: 'application/pdf',
      uploadDate: '2026-02-14',
      uploadedBy: 'college_admin',
      uploadedByAdminId: 'usr_college_admin_01',
      reviewStatus: 'requires_correction',
      hashDigest: 'SHA256:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
      correctionNotes: 'Digital copy scan signature block clipped on bottom right. Registrar office must upload verified physical scan.',
    },
    {
      id: 'doc_cit_001',
      studentId: 'stu_cit_001',
      collegeId: 'col_cit_02',
      registrationNumber: '2021CIT0101',
      studentName: 'Pooja Hegde',
      title: 'Higher Secondary Passing Certificate',
      documentType: 'Higher Secondary Certificate',
      fileName: 'Pooja_Hegde_HSC_Certificate.pdf',
      fileSize: '1.3 MB',
      mimeType: 'application/pdf',
      uploadDate: '2026-01-22',
      uploadedBy: 'college_admin',
      uploadedByAdminId: 'usr_college_admin_02',
      reviewStatus: 'accepted_for_verification',
      hashDigest: 'SHA256:8899aabbccddeeff0011223344556677',
      verifiedAt: '2026-01-25T11:00:00.000Z',
      correctionNotes: 'Verified by CIT Registrar.',
    },
  ]

  // Verification Requests
  const verificationRequests: VerificationRequestRecord[] = [
    {
      id: 'vreq_niet_001',
      referenceNo: 'VR-2026-NIET-8841',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      apaarId: '210420241234',
      recordTitle: 'Semester 6 Official Academic Transcript',
      requestType: 'Academic Transcript Endorsement',
      purpose: 'GATE 2026 / Higher Education Application',
      notes: 'Applying for post-graduate enrollment. Need verified seal from controller of examinations.',
      status: 'approved',
      submittedDate: '2026-07-02T10:30:00.000Z',
      reviewedByAdminId: 'usr_college_admin_01',
      reviewerNotes: 'Reconciled against institutional examination ledger. Official digital endorsement completed.',
      reviewedDate: '2026-07-04T15:20:00.000Z',
      timeline: [
        { stage: 'Request Submitted by Student', timestamp: '02 Jul 2026, 10:30 AM', status: 'completed', actor: 'Aarav Sharma' },
        { stage: 'Registrar Document Scrutiny', timestamp: '03 Jul 2026, 02:15 PM', status: 'completed', actor: 'Dr. S. K. Kulkarni' },
        { stage: 'Exam Ledger Verification', timestamp: '04 Jul 2026, 11:00 AM', status: 'completed', actor: 'Controller of Examinations' },
        { stage: 'Approved & Cryptographically Signed', timestamp: '04 Jul 2026, 03:20 PM', status: 'completed', actor: 'Dr. S. K. Kulkarni' },
      ],
    },
    {
      id: 'vreq_niet_002',
      referenceNo: 'VR-2026-NIET-8842',
      studentId: 'stu_niet_001',
      collegeId: 'col_niet_01',
      registrationNumber: '2021NIET0841',
      studentName: 'Aarav Sharma',
      apaarId: '210420241234',
      recordTitle: 'Class 12 Higher Secondary Migration Endorsement',
      requestType: 'Migration Endorsement',
      purpose: 'Inter-University Research Exchange',
      notes: 'Required for summer semester research fellowship.',
      status: 'pending',
      submittedDate: '2026-10-26T09:15:00.000Z',
      timeline: [
        { stage: 'Request Submitted by Student', timestamp: '26 Oct 2026, 09:15 AM', status: 'completed', actor: 'Aarav Sharma' },
        { stage: 'Awaiting College Registrar Review', timestamp: '26 Oct 2026, 09:15 AM', status: 'current' },
        { stage: 'Verification Decision', timestamp: 'Pending', status: 'pending' },
      ],
    },
    {
      id: 'vreq_cit_001',
      referenceNo: 'VR-2026-CIT-1001',
      studentId: 'stu_cit_001',
      collegeId: 'col_cit_02',
      registrationNumber: '2021CIT0101',
      studentName: 'Pooja Hegde',
      apaarId: '989443768456',
      recordTitle: 'Semester 4 Grade Card Verification',
      requestType: 'Grade Card Verification',
      purpose: 'State Scholarship Scheme Renewal',
      notes: 'Need college seal for scholarship renewal portal.',
      status: 'pending',
      submittedDate: '2026-10-25T11:00:00.000Z',
      timeline: [
        { stage: 'Request Submitted by Student', timestamp: '25 Oct 2026, 11:00 AM', status: 'completed', actor: 'Pooja Hegde' },
        { stage: 'Under Review by CIT Registrar', timestamp: '25 Oct 2026, 11:30 AM', status: 'current' },
        { stage: 'Final Endorsement', timestamp: 'Pending', status: 'pending' },
      ],
    },
  ]

  // Notifications
  const notifications: NotificationRecord[] = [
    {
      id: 'notif_001',
      recipientRole: 'student',
      recipientUserId: 'usr_student_01',
      recipientCollegeId: 'col_niet_01',
      title: 'Verification Request Approved',
      message: 'Your verification request VR-2026-NIET-8841 for "Semester 6 Official Academic Transcript" has been approved by the College Registrar.',
      type: 'verification',
      date: '04 Jul 2026',
      read: true,
      actionUrl: '/student/requests',
    },
    {
      id: 'notif_002',
      recipientRole: 'student',
      recipientUserId: 'usr_student_01',
      recipientCollegeId: 'col_niet_01',
      title: 'Document Correction Required',
      message: 'College Registrar flagged "Semester 4 Official Grade Card" for correction: Signature block clipped on digital scan.',
      type: 'document',
      date: '14 Feb 2026',
      read: false,
      actionUrl: '/student/documents',
    },
    {
      id: 'notif_003',
      recipientRole: 'student',
      recipientUserId: 'usr_student_01',
      recipientCollegeId: 'col_niet_01',
      title: 'Institutional Circular',
      message: 'Semester 7 final examination schedule and APAAR credit synchronization notice published by Dean Office.',
      type: 'announcement',
      date: '25 Oct 2026',
      read: false,
      actionUrl: '/student/records',
    },
    {
      id: 'notif_004',
      recipientRole: 'college_admin',
      recipientUserId: 'usr_college_admin_01',
      recipientCollegeId: 'col_niet_01',
      title: 'New Verification Request Submitted',
      message: 'Student Aarav Sharma (2021NIET0841) submitted a verification request for "Class 12 Higher Secondary Migration Endorsement".',
      type: 'verification',
      date: '26 Oct 2026',
      read: false,
      actionUrl: '/admin/verifications',
    },
    {
      id: 'notif_cit_001',
      recipientRole: 'student',
      recipientUserId: 'usr_student_03',
      recipientCollegeId: 'col_cit_02',
      title: 'CIT Admission Credential Verified',
      message: 'Your Higher Secondary Passing Certificate has been validated by Coimbatore Institute of Technology Registrar.',
      type: 'document',
      date: '25 Jan 2026',
      read: true,
      actionUrl: '/student/documents',
    },
  ]

  // Audit Logs
  const auditLogs: AuditLogRecord[] = [
    {
      id: 'aud_001',
      collegeId: 'col_niet_01',
      actorId: 'usr_college_admin_01',
      actorName: 'Dr. S. K. Kulkarni',
      actorRole: 'College Registrar',
      action: 'APPROVE_VERIFICATION',
      targetType: 'VERIFICATION_REQUEST',
      targetId: 'vreq_niet_001',
      details: 'Approved transcript verification for Aarav Sharma (2021NIET0841). Ledger reconciled.',
      timestamp: '2026-07-04T15:20:00.000Z',
    },
    {
      id: 'aud_002',
      collegeId: 'col_niet_01',
      actorId: 'usr_college_admin_01',
      actorName: 'Dr. S. K. Kulkarni',
      actorRole: 'College Registrar',
      action: 'FLAG_DOCUMENT_CORRECTION',
      targetType: 'DOCUMENT',
      targetId: 'doc_niet_003',
      details: 'Flagged Semester 4 Grade Card for Aarav Sharma: Clipped signature block.',
      timestamp: '2026-02-14T11:00:00.000Z',
    },
  ]

  return {
    colleges,
    users,
    students,
    academicRecords,
    documents,
    verificationRequests,
    notifications,
    auditLogs,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE INITIALIZATION & MIGRATION
// ─────────────────────────────────────────────────────────────────────────────

export function getDatabase(): DatabaseSchema {
  if (dbCache) return dbCache

  const tmpDbFile = path.join('/tmp', 'auth_database.json')

  // Check /tmp first for serverless warm container
  if (fs.existsSync(tmpDbFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(tmpDbFile, 'utf-8'))
      if (parsed.colleges && parsed.students) {
        dbCache = parsed
        return dbCache!
      }
    } catch {}
  }

  // Check persistent DB_FILE
  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
      if (parsed.colleges && parsed.students && parsed.academicRecords) {
        dbCache = parsed
        return dbCache!
      }
      // Migrate legacy schema to relational schema
      dbCache = migrateLegacyDatabase(parsed)
      saveDatabase(dbCache)
      return dbCache
    } catch {}
  }

  // Otherwise, create fresh initial relational seed
  dbCache = createInitialSeed()
  saveDatabase(dbCache)
  return dbCache
}

export function saveDatabase(db: DatabaseSchema): void {
  dbCache = db
  const jsonStr = JSON.stringify(db, null, 2)

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
  const mergedUsers = [...seed.users]
  const mergedStudents = [...seed.students]

  if (Array.isArray(legacy.users)) {
    for (const u of legacy.users) {
      if (!mergedUsers.some((x) => x.id === u.id || x.email.toLowerCase() === u.email.toLowerCase())) {
        mergedUsers.push(u)
      }
    }
  }

  if (Array.isArray(legacy.studentProfiles)) {
    for (const p of legacy.studentProfiles) {
      const user = mergedUsers.find((u) => u.id === p.userId || (p.apaarId && u.apaarId === p.apaarId))
      const college = seed.colleges.find(
        (c) =>
          c.code.toLowerCase() === (p.institutionCode || '').toLowerCase() ||
          c.name.toLowerCase().includes((p.institutionName || '').toLowerCase())
      ) || seed.colleges[0]

      if (!mergedStudents.some((s) => s.id === p.id || s.userId === p.userId || s.registrationNumber === p.registrationNumber)) {
        mergedStudents.push({
          id: p.id || `stu_${Date.now()}`,
          userId: user?.id || p.userId || `usr_${Date.now()}`,
          collegeId: college.id,
          institutionName: college.name,
          institutionCode: college.code,
          fullName: p.fullName,
          email: p.email || (user ? user.email : ''),
          apaarId: p.apaarId,
          registrationNumber: p.registrationNumber || `REG${p.apaarId?.slice(-6) || '1000'}`,
          admissionNumber: `ADM${p.registrationNumber || '1000'}`,
          department: p.department || 'Engineering & Technology',
          course: p.course || 'Undergraduate Degree',
          yearOfStudy: p.yearOfStudy || '1st Year',
          semester: 'Semester 1',
          phone: p.phone || '',
          dob: p.dob || '01 Jan 2004',
          gender: p.gender || 'Other',
          bloodGroup: p.bloodGroup || 'Unknown',
          digilockerConnected: Boolean(p.digilockerConnected),
          verificationStatus: 'verified',
          createdAt: new Date().toISOString(),
          lastSync: p.lastSync,
        })
      }
    }
  }

  return {
    colleges: seed.colleges,
    users: mergedUsers,
    students: mergedStudents,
    academicRecords: seed.academicRecords,
    documents: seed.documents,
    verificationRequests: seed.verificationRequests,
    notifications: seed.notifications,
    auditLogs: seed.auditLogs,
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
    const clean = code.trim().toLowerCase()
    return db.colleges.find((c) => c.code.trim().toLowerCase() === clean)
  },

  findUserById(id: string): UserRecord | undefined {
    const db = getDatabase()
    return db.users.find((u) => u.id === id)
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
    const cleanReg = regNo.trim().toUpperCase()
    return db.students.find(
      (s) => s.collegeId === collegeId && s.registrationNumber.trim().toUpperCase() === cleanReg
    )
  },

  searchStudentsInCollege(collegeId: string, query: string): StudentRecord[] {
    const db = getDatabase()
    const q = (query || '').trim().toLowerCase()
    return db.students.filter((s) => {
      if (s.collegeId !== collegeId) return false
      if (!q) return true
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q) ||
        (s.apaarId && s.apaarId.includes(q)) ||
        s.department.toLowerCase().includes(q)
      )
    })
  },

  getStudentDashboard(userId: string) {
    const db = getDatabase()
    const student = db.students.find((s) => s.userId === userId)
    if (!student) return null

    const college = db.colleges.find((c) => c.id === student.collegeId)
    const academicRecords = db.academicRecords.filter((r) => r.studentId === student.id)
    const documents = db.documents.filter((d) => d.studentId === student.id)
    const verificationRequests = db.verificationRequests.filter((v) => v.studentId === student.id)
    const notifications = db.notifications.filter(
      (n) =>
        n.recipientUserId === userId ||
        (n.recipientRole === 'student' && n.recipientCollegeId === student.collegeId)
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
    studentRegistrationNumber: string
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
    }
  }): { success: boolean; document?: DocumentRecord; academicRecord?: AcademicRecord; error?: string } {
    const db = getDatabase()
    const college = db.colleges.find((c) => c.id === params.collegeId)
    if (!college) return { success: false, error: 'Unauthorized college access' }

    // Search student in THIS college
    const cleanReg = params.studentRegistrationNumber.trim().toUpperCase()
    const student = db.students.find(
      (s) => s.collegeId === college.id && s.registrationNumber.trim().toUpperCase() === cleanReg
    )

    if (!student) {
      return {
        success: false,
        error: `No registered student found with Registration Number "${params.studentRegistrationNumber}" in ${college.name}. Please confirm student enrollment before uploading official records.`,
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
        subjects: [
          { code: 'AC01', name: `${params.title} - Module 1`, credits: 4, grade: 'A+', marks: 92 },
          { code: 'AC02', name: `${params.title} - Module 2`, credits: 4, grade: 'A', marks: 88 },
          { code: 'AC03', name: 'Practical & Laboratory Assessment', credits: 4, grade: 'O', marks: 95 },
        ],
        uploadedByAdminId: params.adminUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      db.academicRecords.push(newAcadRec)
    }

    // Create Notification specifically for this student
    const notifId = `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    db.notifications.unshift({
      id: notifId,
      recipientRole: 'student',
      recipientUserId: student.userId,
      recipientCollegeId: college.id,
      title: 'New Official Document Uploaded',
      message: `Your college administration (${college.name}) has uploaded an official academic record: "${params.title}" (${params.documentType}). It is now available in your portal.`,
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
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        recipientRole: 'student',
        recipientUserId: student.userId,
        recipientCollegeId: params.collegeId,
        title: params.status === 'accepted_for_verification' ? 'Document Verified' : 'Document Review Notice',
        message: `Your document "${doc.title}" has been updated to "${params.status}" by the college registrar.${params.correctionNotes ? ' Remarks: ' + params.correctionNotes : ''}`,
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

    // Notify the Student
    const student = db.students.find((s) => s.id === req.studentId)
    if (student) {
      db.notifications.unshift({
        id: `notif_${Date.now()}`,
        recipientRole: 'student',
        recipientUserId: student.userId,
        recipientCollegeId: params.collegeId,
        title: `Verification Request ${params.decision === 'approved' ? 'Approved' : 'Updated'}`,
        message: `Your request (${req.referenceNo}) for "${req.recordTitle}" was ${params.decision} by the College Registrar. ${req.reviewerNotes ? 'Remarks: ' + req.reviewerNotes : ''}`,
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
}
