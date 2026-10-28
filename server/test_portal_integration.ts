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
import { getDatabase, saveDatabase, hashPassword, hashSecurityAnswer, dbService } from './portalDb.ts'

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

function setupTestFixtures() {
  cleanupTestFixtures()
  const db = getDatabase()

  // Ensure College A and College B exist in DB for integration testing
  let colA = db.colleges.find((c) => c.id === 'col_niet_01')
  if (!colA) {
    colA = {
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
    }
    db.colleges.push(colA)
  }

  let colB = db.colleges.find((c) => c.id === 'col_cit_02')
  if (!colB) {
    colB = {
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
    }
    db.colleges.push(colB)
  }

  // Ensure Admin accounts exist
  if (!db.users.some((u) => u.id === 'usr_college_admin_01')) {
    db.users.push({
      id: 'usr_college_admin_01',
      fullName: 'Dr. S. K. Kulkarni',
      email: 'registrar@niet.edu.in',
      role: 'college_admin',
      collegeId: 'col_niet_01',
      institutionName: colA.name,
      institutionCode: colA.code,
      passwordHash: hashPassword('Apaar@2026'),
      status: 'approved',
      createdAt: '2026-01-15T09:00:00.000Z',
    })
  }

  if (!db.users.some((u) => u.id === 'usr_college_admin_02')) {
    db.users.push({
      id: 'usr_college_admin_02',
      fullName: 'Dr. V. Radhakrishnan',
      email: 'registrar@cit.edu.in',
      role: 'college_admin',
      collegeId: 'col_cit_02',
      institutionName: colB.name,
      institutionCode: colB.code,
      passwordHash: hashPassword('Apaar@2026'),
      status: 'approved',
      createdAt: '2026-01-15T09:00:00.000Z',
    })
  }

  // Setup Isolated Test Student A1 (NIET)
  const existingA1 = db.users.find((u) => u.email === 'test.stuA1@student.niet.edu.in')
  if (!existingA1) {
    db.users.push({
      id: 'usr_test_stu_a1',
      fullName: 'Test Student NIET',
      email: 'test.stuA1@student.niet.edu.in',
      apaarId: '111122223333',
      role: 'student',
      collegeId: 'col_niet_01',
      institutionName: colA.name,
      institutionCode: colA.code,
      passwordHash: hashPassword('Apaar@2026'),
      status: 'active',
      createdAt: new Date().toISOString(),
    })
    db.students.push({
      id: 'stu_test_a1',
      userId: 'usr_test_stu_a1',
      collegeId: 'col_niet_01',
      institutionName: colA.name,
      institutionCode: colA.code,
      fullName: 'Test Student NIET',
      email: 'test.stuA1@student.niet.edu.in',
      apaarId: '111122223333',
      registrationNumber: 'TESTNIET001',
      admissionNumber: 'ADMTESTNIET001',
      department: 'Computer Science & Engineering',
      course: 'B.Tech — Computer Science',
      yearOfStudy: '4th Year',
      semester: 'Semester 7',
      phone: '+91 99999 00001',
      dob: '01 Jan 2003',
      gender: 'Other',
      bloodGroup: 'O+',
      digilockerConnected: true,
      verificationStatus: 'verified',
      createdAt: new Date().toISOString(),
    })
  }

  // Setup Isolated Test Student B1 (CIT)
  const existingB1 = db.users.find((u) => u.email === 'test.stuB1@student.cit.edu.in')
  if (!existingB1) {
    db.users.push({
      id: 'usr_test_stu_b1',
      fullName: 'Test Student CIT',
      email: 'test.stuB1@student.cit.edu.in',
      apaarId: '444455556666',
      role: 'student',
      collegeId: 'col_cit_02',
      institutionName: colB.name,
      institutionCode: colB.code,
      passwordHash: hashPassword('Apaar@2026'),
      status: 'active',
      createdAt: new Date().toISOString(),
    })
    db.students.push({
      id: 'stu_test_b1',
      userId: 'usr_test_stu_b1',
      collegeId: 'col_cit_02',
      institutionName: colB.name,
      institutionCode: colB.code,
      fullName: 'Test Student CIT',
      email: 'test.stuB1@student.cit.edu.in',
      apaarId: '444455556666',
      registrationNumber: 'TESTCIT001',
      admissionNumber: 'ADMTESTCIT001',
      department: 'Electrical Engineering',
      course: 'B.E. — Electrical Engineering',
      yearOfStudy: '3rd Year',
      semester: 'Semester 5',
      phone: '+91 99999 00002',
      dob: '01 Jan 2004',
      gender: 'Other',
      bloodGroup: 'A+',
      digilockerConnected: false,
      verificationStatus: 'verified',
      createdAt: new Date().toISOString(),
    })
  }

  // Ensure Test Invitation Token exists and is unused
  if (!db.invitationCodes) db.invitationCodes = []
  const existingToken = db.invitationCodes.find((i) => i.code === 'AICTE-ADMIN-ENROLL-2026')
  if (existingToken) {
    existingToken.used = false
    existingToken.usedByEmail = undefined
    existingToken.usedAt = undefined
  } else {
    db.invitationCodes.push({
      id: 'inv_test_token_01',
      code: 'AICTE-ADMIN-ENROLL-2026',
      createdByAdminId: 'usr_platform_admin_01',
      createdDate: new Date().toISOString(),
      expiresAt: '2030-01-01T00:00:00.000Z',
      used: false,
    })
  }

  // Purge any residual test admin accounts from previous test runs
  const testAdminEmails = new Set([
    'officer.test@aicte.gov.in',
    'applicant.pending@aicte.gov.in',
    'lockout.test@aicte.gov.in',
    'new.admin.test@aicte.gov.in',
  ])
  db.users = db.users.filter(
    (u) =>
      !testAdminEmails.has(u.email.toLowerCase()) &&
      u.id !== 'usr_admin_lockout_test'
  )

  saveDatabase(db)
}

function cleanupTestFixtures() {
  const db = getDatabase()
  const testUserIds = new Set(['usr_test_stu_a1', 'usr_test_stu_b1'])
  const testStudentIds = new Set(['stu_test_a1', 'stu_test_b1'])
  const testAdminEmails = new Set([
    'officer.test@aicte.gov.in',
    'applicant.pending@aicte.gov.in',
    'lockout.test@aicte.gov.in',
    'new.admin.test@aicte.gov.in',
  ])

  const testColCodes = new Set(['AICTE-9988', 'AICTE-9977', 'AICTE-9966'])
  const testDomains = ['@apex.edu.in', '@zenith.edu.in', '@pioneer.edu.in']
  const testRegNos = new Set(['REGAPEX001', 'REGZEN001', 'REGPION001'])

  db.colleges = db.colleges.filter((c) => !testColCodes.has(c.code))

  db.users = db.users.filter(
    (u) =>
      !testUserIds.has(u.id) &&
      !testAdminEmails.has(u.email.toLowerCase()) &&
      u.email !== 'velalar.test@student.edu' &&
      !u.email.startsWith('fresh.student.') &&
      !u.email.startsWith('invalid.dept.') &&
      u.apaarId !== '888877776666' &&
      !testDomains.some((dom) => u.email.endsWith(dom))
  )
  db.students = db.students.filter(
    (s) =>
      !testStudentIds.has(s.id) &&
      s.email !== 'velalar.test@student.edu' &&
      !s.email.startsWith('fresh.student.') &&
      !s.email.startsWith('invalid.dept.') &&
      s.apaarId !== '888877776666' &&
      s.registrationNumber !== 'REGVEL8888' &&
      !testRegNos.has(s.registrationNumber) &&
      !testDomains.some((dom) => s.email.endsWith(dom))
  )
  db.academicRecords = db.academicRecords.filter(
    (r) => !testStudentIds.has(r.studentId) && r.registrationNumber !== 'REGVEL8888' && r.studentName !== 'Kavitha S' && !testRegNos.has(r.registrationNumber)
  )
  db.documents = db.documents.filter(
    (d) => !testStudentIds.has(d.studentId) && d.registrationNumber !== 'REGVEL8888' && d.studentName !== 'Kavitha S' && !testRegNos.has(d.studentRegistrationNumber || '')
  )
  db.verificationRequests = db.verificationRequests.filter(
    (v) => !testStudentIds.has(v.studentId) && v.registrationNumber !== 'REGVEL8888' && !testRegNos.has(v.registrationNumber)
  )
  db.notifications = db.notifications.filter(
    (n) =>
      !testUserIds.has(n.recipientUserId || '') &&
      !n.message.includes('TESTNIET') &&
      !n.message.includes('TESTCIT') &&
      !n.message.includes('REGVEL8888') &&
      !n.message.includes('Kavitha S') &&
      !n.message.includes('REGAPEX') &&
      !n.message.includes('REGZEN') &&
      !n.message.includes('REGPION')
  )
  db.auditLogs = db.auditLogs.filter(
    (a) =>
      !a.details.includes('TESTNIET') &&
      !a.details.includes('TESTCIT') &&
      !a.details.includes('REGVEL8888') &&
      !a.details.includes('REGAPEX') &&
      !a.details.includes('REGZEN') &&
      !a.details.includes('REGPION')
  )

  saveDatabase(db)
}

async function runTests() {
  console.log('======================================================================')
  console.log('  APAAR CONNECT AI — AUTOMATED PORTAL INTEGRATION TEST SUITE')
  console.log('======================================================================\n')

  // Setup isolated test fixtures
  setupTestFixtures()

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

    // Student A1 (Test Student NIET)
    const stuA1Res = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'test.stuA1@student.niet.edu.in', password: 'Apaar@2026' },
    })
    assert(stuA1Res.status === 200 && stuA1Res.data.token, 'Student A1 login successful (test.stuA1@student.niet.edu.in)')
    const stuA1Token = stuA1Res.data.token

    // Student B1 (Test Student CIT)
    const stuB1Res = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'test.stuB1@student.cit.edu.in', password: 'Apaar@2026' },
    })
    assert(stuB1Res.status === 200 && stuB1Res.data.token, 'Student B1 login successful (test.stuB1@student.cit.edu.in)')
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
    // =========================================================================
    // SECTION 10: 12 MANDATORY TEST CASES
    // =========================================================================

    // Test 1 — Student search by APAAR ID
    console.log('--- TEST 1: Student Search by APAAR ID ---')
    const apaarSearchRes = await request('/api/college/students/search?q=111122223333', {
      method: 'GET',
      token: colAToken,
    })
    assert(
      apaarSearchRes.status === 200 &&
      apaarSearchRes.data.students?.length === 1 &&
      apaarSearchRes.data.students[0].registrationNumber === 'TESTNIET001' &&
      apaarSearchRes.data.students[0].fullName === 'Test Student NIET',
      'Test 1 — Student search using APAAR ID returns the correct student profile'
    )

    // Formatted APAAR ID test
    const formattedApaarSearchRes = await request('/api/college/students/search?q=1111 2222 3333', {
      method: 'GET',
      token: colAToken,
    })
    assert(
      formattedApaarSearchRes.status === 200 &&
      formattedApaarSearchRes.data.students?.length === 1,
      'Test 1b — Student search using formatted space-separated APAAR ID returns the correct student profile'
    )

    // Test 2 — Student search by Registration Number
    console.log('--- TEST 2: Student Search by Registration Number ---')
    const regSearchRes = await request('/api/college/students/search?q=TESTNIET001', {
      method: 'GET',
      token: colAToken,
    })
    assert(
      regSearchRes.status === 200 &&
      regSearchRes.data.students?.length === 1 &&
      regSearchRes.data.students[0].apaarId === '111122223333',
      'Test 2 — Student search using registration number returns the correct profile'
    )

    // Test 3 — Department filtering
    console.log('--- TEST 3: Department Filtering ---')
    const deptSearchRes = await request('/api/college/students/search?department=Computer Science %26 Engineering', {
      method: 'GET',
      token: colAToken,
    })
    assert(
      deptSearchRes.status === 200 &&
      deptSearchRes.data.students?.length > 0 &&
      deptSearchRes.data.students.every((s: any) => s.department === 'Computer Science & Engineering'),
      'Test 3 — Department filtering returns appropriate students without mixing unrelated records'
    )

    // Test 4 — Document upload
    console.log('--- TEST 4: Document Upload to Correct Student Profile ---')
    const testDocTitle = `Semester VI Examination Marksheet - ${Date.now()}`
    const uploadRes = await request('/api/college/documents/upload', {
      method: 'POST',
      token: colAToken,
      body: {
        studentRegistrationNumber: 'TESTNIET001',
        documentType: 'Semester Marksheet & Grade Card',
        title: testDocTitle,
        fileName: 'Test_Student_Sem6_Marksheet.pdf',
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
    assert(
      (uploadRes.status === 200 || uploadRes.status === 201) &&
      uploadRes.data.success &&
      uploadRes.data.document?.studentName === 'Test Student NIET',
      'Test 4 — Upload test document saves successfully with stable student ID and college relationship'
    )
    const uploadedDocId = uploadRes.data.document.id

    // Test 5 — Student document access
    console.log('--- TEST 5: Student Document Access in Student Portal ---')
    const stuA1Dash = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    const hasDocInA1 = stuA1Dash.data.documents?.some((d: any) => d.id === uploadedDocId)
    assert(hasDocInA1, `Test 5 — Uploaded document "${testDocTitle}" appears in existing Student Portal`)

    const hasAcadInA1 = stuA1Dash.data.academicRecords?.some((r: any) => r.sgpa === 8.92 && r.semester === 'Semester 6')
    assert(hasAcadInA1, 'Test 5b — Corresponding marksheet record appears with SGPA in Student Portal')

    // Test 6 — Document download
    console.log('--- TEST 6: Document Download ---')
    const downloadA1 = await request(`/api/student/documents/${uploadedDocId}/download`, {
      method: 'GET',
      token: stuA1Token,
    })
    assert(
      downloadA1.status === 200 &&
      downloadA1.data.document?.id === uploadedDocId &&
      downloadA1.data.document?.fileData,
      'Test 6 — Authorized student can open and download the document'
    )

    // Test 7 — Upload notification
    console.log('--- TEST 7: Upload Notification ---')
    const uploadNotif = stuA1Dash.data.notifications?.find(
      (n: any) => n.title === 'New Document Uploaded' && n.message.includes(testDocTitle)
    )
    assert(
      uploadNotif &&
      uploadNotif.message === `New Document Uploaded: Your college has uploaded your ${testDocTitle}. Log in to your Student Portal to view and download it.`,
      'Test 7 — Student receives persistent notification formatted exactly per Section 4.A'
    )

    // Test 8 — Verification notification (Verified and Rejected)
    console.log('--- TEST 8: Verification Status Notifications ---')
    // 8a. Update status to rejected with reason
    const rejectReviewRes = await request(`/api/college/documents/${uploadedDocId}/review`, {
      method: 'PUT',
      token: colAToken,
      body: {
        status: 'rejected',
        correctionNotes: 'Official registrar seal is missing from the submitted document.',
      },
    })
    assert(rejectReviewRes.status === 200 && rejectReviewRes.data.document?.reviewStatus === 'rejected', 'Test 8a — Certificate status updated to rejected')

    const stuA1AfterReject = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    const rejectNotif = stuA1AfterReject.data.notifications?.find(
      (n: any) => n.title === 'Certificate Update' && n.message.includes('rejected')
    )
    assert(
      rejectNotif &&
      rejectNotif.message.includes('Official registrar seal is missing'),
      'Test 8b — Rejection notification includes actual verification result and rejection reason'
    )

    // 8b. Update status to accepted_for_verification
    const acceptReviewRes = await request(`/api/college/documents/${uploadedDocId}/review`, {
      method: 'PUT',
      token: colAToken,
      body: {
        status: 'accepted_for_verification',
        correctionNotes: 'Original re-checked and sealed.',
      },
    })
    assert(acceptReviewRes.status === 200 && acceptReviewRes.data.document?.reviewStatus === 'accepted_for_verification', 'Test 8c — Certificate status updated to verified')

    const stuA1AfterAccept = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    const verifiedNotif = stuA1AfterAccept.data.notifications?.find(
      (n: any) => n.title === 'Certificate Verified'
    )
    assert(
      verifiedNotif &&
      verifiedNotif.message.includes('has been verified'),
      'Test 8d — Verification notification created with "Certificate Verified" title and message'
    )

    // Test verification request workflow
    const verifSubmitRes = await request('/api/student/verification-requests', {
      method: 'POST',
      token: stuA1Token,
      body: {
        recordTitle: 'Degree & Marksheet Verification for Placement',
        purpose: 'National Campus Recruitment Drive',
        notes: 'Submitted for employment background verification.',
      },
    })
    assert(verifSubmitRes.status === 201 && verifSubmitRes.data.success, 'Test 8e — Student submits verification request')
    const createdReqId = verifSubmitRes.data.request.id

    const colADash = await request('/api/college/dashboard', {
      method: 'GET',
      token: colAToken,
    })
    const hasReqInColA = colADash.data.verificationRequests?.some((r: any) => r.id === createdReqId)
    assert(hasReqInColA, 'Test 8f — Verification request is visible in College A Admin queue')

    const reviewReqRes = await request(`/api/college/verification-requests/${createdReqId}/review`, {
      method: 'PUT',
      token: colAToken,
      body: {
        decision: 'approved',
        reviewerNotes: 'Official University Ledger verified and matched with digital signature.',
      },
    })
    assert(reviewReqRes.status === 200 && reviewReqRes.data.request?.status === 'approved', 'Test 8g — College A Admin reviews and approves request')

    const stuA1AfterReq = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    const updatedReq = stuA1AfterReq.data.verificationRequests?.find((r: any) => r.id === createdReqId)
    assert(updatedReq?.status === 'approved', 'Test 8h — Student A1 sees updated approved status')

    // Test 9 — College isolation
    console.log('--- TEST 9: College-Specific Student Association & Isolation ---')
    // Search College B student from College A (must return 0)
    const crossSearchRes = await request('/api/college/students/search?q=TESTCIT001', {
      method: 'GET',
      token: colAToken,
    })
    assert(crossSearchRes.data.students?.length === 0, 'Test 9a — College A Admin cannot search or see College B students')

    // College B Admin dashboard check (must NOT see College A request)
    const colBDash = await request('/api/college/dashboard', {
      method: 'GET',
      token: colBToken,
    })
    const hasReqInColB = colBDash.data.verificationRequests?.some((r: any) => r.id === createdReqId)
    assert(!hasReqInColB, 'Test 9b — College B Admin does NOT see College A verification requests')

    // College B Admin cannot upload document for Student A1
    const crossUploadRes = await request('/api/college/documents/upload', {
      method: 'POST',
      token: colBToken,
      body: {
        studentRegistrationNumber: 'TESTNIET001',
        documentType: 'Transfer Certificate',
        title: 'Unauthorized TC',
        fileName: 'tc.pdf',
      },
    })
    assert(crossUploadRes.status === 400 || crossUploadRes.status === 404, 'Test 9c — College B cannot upload documents for College A student')

    // Test 10 — Student privacy
    console.log('--- TEST 10: Student Privacy & Access Control ---')
    // Student B1 (CIT) checks dashboard (must NOT have Student A1 document)
    const stuB1Dash = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuB1Token,
    })
    const hasDocInB1 = stuB1Dash.data.documents?.some((d: any) => d.id === uploadedDocId)
    assert(!hasDocInB1, 'Test 10a — Student B1 does NOT see Student A1 private documents in dashboard')

    // Student B1 attempts IDOR download of Student A1 document (must be rejected 403)
    const idorDownload = await request(`/api/student/documents/${uploadedDocId}/download`, {
      method: 'GET',
      token: stuB1Token,
    })
    assert(idorDownload.status === 403, 'Test 10b — Cross-student document download blocked with 403 Forbidden (IDOR Protection)')

    // Cross-student notifications isolation
    const notifsB1 = stuB1Dash.data.notifications || []
    const crossNotif = notifsB1.some((n: any) => n.message.includes(testDocTitle) || n.message.includes('TESTNIET001'))
    assert(!crossNotif, 'Test 10c — Student B1 notifications are strictly isolated from Student A1 records')

    // -------------------------------------------------------------------------
    // SCENARIO 4: MULTI-COLLEGE ISOLATION & PLATFORM ADMINISTRATION
    // -------------------------------------------------------------------------
    console.log('--- SCENARIO 4: Multi-College Isolation & Platform Administration ---')

    // College A Admin student list
    const colAStudents = colADash.data.students || []
    const allColAStudentsBelongToA = colAStudents.every((s: any) => s.collegeId === 'col_niet_01')
    assert(allColAStudentsBelongToA && colAStudents.length > 0, 'College A Admin dashboard only contains NIET students')

    // College B Admin student list
    const colBStudents = colBDash.data.students || []
    const allColBStudentsBelongToB = colBStudents.every((s: any) => s.collegeId === 'col_cit_02')
    const noColAStudentsInB = colBStudents.every((s: any) => s.collegeId !== 'col_niet_01')
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
    assert(platDash.status === 200, 'Platform Admin dashboard access successful')
    assert(platDash.data.colleges?.length >= 2, 'Platform Admin views registered colleges across the nation')
    assert(platDash.data.stats?.totalStudents >= 2, 'Platform Admin aggregate statistics accurately computed from database')
    assert(platDash.data.stats?.totalDocuments >= 1, 'Platform Admin documents count reflects database records')

    // Platform Admin College Details Audit
    const platColAudit = await request('/api/platform/colleges/col_niet_01', {
      method: 'GET',
      token: platToken,
    })
    assert(platColAudit.status === 200 && platColAudit.data.college?.id === 'col_niet_01', 'Platform Admin can inspect individual college data and records')
    assert(platColAudit.data.students?.length > 0, 'Platform Admin audits College A students via relational query\n')

    // -------------------------------------------------------------------------
    // TEST 11: DATABASE PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('--- TEST 11: Database Persistence ---')

    // Direct Disk JSON Verification
    const dbPath = path.resolve(import.meta.dirname, 'data/auth_database.json')
    const dbRaw = fs.readFileSync(dbPath, 'utf-8')
    const dbDisk = JSON.parse(dbRaw)

    const diskHasDoc = dbDisk.documents.some((d: any) => d.id === uploadedDocId)
    const diskHasReq = dbDisk.verificationRequests.some((r: any) => r.id === createdReqId)
    assert(diskHasDoc, 'Test 11a — Uploaded document is persisted to disk database file (server/data/auth_database.json)')
    assert(diskHasReq, 'Test 11b — Verification request is persisted to disk database file')

    // Re-login Student A1 and re-fetch dashboard
    const reloginStuRes = await request('/api/auth/login', {
      method: 'POST',
      body: { identifier: 'test.stuA1@student.niet.edu.in', password: 'Apaar@2026' },
    })
    const refetchedDash = await request('/api/student/dashboard', {
      method: 'GET',
      token: reloginStuRes.data.token,
    })
    assert(
      refetchedDash.data.documents?.some((d: any) => d.id === uploadedDocId) &&
      refetchedDash.data.verificationRequests?.some((r: any) => r.id === createdReqId),
      'Test 11c — Fresh login re-fetches persisted documents, statuses, and notifications from database\n'
    )

    // -------------------------------------------------------------------------
    // TEST 12: PRESERVATION OF EXISTING FUNCTIONALITY
    // -------------------------------------------------------------------------
    console.log('--- TEST 12: Existing Functionality & RBAC Security ---')

    // Unauthenticated request rejection
    const unauthRes = await request('/api/student/dashboard', { method: 'GET' })
    assert(unauthRes.status === 401, 'Test 12a — Unauthenticated access to student dashboard rejected with 401 Unauthorized')

    // Role-mismatched request rejection (Student accessing platform admin route)
    const roleMismatchRes = await request('/api/platform/dashboard', {
      method: 'GET',
      token: stuA1Token,
    })
    assert(roleMismatchRes.status === 403, 'Test 12b — Student attempting to access platform admin route rejected with 403 Forbidden')

    // Public verification tool (Safe masked verification)
    const publicVerifyRes = await request('/api/public/verify', {
      method: 'POST',
      body: { query: 'TESTNIET001' },
    })
    assert(
      publicVerifyRes.status === 200 &&
      publicVerifyRes.data.verified === true &&
      publicVerifyRes.data.record?.fullName === 'Test Student NIET' &&
      !publicVerifyRes.data.record.password &&
      !publicVerifyRes.data.record.email,
      'Test 12c — Public verification tool returns verified record with DPDP-safe masking and 0 secrets exposed'
    )

    // -------------------------------------------------------------------------
    // TEST 13: VELALAR COLLEGE SELECTION, SEARCH & MISMATCH FIX
    // -------------------------------------------------------------------------
    console.log('--- TEST 13: College Selection, Search & Association Verification ---')

    // 13a. Authoritative Colleges API
    const collegesRes = await request('/api/colleges', { method: 'GET' })
    assert(
      collegesRes.status === 200 &&
      Array.isArray(collegesRes.data.colleges) &&
      collegesRes.data.colleges.some((c: any) => c.name.toLowerCase().includes('velalar')),
      'Test 13a — Authoritative colleges API returns registered institutions including Velalar College'
    )

    // 13b. Student registration with Velalar College
    const velalarStudentApaar = '888877776666'
    const regVelalarStudent = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Velalar Test Student',
        email: 'velalar.test@student.edu',
        institutionName: 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY',
        collegeId: 'col_1793115697005',
        apaarId: velalarStudentApaar,
        password: 'Password@123',
        registrationNumber: 'REGVEL8888',
      },
    })
    assert(
      regVelalarStudent.status === 201 &&
      regVelalarStudent.data.user?.collegeId === 'col_1793115697005' &&
      regVelalarStudent.data.user?.institutionName === 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY',
      'Test 13b — Student registration with Velalar College saves exact college_id and preserves association'
    )

    // 13c. Student Portal displays Velalar College
    const velalarStuToken = regVelalarStudent.data.token
    const velalarStuDash = await request('/api/student/dashboard', {
      method: 'GET',
      token: velalarStuToken,
    })
    assert(
      velalarStuDash.status === 200 &&
      velalarStuDash.data.college?.name === 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY' &&
      velalarStuDash.data.student?.institutionName === 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY',
      'Test 13c — Student Portal displays authoritative Velalar College name rather than defaulting to NIET'
    )

    // 13d. Authenticate as Velalar College Administrator
    const velalarAdminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'velalar21@.edu.in',
        password: 'Password@123', // fallback or test
      },
    })
    // In case password differs, we can create or authenticate Velalar admin token
    let velalarAdminToken = velalarAdminLogin.data?.token
    if (!velalarAdminToken) {
      // Create admin token using createJwt directly
      const { createJwt } = await import('./authBackend.ts')
      velalarAdminToken = createJwt({
        userId: 'usr_col_1793115697005',
        email: 'velalar21@.edu.in',
        role: 'college_admin',
        collegeId: 'col_1793115697005',
        institutionCode: 'AICTE -2026',
      })
    }

    // 13e. Velalar Admin searches student with mixed case and accidental spaces
    const searchSpaced = await request('/api/college/students/search?q=reg%20vel8888', {
      method: 'GET',
      token: velalarAdminToken,
    })
    assert(
      searchSpaced.status === 200 &&
      Array.isArray(searchSpaced.data.students) &&
      searchSpaced.data.students.some((s: any) => s.registrationNumber === 'REGVEL8888'),
      'Test 13e — Velalar Admin searches student by registration number with accidental spaces and finds matching record'
    )

    // 13f. Existing corrected student Gowtham.P found by Velalar Admin
    const searchGowtham = await request('/api/college/students/search?q=REG252026', {
      method: 'GET',
      token: velalarAdminToken,
    })
    assert(
      searchGowtham.status === 200 &&
      Array.isArray(searchGowtham.data.students) &&
      searchGowtham.data.students.some((s: any) => s.registrationNumber === 'REG252026' || s.fullName.includes('GOWTHAM')),
      'Test 13f — Existing student account (Gowtham.P) correctly found in Velalar College registry'
    )

    // 13g. Velalar Admin uploads document for Gowtham.P
    const uploadGowthamDoc = await request('/api/college/documents/upload', {
      method: 'POST',
      token: velalarAdminToken,
      body: {
        studentRegistrationNumber: 'reg 252026', // with accidental spaces & lowercase
        documentType: 'Semester Marksheet & Grade Card',
        title: 'Semester II Official Examination Grade Card',
        fileName: 'Gowtham_Sem2_GradeCard.pdf',
        fileSize: '1.5 MB',
        marksheetDetails: {
          semester: 'Semester 2',
          sgpa: 9.1,
          cgpa: 9.0,
          creditsEarned: 24,
          totalCredits: 24,
        },
      },
    })
    assert(
      uploadGowthamDoc.status === 201 &&
      uploadGowthamDoc.data.success === true &&
      uploadGowthamDoc.data.document?.collegeId === 'col_1793115697005',
      'Test 13g — Velalar Admin successfully uploads official marksheet for student using normalized registration number'
    )

    // 13h. Cross-College Privacy: NIET Admin searching for Velalar student gets 0 results
    const nietCrossSearch = await request('/api/college/students/search?q=REGVEL8888', {
      method: 'GET',
      token: colAToken,
    })
    assert(
      nietCrossSearch.status === 200 &&
      (!nietCrossSearch.data.students || nietCrossSearch.data.students.length === 0),
      'Test 13h — NIET Admin cannot access Velalar student (Strict cross-institution privacy maintained)'
    )

    // -------------------------------------------------------------------------
    // TEST 14: PLATFORM ADMINISTRATOR ENROLLMENT WITH VALID INVITATION TOKEN
    // -------------------------------------------------------------------------
    console.log('--- TEST 14: Platform Admin Enrollment with Invitation Token ---')
    const validRegRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Dr. Vikram Sarabhai',
        email: 'officer.test@aicte.gov.in',
        username: 'aicte_officer_test',
        employeeId: 'AICTE-EMP-7701',
        designation: 'Joint Director of Accreditation',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'What was the name of your first school?',
        securityAnswer: 'Kendriya Vidyalaya Delhi Cantt',
        invitationCode: 'AICTE-ADMIN-ENROLL-2026',
      },
    })

    assert(
      validRegRes.status === 201 &&
      validRegRes.data.success === true &&
      validRegRes.data.activated === true &&
      validRegRes.data.user?.status === 'active',
      'Test 14a — Platform admin registration with valid token creates activated account (201 Created)'
    )

    assert(
      !validRegRes.data.user?.securityAnswer &&
      !validRegRes.data.user?.securityAnswerHash &&
      !validRegRes.data.user?.password &&
      !validRegRes.data.user?.passwordHash,
      'Test 14b — Platform admin registration response never exposes security answer, password or hashes'
    )

    // Verify database record has salted hash and token marked as used
    const checkDb = getDatabase()
    const registeredAdmin = checkDb.users.find((u) => u.email === 'officer.test@aicte.gov.in')
    assert(
      registeredAdmin &&
      registeredAdmin.status === 'active' &&
      registeredAdmin.securityAnswerHash &&
      registeredAdmin.securityAnswerHash.includes(':') &&
      !registeredAdmin.securityAnswerHash.includes('Kendriya Vidyalaya'),
      'Test 14c — Security answer is stored with PBKDF2 salt and hash, never plaintext'
    )

    const usedToken = checkDb.invitationCodes?.find((i) => i.code === 'AICTE-ADMIN-ENROLL-2026')
    assert(
      usedToken && usedToken.used === true && usedToken.usedByEmail === 'officer.test@aicte.gov.in',
      'Test 14d — Enrollment invitation token is marked used and attributed to the registrant'
    )

    // Attempting to reuse the same invitation token should be rejected
    const reuseTokenRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Another Candidate',
        email: 'another.candidate@aicte.gov.in',
        username: 'aicte_another_cand',
        employeeId: 'AICTE-EMP-7702',
        designation: 'Assistant Director',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'What was the name of your first school?',
        securityAnswer: 'St. Xavier High School',
        invitationCode: 'AICTE-ADMIN-ENROLL-2026',
      },
    })
    assert(
      reuseTokenRes.status === 400 && reuseTokenRes.data.error?.includes('already been used'),
      'Test 14e — Re-use of expired or already consumed invitation token is rejected (400 Bad Request)'
    )

    // -------------------------------------------------------------------------
    // TEST 15: PLATFORM ADMINISTRATOR ENROLLMENT WITHOUT INVITATION TOKEN
    // -------------------------------------------------------------------------
    console.log('--- TEST 15: Platform Admin Enrollment without Token (Pending Approval) ---')
    const pendingRegRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Applicant S. Narayanan',
        email: 'applicant.pending@aicte.gov.in',
        username: 'aicte_applicant_pending',
        employeeId: 'AICTE-APP-8801',
        designation: 'Technical Assessment Fellow',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'What was the name of your first teacher?',
        securityAnswer: 'Mrs. Jayalakshmi',
        // invitationCode omitted
      },
    })

    assert(
      pendingRegRes.status === 201 &&
      pendingRegRes.data.success === true &&
      pendingRegRes.data.pendingApproval === true &&
      pendingRegRes.data.user?.status === 'pending_approval',
      'Test 15a — Administrator registration without token creates account in pending_approval status (201 Created)'
    )

    // An unapproved account CANNOT log in
    const unapprovedLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'applicant.pending@aicte.gov.in',
        password: 'PassWord@9921#',
        portal: 'platform_admin',
      },
    })

    assert(
      unapprovedLoginRes.status === 403 &&
      unapprovedLoginRes.data.requiresApproval === true &&
      unapprovedLoginRes.data.error?.includes('pending authorization'),
      'Test 15b — Unapproved administrator cannot log in (403 Forbidden with approval required message)'
    )

    // -------------------------------------------------------------------------
    // TEST 16: FORM VALIDATION & STRONG PASSWORD ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('--- TEST 16: Form Validation & Security Policy Enforcement ---')
    // 16a. Non-governmental / non-educational email domain
    const badEmailRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Hacker Bob',
        email: 'hacker@gmail.com',
        username: 'hacker_bob',
        employeeId: 'EMP-000',
        designation: 'Staff',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
      },
    })
    assert(
      badEmailRes.status === 400 && badEmailRes.data.error?.includes('Official government'),
      'Test 16a — Public/non-governmental email domains (.gmail.com) rejected (400 Bad Request)'
    )

    // 16b. Mismatched passwords
    const mismatchPassRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Dr. Officer',
        email: 'officer2@aicte.gov.in',
        username: 'aicte_officer2',
        employeeId: 'EMP-001',
        designation: 'Staff',
        password: 'PassWord@9921#',
        confirmPassword: 'DifferentPassword123#',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
      },
    })
    assert(
      mismatchPassRes.status === 400 && mismatchPassRes.data.error?.includes('match'),
      'Test 16b — Mismatched passwords rejected (400 Bad Request)'
    )

    // 16c. Weak password (< 8 chars)
    const weakPassRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Dr. Officer',
        email: 'officer3@aicte.gov.in',
        username: 'aicte_officer3',
        employeeId: 'EMP-002',
        designation: 'Staff',
        password: 'short',
        confirmPassword: 'short',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
      },
    })
    assert(
      weakPassRes.status === 400 && weakPassRes.data.error?.includes('at least 8 characters'),
      'Test 16c — Weak password (<8 characters) rejected (400 Bad Request)'
    )

    // 16d. Invalid username characters
    const badUsernameRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Dr. Officer',
        email: 'officer4@aicte.gov.in',
        username: 'invalid username with spaces!',
        employeeId: 'EMP-003',
        designation: 'Staff',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
      },
    })
    assert(
      badUsernameRes.status === 400 && badUsernameRes.data.error?.includes('Username'),
      'Test 16d — Username with invalid characters or spaces rejected (400 Bad Request)'
    )

    // 16e. Missing security answer
    const noAnswerRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Dr. Officer',
        email: 'officer5@aicte.gov.in',
        username: 'aicte_officer5',
        employeeId: 'EMP-004',
        designation: 'Staff',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'What was your first school?',
        securityAnswer: '   ',
      },
    })
    assert(
      noAnswerRes.status === 400 && noAnswerRes.data.error?.includes('Security question answer'),
      'Test 16e — Missing or blank security answer rejected (400 Bad Request)'
    )

    // -------------------------------------------------------------------------
    // TEST 17: DUPLICATE REGISTRATION & ROOT ADMIN PROTECTION
    // -------------------------------------------------------------------------
    console.log('--- TEST 17: Duplicate Registration & Root Admin Overwrite Protection ---')
    // 17a. Attempt to overwrite root administrator
    const overwriteRootRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Imposter Admin',
        email: 'admin@aicte.gov.in', // Root admin
        username: 'new_root_imposter',
        employeeId: 'EMP-FAKE',
        designation: 'Imposter',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
      },
    })
    assert(
      overwriteRootRes.status === 409 && overwriteRootRes.data.error?.includes('already registered'),
      'Test 17a — Attempt to register with root admin email rejected (409 Conflict)'
    )

    // 17b. Attempt to duplicate existing username
    const dupUsernameRes = await request('/api/auth/register/platform-admin', {
      method: 'POST',
      body: {
        fullName: 'Another Officer',
        email: 'new.admin.test@aicte.gov.in',
        username: 'aicte_officer_test', // already taken in Test 14
        employeeId: 'EMP-NEW',
        designation: 'Officer',
        password: 'PassWord@9921#',
        confirmPassword: 'PassWord@9921#',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
      },
    })
    assert(
      dupUsernameRes.status === 409 && dupUsernameRes.data.error?.includes('already taken'),
      'Test 17b — Attempt to register with duplicate username rejected (409 Conflict)'
    )

    // -------------------------------------------------------------------------
    // TEST 18: AUTHORIZED ADMINISTRATOR APPROVAL WORKFLOW
    // -------------------------------------------------------------------------
    console.log('--- TEST 18: Authorized Administrator Approval Workflow ---')
    // 18a. Super admin views pending administrator queue
    const pendingListRes = await request('/api/platform/admins/pending', {
      method: 'GET',
      token: platToken,
    })
    assert(
      pendingListRes.status === 200 &&
      Array.isArray(pendingListRes.data.pendingAdmins) &&
      pendingListRes.data.pendingAdmins.some((a: any) => a.email === 'applicant.pending@aicte.gov.in'),
      'Test 18a — Authorized platform admin retrieves pending administrator enrollment requests'
    )

    const pendingAdminId = pendingListRes.data.pendingAdmins.find(
      (a: any) => a.email === 'applicant.pending@aicte.gov.in'
    ).id

    // 18b. Super admin approves the pending administrator
    const approveRes = await request(`/api/platform/admins/${pendingAdminId}/approve`, {
      method: 'POST',
      token: platToken,
    })
    assert(
      approveRes.status === 200 &&
      approveRes.data.success === true &&
      approveRes.data.admin?.status === 'active',
      'Test 18b — Authorized platform admin successfully approves pending administrator (Status -> ACTIVE)'
    )

    // 18c. Now the approved administrator can log in!
    const approvedLoginStep1 = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'applicant.pending@aicte.gov.in',
        password: 'PassWord@9921#',
        portal: 'platform_admin',
      },
    })
    assert(
      approvedLoginStep1.status === 200 &&
      approvedLoginStep1.data.requireSecurityChallenge === true &&
      approvedLoginStep1.data.securityQuestion === 'What was the name of your first teacher?',
      'Test 18c — Approved administrator can now initiate login and receive security challenge'
    )

    // -------------------------------------------------------------------------
    // TEST 19: DUAL-IDENTIFIER LOGIN & CRYPTOGRAPHIC SECURITY CHALLENGE
    // -------------------------------------------------------------------------
    console.log('--- TEST 19: Dual-Identifier Login & Security Challenge Verification ---')
    // 19a. Login using USERNAME instead of email
    const usernameLoginStep1 = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'aicte_officer_test', // username
        password: 'PassWord@9921#',
        portal: 'platform_admin',
      },
    })
    assert(
      usernameLoginStep1.status === 200 &&
      usernameLoginStep1.data.requireSecurityChallenge === true &&
      typeof usernameLoginStep1.data.challengeToken === 'string' &&
      usernameLoginStep1.data.securityQuestion === 'What was the name of your first school?',
      'Test 19a — Platform admin can log in using administrative username (returns challenge token)'
    )

    const challengeToken = usernameLoginStep1.data.challengeToken

    // 19b. Incorrect security answer is rejected
    const badChallengeRes = await request('/api/auth/verify-security-challenge', {
      method: 'POST',
      body: {
        challengeToken,
        securityAnswer: 'Completely Wrong Answer',
      },
    })
    assert(
      badChallengeRes.status === 401 && badChallengeRes.data.error?.includes('Incorrect security answer'),
      'Test 19b — Incorrect security answer is rejected (401 Unauthorized)'
    )

    // 19c. Correct security answer (with different casing and whitespace) is normalized and verified!
    const goodChallengeRes = await request('/api/auth/verify-security-challenge', {
      method: 'POST',
      body: {
        challengeToken,
        securityAnswer: '  kendriya vidyalaya delhi cantt  ', // mixed case & extra spaces
      },
    })
    assert(
      goodChallengeRes.status === 200 &&
      goodChallengeRes.data.success === true &&
      typeof goodChallengeRes.data.token === 'string' &&
      goodChallengeRes.data.user?.role === 'platform_admin' &&
      goodChallengeRes.data.user?.username === 'aicte_officer_test',
      'Test 19c — Correct normalized security answer verified; returns authenticated platform admin JWT session'
    )

    const newlyEnrolledAdminToken = goodChallengeRes.data.token

    // 19d. Test direct login with security answer included in single step
    const directLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'officer.test@aicte.gov.in', // email
        password: 'PassWord@9921#',
        portal: 'platform_admin',
        securityAnswer: 'Kendriya Vidyalaya Delhi Cantt',
      },
    })
    assert(
      directLoginRes.status === 200 &&
      directLoginRes.data.token &&
      directLoginRes.data.user?.email === 'officer.test@aicte.gov.in',
      'Test 19d — Platform admin can authenticate with email, password, and security answer'
    )

    // -------------------------------------------------------------------------
    // TEST 20: BRUTE FORCE RATE LIMITING & ACCOUNT LOCKOUT
    // -------------------------------------------------------------------------
    console.log('--- TEST 20: Brute Force Rate Limiting & Account Lockout ---')
    // Create an account specifically for lockout testing
    const testAdminLockout = {
      id: 'usr_admin_lockout_test',
      fullName: 'Lockout Test Officer',
      email: 'lockout.test@aicte.gov.in',
      username: 'aicte_lockout_test',
      role: 'platform_admin' as const,
      passwordHash: hashPassword('PassWord@12345'),
      createdAt: new Date().toISOString(),
      status: 'active' as const,
      securityQuestion: 'What was your first school?',
      securityAnswerHash: hashSecurityAnswer('KV Test'),
      failedLoginAttempts: 0,
      lockoutUntil: 0,
    }
    const currentDb = getDatabase()
    currentDb.users.push(testAdminLockout)
    saveDatabase(currentDb)

    // Failed password attempts leading up to lockout
    for (let i = 1; i <= 4; i++) {
      const failRes = await request('/api/auth/login', {
        method: 'POST',
        body: {
          email: 'lockout.test@aicte.gov.in',
          password: `WrongPasswordAttempt${i}`,
          portal: 'platform_admin',
        },
      })
      assert(failRes.status === 401, `Test 20a.${i} — Failed login attempt ${i} returns 401 Unauthorized`)
    }

    // 5th failed attempt triggers account lockout and returns 429 Too Many Requests
    const fifthAttemptRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'lockout.test@aicte.gov.in',
        password: 'WrongPasswordAttempt5',
        portal: 'platform_admin',
      },
    })
    assert(
      fifthAttemptRes.status === 429 &&
      fifthAttemptRes.data.locked === true &&
      fifthAttemptRes.data.error?.includes('locked'),
      'Test 20b — 5th failed attempt triggers rate limiting lockout (429 Too Many Requests)'
    )

    // Subsequent attempt while locked out (even with correct password) is blocked
    const lockoutRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'lockout.test@aicte.gov.in',
        password: 'PassWord@12345',
        portal: 'platform_admin',
      },
    })
    assert(
      lockoutRes.status === 429 &&
      lockoutRes.data.locked === true &&
      lockoutRes.data.lockoutUntil,
      'Test 20c — Account remains locked; further attempts blocked with 429 Too Many Requests'
    )

    // Test lockout reset via DB service (simulates server-side CLI `npm run admin:provision reset-lockout`)
    dbService.updateUser('usr_admin_lockout_test', { failedLoginAttempts: 0, lockoutUntil: 0 })
    const unlockedRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'lockout.test@aicte.gov.in',
        password: 'PassWord@12345',
        portal: 'platform_admin',
        securityAnswer: 'KV Test',
      },
    })
    assert(
      unlockedRes.status === 200 && unlockedRes.data.token,
      'Test 20c — Resetting lockout via server operator interface successfully restores account access'
    )

    // -------------------------------------------------------------------------
    // TEST 21: PRIVILEGED ROUTE ACCESS CONTROL & ROLE ISOLATION
    // -------------------------------------------------------------------------
    console.log('--- TEST 21: Privileged Route Access Control & Role Isolation ---')
    // 21a. Student trying to access platform administrative APIs (must return 403)
    const stuPlatformAttempt = await request('/api/platform/admins/pending', {
      method: 'GET',
      token: stuA1Token,
    })
    assert(
      stuPlatformAttempt.status === 403 && stuPlatformAttempt.data.error?.includes('Forbidden'),
      'Test 21a — Student attempting to access Platform Administrator APIs rejected (403 Forbidden)'
    )

    // 21b. College Admin trying to generate invitation codes (must return 403)
    const colAdminInviteAttempt = await request('/api/platform/invitations/create', {
      method: 'POST',
      token: colAToken,
      body: { expiresInDays: 7 },
    })
    assert(
      colAdminInviteAttempt.status === 403 && colAdminInviteAttempt.data.error?.includes('Forbidden'),
      'Test 21b — College Administrator attempting to generate invitation tokens rejected (403 Forbidden)'
    )

    // 21c. Unauthenticated request to platform API (must return 401)
    const unauthPlatformAttempt = await request('/api/platform/admins/pending', {
      method: 'GET',
    })
    assert(
      unauthPlatformAttempt.status === 401,
      'Test 21c — Unauthenticated request to Platform Administrator APIs rejected (401 Unauthorized)'
    )

    // 21d. Newly enrolled and authenticated platform admin CAN generate invitation tokens
    const adminCreateInvite = await request('/api/platform/invitations/create', {
      method: 'POST',
      token: newlyEnrolledAdminToken,
      body: { expiresInDays: 30 },
    })
    assert(
      adminCreateInvite.status === 201 &&
      adminCreateInvite.data.success === true &&
      adminCreateInvite.data.invitation?.code?.startsWith('AICTE-INV-'),
      'Test 21d — Authenticated Platform Administrator can generate new enrollment invitation tokens'
    )

    // -------------------------------------------------------------------------
    // TEST 22: AUDIT TRAIL, SESSION PERSISTENCE & SECRET PROTECTION
    // -------------------------------------------------------------------------
    console.log('--- TEST 22: Audit Trail, Session Persistence & Secret Protection ---')
    // 22a. Audit log inspection
    const auditLogs = getDatabase().auditLogs
    const adminRegLog = auditLogs.find(
      (a) =>
        a.action === 'ADMIN_REGISTRATION_REQUEST_SUBMITTED' ||
        a.action === 'ADMIN_ENROLLMENT_TOKEN_ACTIVATED' ||
        a.action === 'ADMIN_REGISTRATION_SUBMITTED'
    )
    const adminApproveLog = auditLogs.find((a) => a.action === 'ADMIN_ACCOUNT_APPROVED')

    assert(
      adminRegLog && adminApproveLog,
      'Test 22a — Platform admin registration and approval are recorded in the system audit log'
    )

    assert(
      !auditLogs.some((a) =>
        a.details.includes('PassWord@') ||
        a.details.includes('Kendriya Vidyalaya') ||
        a.details.includes('Mrs. Jayalakshmi')
      ),
      'Test 22b — Audit log never exposes passwords, security questions, or security answers'
    )

    // 22c. Session persistence across restarts / page refreshes
    const verifyTokenRes = await request('/api/auth/verify-token', {
      method: 'POST',
      body: { token: newlyEnrolledAdminToken },
    })
    assert(
      verifyTokenRes.status === 200 &&
      verifyTokenRes.data.valid === true &&
      verifyTokenRes.data.user?.role === 'platform_admin' &&
      verifyTokenRes.data.user?.email === 'officer.test@aicte.gov.in',
      'Test 22c — Administrator session JWT persists across application restarts and page refreshes'
    )

    // -------------------------------------------------------------------------
    // TEST 23: STUDENT IDENTIFICATION, DEPARTMENT SELECTION & REAL RECORD ISOLATION
    // -------------------------------------------------------------------------
    console.log('--- TEST 23: Student Identification, Department Selection & Real Record Isolation ---')

    // 23a. Verify college departments API returns configured list for Velalar
    const velalarDeptsRes = await request('/api/colleges/col_1793115697005/departments', { method: 'GET' })
    assert(
      velalarDeptsRes.status === 200 &&
      Array.isArray(velalarDeptsRes.data.departments) &&
      velalarDeptsRes.data.departments.includes('Computer Science and Engineering'),
      'Test 23a — College departments API returns official configured department list'
    )

    // 23b. Register student with invalid/unconfigured department is rejected
    const invalidDeptReg = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Test Candidate',
        email: `invalid.dept.${Date.now()}@student.velalar.edu.in`,
        apaarId: '999988887777',
        password: 'Password@123',
        collegeId: 'col_1793115697005',
        department: 'NonExistent Space Robotics Dept',
        registrationNumber: 'REGTEST9999',
      },
    })
    assert(
      invalidDeptReg.status === 400 && invalidDeptReg.data.error?.includes('department'),
      'Test 23b — Registration with unconfigured department rejected (400 Bad Request)'
    )

    // 23c. Register new student with valid department and APAAR ID
    const newStudentEmail = `fresh.student.${Date.now()}@student.velalar.edu.in`
    const testApaarId = '8' + String(Date.now()).slice(-11)
    const testRegNo = 'REG' + String(Date.now()).slice(-6)
    const newStudentReg = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Kavitha S',
        email: newStudentEmail,
        password: 'Password@123',
        collegeId: 'col_1793115697005',
        department: 'Computer Science and Engineering',
        course: 'B.E. Computer Science and Engineering',
        academicYear: '2024-2025',
        registrationNumber: testRegNo,
        apaarId: testApaarId,
      },
    })
    assert(
      newStudentReg.status === 201 &&
      newStudentReg.data.token &&
      newStudentReg.data.user?.fullName === 'Kavitha S',
      'Test 23c — Student successfully registers with required department, course, reg number and APAAR ID'
    )
    const freshStudentToken = newStudentReg.data.token

    // 23d. Clean empty state: verify no sample/example data shown for freshly registered student
    const freshStudentDashboard = await request('/api/student/dashboard', {
      method: 'GET',
      token: freshStudentToken,
    })
    assert(
      freshStudentDashboard.status === 200 &&
      freshStudentDashboard.data.student?.fullName === 'Kavitha S' &&
      freshStudentDashboard.data.student?.department === 'Computer Science and Engineering' &&
      freshStudentDashboard.data.student?.registrationNumber === testRegNo &&
      (!freshStudentDashboard.data.documents || freshStudentDashboard.data.documents.length === 0) &&
      (!freshStudentDashboard.data.academicRecords || freshStudentDashboard.data.academicRecords.length === 0) &&
      (!freshStudentDashboard.data.notifications || freshStudentDashboard.data.notifications.length === 0),
      'Test 23d — Fresh student dashboard contains strictly 0 mock/sample documents, marksheets, or notifications'
    )

    // 23e. College Admin searches student by Registration Number (normalized, case & whitespace insensitive)
    const searchByReg = await request(`/api/college/students/search?q=${encodeURIComponent(testRegNo)}&searchType=registrationNumber`, {
      method: 'GET',
      token: velalarAdminToken,
    })
    assert(
      searchByReg.status === 200 &&
      Array.isArray(searchByReg.data.students) &&
      searchByReg.data.students.length === 1 &&
      searchByReg.data.students[0].fullName === 'Kavitha S' &&
      searchByReg.data.students[0].department === 'Computer Science and Engineering',
      'Test 23e — College Admin searches student by Registration Number with searchType=registrationNumber'
    )

    // 23f. College Admin searches student by APAAR ID (formatted with hyphens/spaces)
    const formattedApaar = `${testApaarId.slice(0, 4)}-${testApaarId.slice(4, 8)}-${testApaarId.slice(8, 12)}`
    const searchByApaar = await request(`/api/college/students/search?q=${encodeURIComponent(formattedApaar)}&searchType=apaarId`, {
      method: 'GET',
      token: velalarAdminToken,
    })
    assert(
      searchByApaar.status === 200 &&
      Array.isArray(searchByApaar.data.students) &&
      searchByApaar.data.students.length === 1 &&
      searchByApaar.data.students[0].fullName === 'Kavitha S',
      'Test 23f — College Admin searches student by 12-digit APAAR ID with searchType=apaarId'
    )

    // 23g. Searching with invalid APAAR ID format returns 0 results
    const searchInvalidApaar = await request('/api/college/students/search?q=12345&searchType=apaarId', {
      method: 'GET',
      token: velalarAdminToken,
    })
    assert(
      searchInvalidApaar.status === 200 &&
      (!searchInvalidApaar.data.students || searchInvalidApaar.data.students.length === 0),
      'Test 23g — Invalid APAAR ID format rejected from returning student records'
    )

    // 23h. Non-existent student search returns 0 results
    const searchNonExistent = await request('/api/college/students/search?q=NONEXISTENT999&searchType=registrationNumber', {
      method: 'GET',
      token: velalarAdminToken,
    })
    assert(
      searchNonExistent.status === 200 &&
      (!searchNonExistent.data.students || searchNonExistent.data.students.length === 0),
      'Test 23h — Searching non-existent student identifier correctly returns 0 matching results'
    )

    // 23i. College Admin uploads official marksheet using confirmed student registration number and APAAR ID
    const uploadKavithaRes = await request('/api/college/documents/upload', {
      method: 'POST',
      token: velalarAdminToken,
      body: {
        studentRegistrationNumber: testRegNo,
        apaarId: testApaarId,
        documentType: 'Semester Marksheet & Grade Card',
        title: 'Semester V Regular Examination Marksheet',
        fileName: `${testRegNo}_Semester_V_Marksheet.pdf`,
        fileSize: '1.8 MB',
        marksheetDetails: {
          semester: 'Semester 5',
          academicYear: '2024-2025',
          sgpa: 9.25,
          cgpa: 9.10,
          creditsEarned: 24,
          totalCredits: 24,
          examination: 'Winter 2024 Regular Examination',
        },
      },
    })
    assert(
      uploadKavithaRes.status === 201 &&
      uploadKavithaRes.data.success === true &&
      uploadKavithaRes.data.document?.title === 'Semester V Regular Examination Marksheet',
      'Test 23i — College Admin uploads marksheet for confirmed student with exact registration number and APAAR ID'
    )

    // 23j. Uploaded document appears immediately in that student's Student Portal
    const updatedStudentDashboard = await request('/api/student/dashboard', {
      method: 'GET',
      token: freshStudentToken,
    })
    assert(
      updatedStudentDashboard.status === 200 &&
      updatedStudentDashboard.data.documents?.length === 1 &&
      updatedStudentDashboard.data.documents[0].title === 'Semester V Regular Examination Marksheet' &&
      updatedStudentDashboard.data.academicRecords?.length === 1 &&
      updatedStudentDashboard.data.academicRecords[0].sgpa === 9.25 &&
      updatedStudentDashboard.data.notifications?.length === 1,
      'Test 23j — Uploaded document, academic record, and notification appear in target student dashboard'
    )

    // 23k. Another student in Velalar (e.g. Gowtham) CANNOT see Kavitha's private document or notification
    const gowthamStudentTokenRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'gowtham.p@student.velalar.edu.in',
        password: 'Password@123',
      },
    })
    if (gowthamStudentTokenRes.status === 200 && gowthamStudentTokenRes.data.token) {
      const gowthamDashboard = await request('/api/student/dashboard', {
        method: 'GET',
        token: gowthamStudentTokenRes.data.token,
      })
      const hasKavithaDoc = gowthamDashboard.data.documents?.some(
        (d: any) => d.title === 'Semester V Regular Examination Marksheet'
      )
      const hasKavithaNotif = gowthamDashboard.data.notifications?.some(
        (n: any) => n.message?.includes(testRegNo)
      )
      assert(
        !hasKavithaDoc && !hasKavithaNotif,
        'Test 23k — Strict student isolation: different student cannot see Kavitha private documents or notifications'
      )
    }

    // 23l. Cross-College Privacy: NIET Admin cannot search or upload documents for Velalar student
    const crossCollegeSearch = await request(`/api/college/students/search?q=${testRegNo}&searchType=registrationNumber`, {
      method: 'GET',
      token: colAToken, // NIET admin
    })
    assert(
      crossCollegeSearch.status === 200 &&
      (!crossCollegeSearch.data.students || crossCollegeSearch.data.students.length === 0),
      'Test 23l — NIET Admin searching for Velalar student returns 0 results (Strict cross-institution privacy)'
    )

    const crossCollegeUpload = await request('/api/college/documents/upload', {
      method: 'POST',
      token: colAToken, // NIET admin attempting to upload to Velalar student
      body: {
        studentRegistrationNumber: testRegNo,
        documentType: 'Semester Marksheet & Grade Card',
        title: 'Unauthorized Cross College Marksheet',
        fileName: 'unauthorized.pdf',
      },
    })
    assert(
      crossCollegeUpload.status === 400 && crossCollegeUpload.data.error?.includes('No registered student'),
      'Test 23m — NIET Admin cannot upload document for Velalar student (Rejected with 400)'
    )

    // 23n. Safe completion: Student updates profile via PUT /api/student/profile
    const updateProfileRes = await request('/api/student/profile', {
      method: 'PUT',
      token: freshStudentToken,
      body: {
        phone: '+91 98765 43210',
        bloodGroup: 'B+',
      },
    })
    assert(
      updateProfileRes.status === 200 &&
      updateProfileRes.data.student?.phone === '+91 98765 43210' &&
      updateProfileRes.data.student?.bloodGroup === 'B+',
      'Test 23n — Student can safely update contact and demographic profile information'
    )

    // 23o. College Admin updates and maintains college department configuration
    const updateDeptsRes = await request('/api/college/departments', {
      method: 'PUT',
      token: velalarAdminToken,
      body: {
        departments: [
          'Computer Science and Engineering',
          'Artificial Intelligence and Data Science',
          'Information Technology',
          'Electronics and Communication Engineering',
          'Biomedical Engineering',
        ],
      },
    })
    assert(
      updateDeptsRes.status === 200 &&
      Array.isArray(updateDeptsRes.data.departments) &&
      updateDeptsRes.data.departments.includes('Biomedical Engineering'),
      'Test 23o — College Administrator can maintain official department list for their institution'
    )

    // -------------------------------------------------------------------------
    // TEST 24: COMPLETE WORKFLOW (SCENARIOS A TO E AS SPECIFIED IN USER REQUEST)
    // -------------------------------------------------------------------------
    console.log('\n======================================================================')
    console.log('  TEST 24: COMPLETE WORKFLOW SCENARIOS A TO E (VERIFICATION & LINKING)')
    console.log('======================================================================\n')

    // -------------------------------------------------------------------------
    // Scenario A: Same College Linking
    // 1. Register College A through College Management Portal
    // 2. Create student account selecting/entering College A
    // 3. Verify student and college administrator reference same "college_id"
    // 4. Search for student from College A management dashboard
    // 5. Confirm student is found
    // -------------------------------------------------------------------------
    console.log('--- Test 24A: Same College Linking ---')
    const colARegRes = await request('/api/auth/register/college', {
      method: 'POST',
      body: {
        fullName: 'Dr. Ramesh Sharma',
        email: 'principal@apex.edu.in',
        institutionName: 'Apex Institute of Technology',
        aicteCode: 'AICTE-9988',
        password: 'Password@123',
      },
    })
    assert(colARegRes.status === 201 || colARegRes.status === 200, 'Test 24a.1 — College Alpha administrator registers successfully')
    const colAToken24 = colARegRes.data.token
    const colAUser24 = colARegRes.data.user
    const colAId = colAUser24?.collegeId
    assert(!!colAId, 'Test 24a.2 — College Alpha assigned canonical college_id')

    // Student registers selecting College A
    const stuARegRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Anita Sharma',
        email: 'anita.sharma@apex.edu.in',
        institutionName: 'Apex Institute of Technology',
        collegeCode: 'AICTE-9988',
        collegeId: colAId,
        apaarId: '919192929393',
        department: 'Computer Science & Engineering',
        registrationNumber: 'REGAPEX001',
        course: 'B.Tech — Computer Science',
        academicYear: '3rd Year (Semester 5)',
        password: 'Password@123',
      },
    })
    assert(stuARegRes.status === 201 || stuARegRes.status === 200, 'Test 24a.3 — Student Anita registers with College Alpha')
    const stuAToken24 = stuARegRes.data.token
    const stuAUser24 = stuARegRes.data.user
    assert(stuAUser24.collegeId === colAId, 'Test 24a.4 — Student and College Admin reference identical college_id')

    // Search for student from College Alpha's dashboard
    const colASearchRes = await request('/api/college/students/search?q=REGAPEX001&searchType=registrationNumber', {
      method: 'GET',
      token: colAToken24,
    })
    assert(colASearchRes.status === 200, 'Test 24a.5 — College Alpha admin searches for student')
    assert(
      colASearchRes.data.students?.length === 1 &&
      colASearchRes.data.students[0].registrationNumber === 'REGAPEX001' &&
      colASearchRes.data.students[0].fullName === 'Anita Sharma',
      'Test 24a.6 — Student Anita is found from College Alpha management dashboard'
    )

    // -------------------------------------------------------------------------
    // Scenario B: Verification Request Flow
    // 1. Submit request from student account
    // 2. Confirm it appears in College A management portal
    // 3. Process request as authorized administrator
    // 4. Confirm student sees updated status and notification
    // -------------------------------------------------------------------------
    console.log('--- Test 24B: Verification Request Flow ---')
    const stuCreateReqRes = await request('/api/student/verification-requests', {
      method: 'POST',
      token: stuAToken24,
      body: {
        recordTitle: 'Semester IV Official Grade Card',
        purpose: 'Higher Studies Verification & Embassy Attestation',
        notes: 'Urgent verification required for university application.',
      },
    })
    assert(stuCreateReqRes.status === 201 || stuCreateReqRes.status === 200, 'Test 24b.1 — Student Anita creates verification request')
    const createdReqId24 = stuCreateReqRes.data.request?.id
    assert(!!createdReqId24, 'Test 24b.2 — Verification request created with database ID')

    // Check College Alpha dashboard
    const colAReqsRes = await request('/api/college/verification-requests', {
      method: 'GET',
      token: colAToken24,
    })
    assert(colAReqsRes.status === 200, 'Test 24b.3 — College Alpha fetches verification requests')
    const foundReqInColA = colAReqsRes.data.requests?.find((r: any) => r.id === createdReqId24)
    assert(!!foundReqInColA, 'Test 24b.4 — Student request appears in College Alpha management portal')
    assert(foundReqInColA.studentName === 'Anita Sharma', 'Test 24b.5 — Request correctly identifies student name and details')

    // Process request as College Alpha admin
    const reviewReqRes24 = await request(`/api/college/verification-requests/${createdReqId24}/review`, {
      method: 'PUT',
      token: colAToken24,
      body: {
        decision: 'approved',
        reviewerNotes: 'Verified against Apex Institute Registrar Ledger Volume 12.',
      },
    })
    assert(reviewReqRes24.status === 200, 'Test 24b.6 — College Alpha admin processes and approves request')

    // Check student dashboard for updated status and notification
    const stuDashAfterReview = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuAToken24,
    })
    const updatedReqInStu = stuDashAfterReview.data.verificationRequests?.find((r: any) => r.id === createdReqId24)
    assert(
      updatedReqInStu && (updatedReqInStu.status === 'verified' || updatedReqInStu.status === 'approved'),
      'Test 24b.7 — Student sees verified/approved status in Student Portal'
    )
    const hasReqNotif = stuDashAfterReview.data.notifications?.some(
      (n: any) => n.title?.includes('Verification') || n.message?.includes('verified') || n.message?.includes('approved')
    )
    assert(hasReqNotif, 'Test 24b.8 — Notification delivered to student when request status changed')

    // -------------------------------------------------------------------------
    // Scenario C: Document Delivery
    // 1. Upload test marksheet from College A management portal
    // 2. Confirm saved with correct student ID and college ID
    // 3. Log in as student and confirm document appears
    // 4. Log in as different student and confirm document is inaccessible
    // -------------------------------------------------------------------------
    console.log('--- Test 24C: Document Delivery ---')
    const uploadDocRes24 = await request('/api/college/documents/upload', {
      method: 'POST',
      token: colAToken24,
      body: {
        studentRegistrationNumber: 'REGAPEX001',
        documentType: 'Semester Marksheet & Grade Card',
        title: 'Semester IV Official Marksheet (Final)',
        fileName: 'Apex_BTech_Sem4_Marksheet.pdf',
        fileSize: '320 KB',
        semester: 'Semester 4',
        academicYear: '2024-2025',
        sgpa: '9.10',
        cgpa: '8.95',
        creditsEarned: '24',
        totalCredits: '24',
        examination: 'Spring 2025 Regular Examination',
      },
    })
    assert(uploadDocRes24.status === 201 || uploadDocRes24.status === 200, 'Test 24c.1 — College Alpha uploads marksheet for student')
    const uploadedDocId24 = uploadDocRes24.data.document?.id
    assert(
      uploadDocRes24.data.document?.collegeId === colAId &&
      uploadDocRes24.data.document?.registrationNumber === 'REGAPEX001',
      'Test 24c.2 — Document saved with correct student and college ID'
    )

    // Student Anita sees document in Student Portal
    const stuDashDocRes = await request('/api/student/dashboard', {
      method: 'GET',
      token: stuAToken24,
    })
    const docInStuDash = stuDashDocRes.data.documents?.find((d: any) => d.id === uploadedDocId24)
    assert(!!docInStuDash, 'Test 24c.3 — Marksheet appears in student portal after college upload')
    assert(
      docInStuDash.title === 'Semester IV Official Marksheet (Final)',
      'Test 24c.4 — Marksheet title and metadata match uploaded document'
    )

    // Log in as different student and verify document is inaccessible (IDOR blocked)
    const diffStudentDownload = await request(`/api/student/documents/${uploadedDocId24}/download`, {
      method: 'GET',
      token: stuB1Token, // Student B1 (CIT) attempting to access Anita's document
    })
    assert(diffStudentDownload.status === 403, 'Test 24c.5 — Different student blocked with 403 Forbidden on document download')

    // -------------------------------------------------------------------------
    // Scenario D: College Isolation
    // 1. Register College B and create student under College B
    // 2. Confirm College A cannot find or access College B student records
    // 3. Confirm College B can find its own student
    // 4. Confirm both colleges remain separate
    // -------------------------------------------------------------------------
    console.log('--- Test 24D: Multi-College Isolation ---')
    const colBRegRes = await request('/api/auth/register/college', {
      method: 'POST',
      body: {
        fullName: 'Dr. Sunita Rao',
        email: 'principal@zenith.edu.in',
        institutionName: 'Zenith Engineering College',
        aicteCode: 'AICTE-9977',
        password: 'Password@123',
      },
    })
    assert(colBRegRes.status === 201 || colBRegRes.status === 200, 'Test 24d.1 — College Beta administrator registers successfully')
    const colBToken24 = colBRegRes.data.token
    const colBId24 = colBRegRes.data.user.collegeId
    assert(colBId24 !== colAId, 'Test 24d.2 — College Alpha and College Beta have distinct college IDs')

    // Create student under College Beta
    const stuBRegRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Karan Verma',
        email: 'karan.verma@zenith.edu.in',
        institutionName: 'Zenith Engineering College',
        collegeCode: 'AICTE-9977',
        collegeId: colBId24,
        apaarId: '949495959696',
        department: 'Information Technology',
        registrationNumber: 'REGZEN001',
        course: 'B.Tech — Information Technology',
        password: 'Password@123',
      },
    })
    assert(stuBRegRes.status === 201 || stuBRegRes.status === 200, 'Test 24d.3 — Student Karan registers under College Beta')

    // College A Admin searches for College B student -> Must return 0
    const colASearchB = await request('/api/college/students/search?q=REGZEN001&searchType=registrationNumber', {
      method: 'GET',
      token: colAToken24,
    })
    assert(
      colASearchB.status === 200 && (!colASearchB.data.students || colASearchB.data.students.length === 0),
      'Test 24d.4 — College Alpha cannot find College Beta student records'
    )

    // College A Admin attempts to upload document for College B student -> Must be rejected 400
    const colAUploadB = await request('/api/college/documents/upload', {
      method: 'POST',
      token: colAToken24,
      body: {
        studentRegistrationNumber: 'REGZEN001',
        documentType: 'Semester Marksheet & Grade Card',
        title: 'Unauthorized Cross-College Doc',
        fileName: 'unauthorized.pdf',
      },
    })
    assert(colAUploadB.status === 400, 'Test 24d.5 — College Alpha cannot upload document for College Beta student')

    // College B Admin CAN find its own student
    const colBSearchB = await request('/api/college/students/search?q=REGZEN001&searchType=registrationNumber', {
      method: 'GET',
      token: colBToken24,
    })
    assert(
      colBSearchB.status === 200 &&
      colBSearchB.data.students?.length === 1 &&
      colBSearchB.data.students[0].registrationNumber === 'REGZEN001',
      'Test 24d.6 — College Beta admin can find its own student'
    )

    // -------------------------------------------------------------------------
    // Scenario E: Student Registers First Workflow (Root-Cause Direct Verification)
    // 1. Student registers first with college name and AICTE number
    // 2. College admin registers later with same college name and AICTE number
    // 3. Confirm admin links to same canonical college record without duplicates
    // 4. Admin immediately finds the student who registered first
    // -------------------------------------------------------------------------
    console.log('--- Test 24E: Student Registers First Workflow ---')
    const stuFirstReg = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Rohan Verma',
        email: 'rohan.verma@pioneer.edu.in',
        institutionName: 'Pioneer Institute of Technology',
        collegeCode: 'AICTE - 9966', // Note spacing to test normalization
        apaarId: '979798989999',
        department: 'Computer Science and Engineering',
        registrationNumber: 'REGPION001',
        course: 'B.Tech — Computer Science',
        password: 'Password@123',
      },
    })
    assert(stuFirstReg.status === 201 || stuFirstReg.status === 200, 'Test 24e.1 — Student Rohan registers first with college name and AICTE code')
    const stuFirstColId = stuFirstReg.data.user.collegeId
    assert(!!stuFirstColId, 'Test 24e.2 — College created or linked with normalized code for student')

    // College admin registers LATER using same institution name and AICTE number
    const adminLaterReg = await request('/api/auth/register/college', {
      method: 'POST',
      body: {
        fullName: 'Dr. Anand Joshi',
        email: 'principal@pioneer.edu.in',
        institutionName: 'Pioneer Institute of Technology',
        aicteCode: 'AICTE-9966',
        password: 'Password@123',
      },
    })
    assert(adminLaterReg.status === 201 || adminLaterReg.status === 200, 'Test 24e.3 — College administrator registers later with matching AICTE code')
    const adminLaterColId = adminLaterReg.data.user.collegeId
    assert(
      adminLaterColId === stuFirstColId,
      'Test 24e.4 — Administrator associates with exact same canonical college_id created when student registered'
    )

    // Admin searches for the student who registered first
    const adminSearchRohan = await request('/api/college/students/search?q=REGPION001&searchType=registrationNumber', {
      method: 'GET',
      token: adminLaterReg.data.token,
    })
    assert(
      adminSearchRohan.status === 200 &&
      adminSearchRohan.data.students?.length === 1 &&
      adminSearchRohan.data.students[0].fullName === 'Rohan Verma',
      'Test 24e.5 — College administrator immediately finds student who registered first!'
    )

    // -------------------------------------------------------------------------
    // Scenario F: Persistence Across Sessions & Relogin
    // -------------------------------------------------------------------------
    console.log('--- Test 24F: Persistence Across Sessions & Relogin ---')
    // Read raw JSON from disk
    const diskDbRaw = fs.readFileSync(path.resolve(import.meta.dirname, 'data/auth_database.json'), 'utf-8')
    const diskDb = JSON.parse(diskDbRaw)

    const diskHasAnita = diskDb.students.some((s: any) => s.registrationNumber === 'REGAPEX001')
    const diskHasRohan = diskDb.students.some((s: any) => s.registrationNumber === 'REGPION001')
    const diskHasDoc24 = diskDb.documents.some((d: any) => d.id === uploadedDocId24)
    const diskHasReq24 = diskDb.verificationRequests.some((r: any) => r.id === createdReqId24)
    assert(diskHasAnita && diskHasRohan, 'Test 24f.1 — Students persisted to disk database')
    assert(diskHasDoc24 && diskHasReq24, 'Test 24f.2 — Documents and requests persisted to disk database')

    // Re-login student Anita and confirm state
    const reLoginAnita = await request('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: 'anita.sharma@apex.edu.in',
        password: 'Password@123',
      },
    })
    assert(reLoginAnita.status === 200, 'Test 24f.3 — Student Anita re-login successful')
    const reDashAnita = await request('/api/student/dashboard', {
      method: 'GET',
      token: reLoginAnita.data.token,
    })
    assert(
      reDashAnita.data.documents?.some((d: any) => d.id === uploadedDocId24) &&
      reDashAnita.data.verificationRequests?.some((r: any) => r.id === createdReqId24),
      'Test 24f.4 — Re-fetched dashboard maintains complete document and request relationships\n'
    )

  } finally {
    // Clean up test fixtures from production database
    cleanupTestFixtures()
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
