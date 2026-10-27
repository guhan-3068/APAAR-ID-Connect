/**
 * APAAR CONNECT AI — Full Integration Verification Test Suite
 * Executes end-to-end testing across Student, College Management, and Platform Administration Portals
 * Verifies all 5 mandatory scenarios:
 *  1. Student document delivery & IDOR protection
 *  2. Verification request lifecycle (student submit -> college admin review -> student reflection)
 *  3. Targeted student & college notifications
 *  4. Strict multi-college isolation & platform administration
 *  5. Relational persistence & role-based security
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { handleAuthRequest } from './authBackend.ts'

const TEST_PORT = 54321
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`

let passedCount = 0
let failedCount = 0

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passedCount++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failedCount++
  }
}

async function request(endpoint: string, options: { method?: string; body?: any; token?: string } = {}) {
  const url = `${BASE_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const json = await res.json().catch(() => ({}))
  return { status: res.status, ok: res.ok, data: json }
}

async function runTests() {
  console.log('======================================================================')
  console.log('  APAAR CONNECT AI — AUTOMATED PORTAL INTEGRATION TEST SUITE')
  console.log('======================================================================\n')

  // 1. Start ephemeral HTTP server running handleAuthRequest
  const server = http.createServer(async (req, res) => {
    try {
      const handled = await handleAuthRequest(req, res)
      if (!handled) {
        res.statusCode = 404
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Endpoint not found' }))
      }
    } catch (err: any) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message }))
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => resolve())
  })
  console.log(`Local test server listening on ${BASE_URL}\n`)

  try {
    // -------------------------------------------------------------------------
    // AUTHENTICATION SETUP: Obtain tokens for College A, College B, Students, Platform Admin
    // -------------------------------------------------------------------------
    console.log('--- Setting up Authenticated Sessions ---')

    // College A Admin
    const colARes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'registrar@niet.edu.in', password: 'Apaar@2026' },
    })
    assert(colARes.status === 200 && colARes.data.token, 'College A Admin login successful (registrar@niet.edu.in)')
    const colAToken = colARes.data.token

    // College B Admin
    const colBRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'registrar@cit.edu.in', password: 'Apaar@2026' },
    })
    assert(colBRes.status === 200 && colBRes.data.token, 'College B Admin login successful (registrar@cit.edu.in)')
    const colBToken = colBRes.data.token

    // Student A1 (Aarav Sharma - NIET)
    const stuA1Res = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'aarav.sharma@student.niet.edu.in', password: 'Apaar@2026' },
    })
    assert(stuA1Res.status === 200 && stuA1Res.data.token, 'Student A1 login successful (aarav.sharma@student.niet.edu.in)')
    const stuA1Token = stuA1Res.data.token

    // Student B1 (Pooja Hegde - CIT)
    const stuB1Res = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'pooja.hegde@student.cit.edu.in', password: 'Apaar@2026' },
    })
    assert(stuB1Res.status === 200 && stuB1Res.data.token, 'Student B1 login successful (pooja.hegde@student.cit.edu.in)')
    const stuB1Token = stuB1Res.data.token

    // Platform Admin
    const platRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'admin@aicte.gov.in', password: 'Apaar@2026' },
    })
    assert(platRes.status === 200 && platRes.data.token, 'Platform Admin login successful (admin@aicte.gov.in)\n')
    const platToken = platRes.data.token

    // -------------------------------------------------------------------------
    // SCENARIO 1: STUDENT DOCUMENT DELIVERY & SECURE ISOLATION
    // -------------------------------------------------------------------------
    console.log('--- SCENARIO 1: Student Document Delivery & Secure Download ---')

    // Search Student within College A
    const searchRes = await request('/api/college/students/search?q=2021NIET0841', {
      method: 'GET',
      token: colAToken,
    })
    assert(searchRes.status === 200 && searchRes.data.students?.length === 1, 'College A Admin searches student 2021NIET0841 and finds Aarav Sharma')

    // Search College B student from College A (must return 0)
    const crossSearchRes = await request('/api/college/students/search?q=2021CIT0101', {
      method: 'GET',
      token: colAToken,
    })
    assert(crossSearchRes.data.students?.length === 0, 'College A Admin cannot find College B students via search')

    // Upload Marksheet for Student A1
    const testDocTitle = `Semester VI Examination Marksheet - ${Date.now()}`
    const uploadRes = await request('/api/college/documents/upload', {
      method: 'POST',
      token: colAToken,
      body: {
        studentRegistrationNumber: '2021NIET0841',
        documentType: 'Semester Marksheet & Grade Card',
        title: testDocTitle,
        fileName: 'Aarav_Sharma_Sem6_Marksheet.pdf',
        fileSize: '1.4 MB',
        fileData: 'JVBERi0xLjQKJcTl8uXr... [ENCRYPTED OFFICIAL PDF STREAM]',
        marksheetDetails: {
          semester: 'Semester 6',
          academicYear: '2024-2025',
          sgpa: 8.92,
          cgpa: 8.78,
          creditsEarned: 24,
          totalCredits: 24,
          examination: 'Winter 2024 End-Semester Examination',
        },
      },
    })
    assert((uploadRes.status === 200 || uploadRes.status === 201) && uploadRes.data.success, 'College A Admin successfully uploads official document and marksheet')
    const uploadedDocId = uploadRes.data.document.id

    // Student A1 checks dashboard
    const stuA1Dash = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    const hasDocInA1 = stuA1Dash.data.documents?.some((d: any) => d.id === uploadedDocId)
    assert(hasDocInA1, `Uploaded document "${testDocTitle}" is immediately available in Student A1 portal`)

    const hasAcadInA1 = stuA1Dash.data.academicRecords?.some((r: any) => r.sgpa === 8.92 && r.semester === 'Semester 6')
    assert(hasAcadInA1, 'Corresponding academic record with SGPA 8.92 is immediately available in Student A1 portal')

    // Student B1 checks dashboard (must NOT have this document)
    const stuB1Dash = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuB1Token,
    })
    const hasDocInB1 = stuB1Dash.data.documents?.some((d: any) => d.id === uploadedDocId)
    assert(!hasDocInB1, 'Student B1 (CIT) does NOT have access to Student A1 (NIET) document')

    // Student A1 downloads document
    const downloadA1 = await request(`/api/student/documents/${uploadedDocId}/download`, {
      method: 'GET',
      token: stuA1Token,
    })
    assert(downloadA1.status === 200 && downloadA1.data.document?.id === uploadedDocId, 'Student A1 can securely download their official document')

    // Student B1 attempts IDOR download of Student A1 document (must be rejected 403)
    const idorDownload = await request(`/api/student/documents/${uploadedDocId}/download`, {
      method: 'GET',
      token: stuB1Token,
    })
    assert(idorDownload.status === 403, 'Cross-student document download blocked with 403 Forbidden (IDOR Protection)\n')

    // -------------------------------------------------------------------------
    // SCENARIO 2: VERIFICATION REQUEST LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('--- SCENARIO 2: Verification Request Lifecycle ---')

    // Student A1 submits verification request
    const verifSubmitRes = await request('/api/student/verification-requests', {
      method: 'POST',
      token: stuA1Token,
      body: {
        recordTitle: 'Degree & Marksheet Verification for Placement',
        purpose: 'National Campus Recruitment Drive',
        notes: 'Submitted for employment background verification.',
      },
    })
    assert(verifSubmitRes.status === 201 && verifSubmitRes.data.success, 'Student A1 submits verification request to College Administration')
    const createdReqId = verifSubmitRes.data.request.id

    // College A Admin dashboard check
    const colADash = await request('/api/college/dashboard', {
      method: 'GET',
      token: colAToken,
    })
    const reqInColA = colADash.data.verificationRequests?.find((v: any) => v.id === createdReqId)
    assert(reqInColA && reqInColA.status === 'pending', 'College A Admin receives pending verification request in college dashboard')

    // College B Admin dashboard check (must NOT receive College A requests)
    const colBDash = await request('/api/college/dashboard', {
      method: 'GET',
      token: colBToken,
    })
    const reqInColB = colBDash.data.verificationRequests?.find((v: any) => v.id === createdReqId)
    assert(!reqInColB, 'College B Admin does NOT see College A verification requests')

    // College A Admin approves verification request
    const reviewRes = await request(`/api/college/verification-requests/${createdReqId}/review`, {
      method: 'PUT',
      token: colAToken,
      body: {
        decision: 'approved',
        reviewerNotes: 'Verified against university examination archives. Sealed by Registrar.',
      },
    })
    assert(reviewRes.status === 200 && reviewRes.data.request?.status === 'approved', 'College A Admin approves verification request with official notes')

    // Student A1 checks dashboard again
    const stuA1UpdatedDash = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    const reqUpdatedA1 = stuA1UpdatedDash.data.verificationRequests?.find((v: any) => v.id === createdReqId)
    assert(reqUpdatedA1 && reqUpdatedA1.status === 'approved', 'Student A1 dashboard reflects updated "approved" verification status\n')

    // -------------------------------------------------------------------------
    // SCENARIO 3: TARGETED NOTIFICATIONS
    // -------------------------------------------------------------------------
    console.log('--- SCENARIO 3: Targeted Notifications ---')

    // Student A1 notifications
    const notifsA1 = stuA1UpdatedDash.data.notifications || []
    const hasDocNotif = notifsA1.some((n: any) => n.title.includes('New Official Document Uploaded'))
    const hasVerifNotif = notifsA1.some((n: any) => n.title.includes('Verification Request Approved'))
    assert(hasDocNotif, 'Student A1 received targeted notification for uploaded document')
    assert(hasVerifNotif, 'Student A1 received targeted notification for verification approval')

    // Student B1 notifications (must NOT contain Student A1 notifications)
    const notifsB1 = stuB1Dash.data.notifications || []
    const crossNotif = notifsB1.some((n: any) => n.message.includes('2021NIET0841') || n.message.includes('Aarav'))
    assert(!crossNotif, 'Student B1 notifications are strictly isolated from Student A1 records')

    // Mark notification read
    if (notifsA1.length > 0) {
      const markRes = await request(`/api/student/notifications/${notifsA1[0].id}/read`, {
        method: 'PUT',
        token: stuA1Token,
      })
      assert(markRes.status === 200, 'Student A1 can mark notifications as read\n')
    }

    // -------------------------------------------------------------------------
    // SCENARIO 4: MULTI-COLLEGE ISOLATION & PLATFORM ADMINISTRATION
    // -------------------------------------------------------------------------
    console.log('--- SCENARIO 4: Multi-College Isolation & Platform Administration ---')

    // College A Admin student list
    const colAStudents = colADash.data.students || []
    const allColAStudentsBelongToA = colAStudents.every((s: any) => s.registrationNumber.startsWith('2021NIET'))
    assert(allColAStudentsBelongToA && colAStudents.length > 0, 'College A Admin dashboard only contains NIET students')

    // College B Admin student list
    const colBStudents = colBDash.data.students || []
    const allColBStudentsBelongToB = colBStudents.every((s: any) => s.collegeId === 'col_cit_02')
    const noColAStudentsInB = colBStudents.every((s: any) => !s.registrationNumber.startsWith('2021NIET'))
    assert(allColBStudentsBelongToB && noColAStudentsInB && colBStudents.length > 0, 'College B Admin dashboard only contains CIT students and 0 NIET students')

    // Cross-college unauthorized modification attempt
    const crossModRes = await request(`/api/college/verification-requests/${createdReqId}/review`, {
      method: 'PUT',
      token: colBToken, // College B admin attempting to alter College A request
      body: { decision: 'rejected', reviewerNotes: 'Malicious modification attempt' },
    })
    assert(crossModRes.status === 403, 'Cross-college unauthorized review attempt rejected with 403 Forbidden')

    // Platform Admin dashboard
    const platDash = await request('/api/platform/dashboard', {
      method: 'GET',
      token: platToken,
    })
    assert(platDash.status === 200 && platDash.data.colleges?.length >= 2, 'Platform Admin dashboard sees all colleges in national registry')

    // Platform Admin inspects College A details
    const colADetails = await request('/api/platform/colleges/col_niet_01/details', {
      method: 'GET',
      token: platToken,
    })
    assert(colADetails.status === 200 && colADetails.data.college?.id === 'col_niet_01', 'Platform Admin can inspect College A dossier in isolation')

    // Platform Admin inspects College B details
    const colBDetails = await request('/api/platform/colleges/col_cit_02/details', {
      method: 'GET',
      token: platToken,
    })
    assert(colBDetails.status === 200 && colBDetails.data.college?.id === 'col_cit_02', 'Platform Admin can inspect College B dossier in isolation')

    // Platform Admin updates College B status
    const updateStatusRes = await request('/api/platform/colleges/col_cit_02/status', {
      method: 'PUT',
      token: platToken,
      body: { status: 'active' },
    })
    assert(updateStatusRes.status === 200 && updateStatusRes.data.college?.status === 'active', 'Platform Admin successfully updates institutional approval status\n')

    // -------------------------------------------------------------------------
    // SCENARIO 5: PERSISTENCE, RELOAD & SECURITY SANITIZATION
    // -------------------------------------------------------------------------
    console.log('--- SCENARIO 5: Persistence, Reload & Security Verification ---')

    // Check database file on disk
    const dbPath = path.resolve(import.meta.dirname, 'data/auth_database.json')
    const dbRaw = fs.readFileSync(dbPath, 'utf-8')
    const dbDisk = JSON.parse(dbRaw)

    const diskHasDoc = dbDisk.documents.some((d: any) => d.id === uploadedDocId)
    const diskHasReq = dbDisk.verificationRequests.some((r: any) => r.id === createdReqId)
    assert(diskHasDoc, 'Uploaded document is persisted to disk database file (server/data/auth_database.json)')
    assert(diskHasReq, 'Verification request is persisted to disk database file')

    // Unauthenticated request rejection
    const unauthRes = await request('/api/student/dashboard', { method: 'GET' })
    assert(unauthRes.status === 401, 'Unauthenticated access to student dashboard rejected with 401 Unauthorized')

    // Role-mismatched request rejection (Student accessing platform admin route)
    const roleMismatchRes = await request('/api/platform/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    assert(roleMismatchRes.status === 403, 'Student attempting to access platform admin route rejected with 403 Forbidden')

    // Public verification tool (Safe masked verification)
    const publicVerifyRes = await request('/api/public/verify', {
      method: 'POST',
      body: { query: '2021NIET0841' },
    })
    assert(
      publicVerifyRes.status === 200 &&
      publicVerifyRes.data.verified === true &&
      publicVerifyRes.data.record?.fullName === 'Aarav Sharma' &&
      !publicVerifyRes.data.record.password &&
      !publicVerifyRes.data.record.email,
      'Public verification tool returns verified record with DPDP-safe masking and 0 secrets exposed\n'
    )

  } finally {
    server.close()
  }

  console.log('======================================================================')
  console.log(`  TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log('======================================================================')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
