/**
 * APAAR CONNECT AI — Bulk Document Management Service
 * Department-wise bulk student document upload, validation, storage,
 * missing-document detection, and Student Portal synchronisation.
 *
 * ARCHITECTURE NOTE:
 * This service operates in the same demonstration-mode pattern as
 * appDataService.ts — all mutations are in-memory and all side-effects
 * are reflected via localStorage + CustomEvent so the Student Portal
 * tab reacts in real time.  Backend integration requires replacing the
 * in-memory arrays with real API / storage calls; no component changes
 * are required.
 */

import * as XLSX from 'xlsx'
import type { AdminStudentRecord, AuditLogItem } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export const SUPPORTED_DEPARTMENTS = [
  'AI & Data Science',
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Mechanical Engineering',
] as const

export type Department = (typeof SUPPORTED_DEPARTMENTS)[number]

export const REQUIRED_DOCUMENTS: Record<string, string[]> = {
  default: [
    'Birth Certificate',
    '10th Marksheet',
    '12th Marksheet',
    'Community Certificate',
  ],
  'Semester 1': ['Semester 1 Marksheet'],
  'Semester 2': ['Semester 1 Marksheet', 'Semester 2 Marksheet'],
  'Semester 3': ['Semester 1 Marksheet', 'Semester 2 Marksheet', 'Semester 3 Marksheet'],
  'Semester 4': ['Semester 1 Marksheet', 'Semester 2 Marksheet', 'Semester 3 Marksheet', 'Semester 4 Marksheet'],
  'Semester 5': ['Semester 1 Marksheet', 'Semester 2 Marksheet', 'Semester 3 Marksheet', 'Semester 4 Marksheet', 'Semester 5 Marksheet'],
  'Semester 6': ['Semester 1 Marksheet', 'Semester 2 Marksheet', 'Semester 3 Marksheet', 'Semester 4 Marksheet', 'Semester 5 Marksheet', 'Semester 6 Marksheet'],
  'Semester 7': ['Semester 1 Marksheet', 'Semester 2 Marksheet', 'Semester 3 Marksheet', 'Semester 4 Marksheet', 'Semester 5 Marksheet', 'Semester 6 Marksheet', 'Semester 7 Marksheet'],
  'Semester 8': ['Semester 1 Marksheet', 'Semester 2 Marksheet', 'Semester 3 Marksheet', 'Semester 4 Marksheet', 'Semester 5 Marksheet', 'Semester 6 Marksheet', 'Semester 7 Marksheet', 'Semester 8 Marksheet'],
}

export const ACCEPTED_DOCUMENT_TYPES = [
  'Birth Certificate',
  'Community Certificate',
  'Income Certificate',
  'First Graduate Certificate',
  '10th Marksheet',
  '12th Marksheet',
  'Semester 1 Marksheet',
  'Semester 2 Marksheet',
  'Semester 3 Marksheet',
  'Semester 4 Marksheet',
  'Semester 5 Marksheet',
  'Semester 6 Marksheet',
  'Semester 7 Marksheet',
  'Semester 8 Marksheet',
  'Transfer Certificate',
  'Migration Certificate',
  'Conduct Certificate',
  'Scholarship Certificate',
  'Sports Certificate',
  'Extra-curricular Certificate',
  'Degree Certificate',
  'Other',
]

const MAX_FILE_SIZE_MB = 10

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SpreadsheetRow {
  apaarId: string
  registerNumber: string
  studentName: string
  department: string
  academicYear: string
  semester: string
  documentType: string
  certificateNumber?: string
  issuingAuthority?: string
  rawRow: number
}

export interface UploadedDocumentFile {
  file: File
  name: string
  sizeBytes: number
  inferredDocumentType?: string
}

export type BulkRowValidationStatus =
  | 'valid'
  | 'student_not_found'
  | 'dept_mismatch'
  | 'duplicate'
  | 'missing_fields'
  | 'invalid_doc_type'
  | 'conflict'
  | 'missing_file'
  | 'manual_review'

export interface ValidatedBulkRow {
  row: SpreadsheetRow
  status: BulkRowValidationStatus
  matchedStudent: AdminStudentRecord | null
  matchedFile: UploadedDocumentFile | null
  errors: string[]
  warnings: string[]
}

export interface BulkValidationSummary {
  totalRows: number
  validRows: number
  studentMatches: number
  validDocuments: number
  unmatchedStudents: number
  duplicateRows: number
  invalidRows: number
  missingFiles: number
  manualReview: number
  rows: ValidatedBulkRow[]
}

export interface StoredBulkDocument {
  id: string
  studentId: string
  apaarId: string
  registerNumber: string
  department: string
  institutionCode: string
  documentType: string
  certificateNumber?: string
  issuingAuthority?: string
  fileName: string
  fileSizeBytes: number
  fileDataUrl: string
  uploadDate: string
  uploadedBy: string
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'requires_correction'
  publicationStatus: 'draft' | 'published' | 'unpublished'
  version: number
  auditHistory: { at: string; by: string; action: string; note?: string }[]
}

export interface StudentDocumentStatusReport {
  student: AdminStudentRecord
  required: string[]
  uploaded: StoredBulkDocument[]
  missing: string[]
  underReview: StoredBulkDocument[]
  verified: StoredBulkDocument[]
  requiresCorrection: StoredBulkDocument[]
  published: StoredBulkDocument[]
}

// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY STORE
// ─────────────────────────────────────────────────────────────────────────────

let _bulkDocuments: StoredBulkDocument[] = []
let _bulkAuditLog: AuditLogItem[] = []

export const getBulkDocuments = (): StoredBulkDocument[] => [..._bulkDocuments]
export const getBulkAuditLog = (): AuditLogItem[] => [..._bulkAuditLog]

// ─────────────────────────────────────────────────────────────────────────────
// SPREADSHEET PARSING
// ─────────────────────────────────────────────────────────────────────────────

const COLUMN_ALIASES: Record<string, keyof SpreadsheetRow> = {
  'apaar id': 'apaarId',
  'apaarid': 'apaarId',
  'apaar_id': 'apaarId',
  'register number': 'registerNumber',
  'reg number': 'registerNumber',
  'reg no': 'registerNumber',
  'regno': 'registerNumber',
  'registration number': 'registerNumber',
  'registerno': 'registerNumber',
  'student name': 'studentName',
  'name': 'studentName',
  'full name': 'studentName',
  'department': 'department',
  'dept': 'department',
  'academic year': 'academicYear',
  'acadyear': 'academicYear',
  'year': 'academicYear',
  'semester': 'semester',
  'sem': 'semester',
  'document type': 'documentType',
  'doc type': 'documentType',
  'doctype': 'documentType',
  'certificate number': 'certificateNumber',
  'cert no': 'certificateNumber',
  'certno': 'certificateNumber',
  'issuing authority': 'issuingAuthority',
  'issued by': 'issuingAuthority',
}

function normaliseColumnName(raw: string): keyof SpreadsheetRow | null {
  const key = raw.trim().toLowerCase()
  return COLUMN_ALIASES[key] ?? null
}

export async function parseSpreadsheet(file: File): Promise<{ rows: SpreadsheetRow[]; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array', cellText: true, cellDates: false })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          defval: '',
        }) as unknown[][]

        if (raw.length < 2) {
          resolve({ rows: [], errors: ['Spreadsheet has no data rows.'] })
          return
        }

        const headerRow = (raw[0] as string[]).map((h) => String(h))
        const columnMap: Map<number, keyof SpreadsheetRow> = new Map()

        headerRow.forEach((header, colIdx) => {
          const field = normaliseColumnName(header)
          if (field) columnMap.set(colIdx, field)
        })

        const missingRequired: (keyof SpreadsheetRow)[] = []
        for (const req of ['apaarId', 'registerNumber', 'studentName', 'documentType'] as (keyof SpreadsheetRow)[]) {
          if (![...columnMap.values()].includes(req)) missingRequired.push(req)
        }

        if (missingRequired.length > 0) {
          resolve({
            rows: [],
            errors: [
              `Required columns not found: ${missingRequired.join(', ')}. ` +
                'Use headers: APAAR ID, Register Number, Student Name, Document Type.',
            ],
          })
          return
        }

        const rows: SpreadsheetRow[] = []
        const rowErrors: string[] = []

        for (let r = 1; r < raw.length; r++) {
          const cells = raw[r] as string[]
          if (cells.every((c) => !String(c).trim())) continue

          const obj: Partial<SpreadsheetRow> = { rawRow: r + 1 }
          columnMap.forEach((field, colIdx) => {
            const val = String(cells[colIdx] ?? '').trim()
            ;(obj as Record<string, unknown>)[field] = val
          })

          if (!obj.apaarId || !obj.registerNumber || !obj.studentName || !obj.documentType) {
            rowErrors.push(`Row ${r + 1}: Missing required fields.`)
            continue
          }

          rows.push(obj as SpreadsheetRow)
        }

        resolve({ rows, errors: rowErrors })
      } catch (err) {
        resolve({ rows: [], errors: [`Failed to parse spreadsheet: ${String(err)}`] })
      }
    }
    reader.onerror = () => resolve({ rows: [], errors: ['Failed to read file.'] })
    reader.readAsArrayBuffer(file)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

export function validateBulkRows(
  rows: SpreadsheetRow[],
  uploadedFiles: UploadedDocumentFile[],
  students: AdminStudentRecord[],
  selectedDepartment: string,
  adminEmail: string
): BulkValidationSummary {
  const seen = new Map<string, number>()
  const results: ValidatedBulkRow[] = []

  for (const row of rows) {
    const errors: string[] = []
    const warnings: string[] = []

    const matchedStudent =
      students.find(
        (s) =>
          s.apaarId === row.apaarId ||
          s.registrationNumber === row.registerNumber
      ) ?? null

    if (!matchedStudent) {
      errors.push(`Student not found: APAAR ID "${row.apaarId}" / Reg No "${row.registerNumber}" does not match any authorized record.`)
    } else {
      if (selectedDepartment !== 'all' && matchedStudent.department !== selectedDepartment) {
        errors.push(`Department mismatch: "${matchedStudent.fullName}" is in "${matchedStudent.department}", not "${selectedDepartment}".`)
      }
      if (matchedStudent.apaarId !== row.apaarId || matchedStudent.registrationNumber !== row.registerNumber) {
        warnings.push('APAAR ID and Register Number belong to different records — verify before committing.')
      }
    }

    const normDocType = row.documentType.trim()
    if (!ACCEPTED_DOCUMENT_TYPES.includes(normDocType)) {
      errors.push(`Unrecognised document type: "${normDocType}".`)
    }

    const dedupKey = `${row.apaarId}::${row.registerNumber}::${normDocType}::${row.academicYear}::${row.semester}`
    if (seen.has(dedupKey)) {
      errors.push(`Duplicate: "${normDocType}" for "${row.studentName}" already appears at row ${seen.get(dedupKey)}.`)
    } else {
      seen.set(dedupKey, row.rawRow)
    }

    const existingConflict = _bulkDocuments.find(
      (d) => d.apaarId === row.apaarId && d.documentType === normDocType && d.verificationStatus === 'verified'
    )
    if (existingConflict) {
      warnings.push(`A verified "${normDocType}" already exists. Uploading will create version ${existingConflict.version + 1}.`)
    }

    const matchedFile =
      uploadedFiles.find((f) => {
        const fname = f.name.toLowerCase().replace(/[\s_-]/g, '')
        const regNum = row.registerNumber.toLowerCase().replace(/[/\s]/g, '')
        const docType = normDocType.toLowerCase().replace(/[\s&]/g, '')
        return fname.includes(regNum) || fname.includes(docType)
      }) ?? null

    if (!matchedFile) {
      warnings.push(`No uploaded file matched for "${normDocType}" / "${row.studentName}". Upload PDFs alongside the spreadsheet.`)
    } else {
      const sizeMb = matchedFile.sizeBytes / (1024 * 1024)
      if (sizeMb > MAX_FILE_SIZE_MB) {
        errors.push(`File "${matchedFile.name}" exceeds ${MAX_FILE_SIZE_MB} MB (${sizeMb.toFixed(1)} MB).`)
      }
      const lower = matchedFile.name.toLowerCase()
      if (!lower.endsWith('.pdf') && !lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) {
        errors.push(`File "${matchedFile.name}" is not a supported format (PDF, JPG, PNG).`)
      }
    }

    if (!adminEmail) {
      errors.push('Upload authorization failed: no authenticated admin account found.')
    }

    const status: BulkRowValidationStatus =
      errors.length === 0
        ? matchedFile ? 'valid' : 'missing_file'
        : errors.some((e) => e.includes('not found')) ? 'student_not_found'
        : errors.some((e) => e.includes('Duplicate')) ? 'duplicate'
        : errors.some((e) => e.includes('mismatch')) ? 'dept_mismatch'
        : errors.some((e) => e.includes('Missing required')) ? 'missing_fields'
        : errors.some((e) => e.includes('Unrecognised')) ? 'invalid_doc_type'
        : errors.some((e) => e.includes('already exists')) ? 'conflict'
        : 'manual_review'

    results.push({ row, status, matchedStudent, matchedFile, errors, warnings })
  }

  return {
    totalRows: rows.length,
    validRows: results.filter((r) => r.status === 'valid' || r.status === 'missing_file').length,
    studentMatches: results.filter((r) => r.matchedStudent !== null).length,
    validDocuments: results.filter((r) => r.status === 'valid').length,
    unmatchedStudents: results.filter((r) => r.status === 'student_not_found').length,
    duplicateRows: results.filter((r) => r.status === 'duplicate').length,
    invalidRows: results.filter((r) => ['missing_fields', 'invalid_doc_type', 'dept_mismatch'].includes(r.status)).length,
    missingFiles: results.filter((r) => r.status === 'missing_file').length,
    manualReview: results.filter((r) => r.status === 'manual_review' || r.status === 'conflict').length,
    rows: results,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMIT / STORE
// ─────────────────────────────────────────────────────────────────────────────

export async function commitValidatedRows(
  validatedRows: ValidatedBulkRow[],
  adminEmail: string,
  adminName: string,
  institutionCode: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ stored: StoredBulkDocument[]; newAuditEntries: AuditLogItem[] }> {
  const storedDocs: StoredBulkDocument[] = []
  const auditEntries: AuditLogItem[] = []

  const commitableRows = validatedRows.filter((r) => r.status === 'valid' && r.matchedStudent && r.matchedFile)

  for (let i = 0; i < commitableRows.length; i++) {
    const { row, matchedStudent, matchedFile } = commitableRows[i]
    if (!matchedStudent || !matchedFile) continue

    const fileDataUrl = await readFileAsDataUrl(matchedFile.file)

    const existing = _bulkDocuments.find(
      (d) => d.apaarId === row.apaarId && d.documentType === row.documentType
    )
    const version = existing ? existing.version + 1 : 1
    const docId = `BDOC-${Date.now()}-${i}`
    const now = new Date().toISOString()

    const stored: StoredBulkDocument = {
      id: docId,
      studentId: matchedStudent.id,
      apaarId: matchedStudent.apaarId,
      registerNumber: matchedStudent.registrationNumber,
      department: matchedStudent.department,
      institutionCode,
      documentType: row.documentType,
      certificateNumber: row.certificateNumber,
      issuingAuthority: row.issuingAuthority,
      fileName: matchedFile.name,
      fileSizeBytes: matchedFile.sizeBytes,
      fileDataUrl,
      uploadDate: now,
      uploadedBy: adminEmail,
      verificationStatus: 'pending',
      publicationStatus: 'draft',
      version,
      auditHistory: [{ at: now, by: adminName, action: 'Uploaded', note: `Bulk upload. Version ${version}.` }],
    }

    _bulkDocuments = _bulkDocuments.filter(
      (d) => !(d.apaarId === row.apaarId && d.documentType === row.documentType)
    )
    _bulkDocuments.push(stored)
    storedDocs.push(stored)

    const auditEntry: AuditLogItem = {
      id: `AL-BULK-${Date.now()}-${i}`,
      action: 'Bulk Document Uploaded',
      adminAccount: `${adminEmail} (${adminName})`,
      affectedRecord: `${matchedStudent.registrationNumber} — ${matchedStudent.fullName} (${row.documentType})`,
      timestamp: now,
      previousStatus: existing?.verificationStatus ?? undefined,
      newStatus: 'pending',
      reason: `Bulk upload. File: ${matchedFile.name}. Version: ${version}.`,
      category: 'document',
    }
    _bulkAuditLog = [auditEntry, ..._bulkAuditLog]
    auditEntries.push(auditEntry)

    onProgress?.(i + 1, commitableRows.length)
  }

  return { stored: storedDocs, newAuditEntries: auditEntries }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFY & PUBLISH
// ─────────────────────────────────────────────────────────────────────────────

export function verifyDocument(
  docId: string,
  adminEmail: string,
  adminName: string,
  notes?: string
): StoredBulkDocument | null {
  const idx = _bulkDocuments.findIndex((d) => d.id === docId)
  if (idx === -1) return null
  const now = new Date().toISOString()
  _bulkDocuments[idx] = {
    ..._bulkDocuments[idx],
    verificationStatus: 'verified',
    auditHistory: [
      ..._bulkDocuments[idx].auditHistory,
      { at: now, by: adminName, action: 'Verified', note: notes ?? 'Verified by college admin.' },
    ],
  }
  _bulkAuditLog = [{
    id: `AL-VERIFY-${Date.now()}`,
    action: 'Bulk Document Verified',
    adminAccount: `${adminEmail} (${adminName})`,
    affectedRecord: `${_bulkDocuments[idx].registerNumber} — ${_bulkDocuments[idx].documentType}`,
    timestamp: now,
    previousStatus: 'pending',
    newStatus: 'verified',
    reason: notes ?? 'Verified after review.',
    category: 'document',
  }, ..._bulkAuditLog]
  return _bulkDocuments[idx]
}

export function publishDocument(
  docId: string,
  adminEmail: string,
  adminName: string
): StoredBulkDocument | null {
  const idx = _bulkDocuments.findIndex((d) => d.id === docId)
  if (idx === -1 || _bulkDocuments[idx].verificationStatus !== 'verified') return null

  const now = new Date().toISOString()
  _bulkDocuments[idx] = {
    ..._bulkDocuments[idx],
    publicationStatus: 'published',
    auditHistory: [
      ..._bulkDocuments[idx].auditHistory,
      { at: now, by: adminName, action: 'Published', note: 'Made available on Student Portal.' },
    ],
  }

  const doc = _bulkDocuments[idx]

  try {
    const raw = localStorage.getItem('apaar_student_documents') ?? '[]'
    const existing: Record<string, unknown>[] = JSON.parse(raw)
    const alreadyThere = existing.findIndex((d) => d['id'] === docId)
    const studentDoc = {
      id: docId,
      title: doc.documentType,
      type: doc.documentType,
      fileName: doc.fileName,
      fileSize: `${(doc.fileSizeBytes / 1024).toFixed(0)} KB`,
      uploadDate: new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'verified',
      remarks: 'Verified and published by College Registrar.',
      canRemove: false,
      hashDigest: `sha256:BULK${docId}`,
      availability: 'Issued by College',
      _apaarId: doc.apaarId,
    }
    if (alreadyThere !== -1) existing[alreadyThere] = studentDoc
    else existing.push(studentDoc)
    localStorage.setItem('apaar_student_documents', JSON.stringify(existing))

    const notifsRaw = localStorage.getItem('apaar_student_notifications') ?? '[]'
    const notifs: Record<string, unknown>[] = JSON.parse(notifsRaw)
    notifs.unshift({
      id: `SN-BULK-${Date.now()}`,
      title: `Document Published: ${doc.documentType}`,
      message: `Your ${doc.documentType} has been verified and published by the college administration. It is now available in your Documents section.`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: 'verification',
      read: false,
      actionUrl: '/student/documents',
    })
    localStorage.setItem('apaar_student_notifications', JSON.stringify(notifs))
    window.dispatchEvent(new CustomEvent('apaar_college_doc_update', { detail: { documentId: docId, newStatus: 'accepted_for_verification' } }))
  } catch { /* ignore in demo mode */ }

  _bulkAuditLog = [{
    id: `AL-PUB-${Date.now()}`,
    action: 'Bulk Document Published to Student Portal',
    adminAccount: `${adminEmail} (${adminName})`,
    affectedRecord: `${doc.registerNumber} — ${doc.documentType}`,
    timestamp: now,
    previousStatus: 'verified',
    newStatus: 'published',
    reason: 'Published after verification.',
    category: 'document',
  }, ..._bulkAuditLog]

  return _bulkDocuments[idx]
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSING DOCUMENT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function getMissingDocumentReports(
  students: AdminStudentRecord[],
  department: string
): StudentDocumentStatusReport[] {
  const deptStudents = department === 'all' ? students : students.filter((s) => s.department === department)

  return deptStudents.map((student) => {
    const semKey = `Semester ${student.currentSemester}`
    const required = [...REQUIRED_DOCUMENTS.default, ...(REQUIRED_DOCUMENTS[semKey] ?? [])]
    const studentDocs = _bulkDocuments.filter((d) => d.apaarId === student.apaarId)

    const uploaded = studentDocs.filter((d) => d.verificationStatus === 'pending')
    const underReview = studentDocs.filter((d) => d.verificationStatus === 'under_review')
    const verified = studentDocs.filter((d) => d.verificationStatus === 'verified' && d.publicationStatus !== 'published')
    const requiresCorrection = studentDocs.filter((d) => d.verificationStatus === 'requires_correction')
    const published = studentDocs.filter((d) => d.publicationStatus === 'published')
    const uploadedTypes = new Set(studentDocs.map((d) => d.documentType))
    const missing = required.filter((req) => !uploadedTypes.has(req))

    if (missing.length > 0) {
      try {
        const notifsRaw = localStorage.getItem('apaar_student_notifications') ?? '[]'
        const notifs: Record<string, unknown>[] = JSON.parse(notifsRaw)
        for (const missingDoc of missing) {
          const exists = notifs.some(
            (n) => typeof n['message'] === 'string' && n['message'].includes(missingDoc) && (n as Record<string, unknown>)['_apaarId'] === student.apaarId
          )
          if (!exists) {
            notifs.unshift({
              id: `SN-MISS-${Date.now()}-${missingDoc.replace(/\s/g, '')}`,
              title: `Missing Document: ${missingDoc}`,
              message: `Your ${missingDoc} is currently marked as missing in the college records. Please contact your college administration to resolve this issue.`,
              date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
              type: 'reminder',
              read: false,
              actionUrl: '/student/documents',
              _apaarId: student.apaarId,
            })
          }
        }
        localStorage.setItem('apaar_student_notifications', JSON.stringify(notifs))
      } catch { /* ignore */ }
    }

    return { student, required, uploaded, missing, underReview, verified, requiresCorrection, published }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD METRICS
// ─────────────────────────────────────────────────────────────────────────────

export interface BulkDashboardMetrics {
  totalStudents: number
  studentsComplete: number
  studentsWithMissing: number
  docsAwaitingReview: number
  docsRequiringCorrection: number
  verifiedDocs: number
  publishedDocs: number
}

export function getBulkDashboardMetrics(
  students: AdminStudentRecord[],
  department: string
): BulkDashboardMetrics {
  const reports = getMissingDocumentReports(students, department)
  return {
    totalStudents: reports.length,
    studentsComplete: reports.filter((r) => r.missing.length === 0).length,
    studentsWithMissing: reports.filter((r) => r.missing.length > 0).length,
    docsAwaitingReview: _bulkDocuments.filter((d) => d.verificationStatus === 'pending').length,
    docsRequiringCorrection: _bulkDocuments.filter((d) => d.verificationStatus === 'requires_correction').length,
    verifiedDocs: _bulkDocuments.filter((d) => d.verificationStatus === 'verified').length,
    publishedDocs: _bulkDocuments.filter((d) => d.publicationStatus === 'published').length,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file.'))
    reader.readAsDataURL(file)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
