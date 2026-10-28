import http from 'node:http'
import { handleAuthRequest } from './authBackend.ts'
import { getDatabase, saveDatabase } from './portalDb.ts'

const TEST_PORT = 54322
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
  console.log('  DEPARTMENT SELECTION & REGISTRATION FLOW VERIFICATION TEST SUITE')
  console.log('======================================================================\n')

  const server = http.createServer(async (req, res) => {
    try {
      const handled = await handleAuthRequest(req, res)
      if (!handled) {
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Route not found' }))
      }
    } catch (e: any) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: e.message }))
    }
  })

  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()))
  console.log(`Test server running on ${BASE_URL}\n`)

  try {
    // -------------------------------------------------------------------------
    // TEST A: Student Registration Flow
    // -------------------------------------------------------------------------
    console.log('--- TEST A: Student Registration Flow ---')
    // 1. Fetch colleges list
    const collegesRes = await request('/api/colleges')
    assert(collegesRes.status === 200 && Array.isArray(collegesRes.data.colleges) && collegesRes.data.colleges.length > 0,
      'Test A.1 — Authoritative colleges list loaded successfully')

    const testCollege = collegesRes.data.colleges.find((c: any) => c.id === 'col_niet_01') || collegesRes.data.colleges[0]
    assert(!!testCollege, `Test A.2 — Selected college: ${testCollege.name} (${testCollege.id})`)

    // 2. Fetch departments for selected college
    const deptsRes = await request(`/api/colleges/${testCollege.id}/departments`)
    assert(deptsRes.status === 200 && Array.isArray(deptsRes.data.departments) && deptsRes.data.departments.length > 0,
      `Test A.3 — Departments for ${testCollege.name} loaded (${deptsRes.data.departments.length} departments)`)

    const selectedDept = deptsRes.data.departments[0]

    // 3. Complete student registration
    const studentTimestamp = Date.now()
    const studentApaar = '7712' + String(studentTimestamp).slice(-8)
    const studentEmail = `student.test.${studentTimestamp}@student.niet.edu.in`
    const studentRegRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Aakash Verma',
        email: studentEmail,
        apaarId: studentApaar,
        password: 'Password@2026',
        collegeId: testCollege.id,
        institutionName: testCollege.name,
        department: selectedDept,
        course: 'B.Tech — Undergraduate Programme',
        academicYear: '1st Year (Semester 1)',
        registrationNumber: `REG${studentApaar.slice(-6)}`,
      },
    })

    assert(studentRegRes.status === 201 && studentRegRes.data.success === true,
      'Test A.4 — Student registration succeeded with HTTP 201')
    assert(studentRegRes.data.token && studentRegRes.data.user.role === 'student',
      'Test A.5 — Valid student session token generated for Student Portal navigation')
    assert(studentRegRes.data.profile.department === selectedDept,
      `Test A.6 — Selected department "${selectedDept}" correctly saved in student record`)
    assert(studentRegRes.data.profile.collegeId === testCollege.id,
      `Test A.7 — Selected college_id "${testCollege.id}" correctly associated with student record`)

    // -------------------------------------------------------------------------
    // TEST B: College Administrator Registration & Department Management Flow
    // -------------------------------------------------------------------------
    console.log('\n--- TEST B: College Registration & Department Management Flow ---')
    const collegeTimestamp = Date.now()
    const collegeAicteCode = `1-${String(collegeTimestamp).slice(-7)}`
    const collegeEmail = `registrar.${collegeTimestamp}@apextechnologies.edu.in`
    const collegeName = `Apex Institute of Advanced Technology ${collegeTimestamp}`
    const initialConfiguredDepts = [
      'Artificial Intelligence and Machine Learning',
      'Computer Science and Engineering',
      'Robotics and Automation',
      'Aerospace Engineering',
    ]

    // 1. Complete college admin registration with configured departments
    const colRegRes = await request('/api/auth/register/college', {
      method: 'POST',
      body: {
        fullName: 'Dr. Suresh Kumar',
        email: collegeEmail,
        institutionName: collegeName,
        aicteCode: collegeAicteCode,
        password: 'Password@2026',
        departments: initialConfiguredDepts,
      },
    })

    assert(colRegRes.status === 201 && colRegRes.data.success === true,
      'Test B.1 — College administrator registration succeeded with HTTP 201')
    assert(colRegRes.data.token && colRegRes.data.user.role === 'college_admin',
      'Test B.2 — Valid college_admin session token generated for College Portal navigation')

    const collegeAdminToken = colRegRes.data.token
    const newCollegeId = colRegRes.data.user.collegeId
    assert(!!newCollegeId, `Test B.3 — Assigned canonical college_id: ${newCollegeId}`)

    // 2. Verify that configured departments are stored in database and associated with college_id
    const newColDeptsRes = await request(`/api/colleges/${newCollegeId}/departments`)
    assert(
      newColDeptsRes.status === 200 &&
      Array.isArray(newColDeptsRes.data.departments) &&
      newColDeptsRes.data.departments.includes('Robotics and Automation') &&
      newColDeptsRes.data.departments.includes('Aerospace Engineering'),
      'Test B.4 — Configured departments successfully saved in database associated with college_id'
    )

    // 3. College administrator manages and updates departments via College Portal
    const updatedDepartments = [
      ...initialConfiguredDepts,
      'Quantum Computing & Cyber Physical Systems',
    ]
    const updateDeptsRes = await request('/api/college/departments', {
      method: 'PUT',
      token: collegeAdminToken,
      body: {
        departments: updatedDepartments,
      },
    })

    assert(updateDeptsRes.status === 200 && updateDeptsRes.data.success === true,
      'Test B.5 — College Portal PUT /api/college/departments succeeded')
    assert(
      Array.isArray(updateDeptsRes.data.departments) &&
      updateDeptsRes.data.departments.includes('Quantum Computing & Cyber Physical Systems'),
      'Test B.6 — Newly added department persisted to college record'
    )

    // -------------------------------------------------------------------------
    // TEST C: Existing College Department Linkage & Student Registration
    // -------------------------------------------------------------------------
    console.log('\n--- TEST C: Existing College Department Linkage ---')
    // 1. Enrolling student under the newly configured college
    const studentBTimestamp = Date.now() + 10
    const studentBApaar = '8823' + String(studentBTimestamp).slice(-8)
    const studentBEmail = `student.apex.${studentBTimestamp}@student.apextechnologies.edu.in`
    const studentBRegRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Meera Nambiar',
        email: studentBEmail,
        apaarId: studentBApaar,
        password: 'Password@2026',
        collegeId: newCollegeId,
        institutionName: collegeName,
        department: 'Quantum Computing & Cyber Physical Systems',
        course: 'B.Tech — Undergraduate Programme',
        academicYear: '1st Year (Semester 1)',
        registrationNumber: `REG${studentBApaar.slice(-6)}`,
      },
    })

    assert(studentBRegRes.status === 201 && studentBRegRes.data.success === true,
      'Test C.1 — Student successfully registers selecting college updated department')
    assert(studentBRegRes.data.profile.collegeId === newCollegeId,
      'Test C.2 — Student correctly linked to college_id in persistent database')
    assert(studentBRegRes.data.profile.department === 'Quantum Computing & Cyber Physical Systems',
      'Test C.3 — Student record maintains exact department association')

    // -------------------------------------------------------------------------
    // TEST D: Error Handling
    // -------------------------------------------------------------------------
    console.log('\n--- TEST D: Error Handling & Department Validation ---')
    // 1. Student selects a department NOT offered by the college -> Must reject with clear error
    const invalidDeptRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Test Imposter',
        email: `imposter.${Date.now()}@student.apextechnologies.edu.in`,
        apaarId: '991122334455',
        password: 'Password@2026',
        collegeId: newCollegeId,
        institutionName: collegeName,
        department: 'Unapproved Astrology Department',
      },
    })

    assert(invalidDeptRes.status === 400 && invalidDeptRes.data.error.includes('not offered by'),
      `Test D.1 — Unconfigured department rejected with HTTP 400 and clear error: "${invalidDeptRes.data.error}"`)

    // 2. Test college with no configured departments (or empty array)
    const emptyColId = `col_empty_${Date.now()}`
    const db = getDatabase()
    db.colleges.push({
      id: emptyColId,
      code: `AICTE-EMPTY-${Date.now().toString().slice(-4)}`,
      name: 'Unconfigured Rural Technical Campus',
      state: 'State',
      district: 'District',
      type: 'Affiliated',
      status: 'approved',
      contactEmail: 'contact@empty.edu.in',
      departments: [],
      createdAt: new Date().toISOString(),
    })
    saveDatabase(db)

    const emptyDeptRes = await request(`/api/colleges/${emptyColId}/departments`)
    assert(emptyDeptRes.status === 200 && Array.isArray(emptyDeptRes.data.departments) && emptyDeptRes.data.departments.length === 0,
      'Test D.2 — College with no configured departments returns clean empty array [] (allows fallback manual input)')

    // 3. Student registering for unconfigured college can provide department manually
    const emptyStudentApaar = '6622' + String(Date.now()).slice(-8)
    const emptyStudentRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Ramesh Patel',
        email: `ramesh.${Date.now()}@student.empty.edu.in`,
        apaarId: emptyStudentApaar,
        password: 'Password@2026',
        collegeId: emptyColId,
        institutionName: 'Unconfigured Rural Technical Campus',
        department: 'Agricultural Information Systems',
      },
    })

    assert(emptyStudentRes.status === 201 && emptyStudentRes.data.profile.department === 'Agricultural Information Systems',
      'Test D.3 — Student enrolling in unconfigured college completes registration with entered department')

    // 4. Test department loading failure for non-existent college
    const notFoundDeptRes = await request('/api/colleges/non_existent_college_id_9999/departments')
    assert(notFoundDeptRes.status === 200 && Array.isArray(notFoundDeptRes.data.departments) && notFoundDeptRes.data.departments.length === 0,
      'Test D.4 — Non-existent college returns empty array safely without server crashing')

    console.log('\n======================================================================')
    console.log(`  SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`)
    console.log('======================================================================\n')

    if (failedCount > 0) {
      process.exit(1)
    }
  } finally {
    server.close()
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e)
  process.exit(1)
})
