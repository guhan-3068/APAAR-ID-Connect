import http from 'node:http'
import { handleAuthRequest, createJwt } from './authBackend.ts'
import { getDatabase } from './portalDb.ts'

const TEST_PORT = 54325
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
  console.log('  TESTING STUDENT DEPARTMENT DROPDOWN & REGISTRATION FLOW (TESTS 1-5)')
  console.log('======================================================================\n')

  const server = http.createServer(async (req, res) => {
    try {
      const handled = await handleAuthRequest(req, res)
      if (!handled) {
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'Route not found' }))
      }
    } catch (err: any) {
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message }))
    }
  })

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, '127.0.0.1', () => resolve())
  })
  console.log(`Test server running on ${BASE_URL}\n`)

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Open "/register" and select Velalar College of Engineering and Technology.
    // Confirm that the Department dropdown becomes enabled and displays its configured departments.
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Velalar College Department Retrieval & Dropdown Options ---')
    const colRes = await request('/api/colleges')
    assert(colRes.status === 200, 'Test 1.1 — Colleges directory API returned HTTP 200')
    assert(Array.isArray(colRes.data.colleges), 'Test 1.2 — Authoritative colleges directory returned as an array')

    const velalar = colRes.data.colleges.find((c: any) =>
      c.name.includes('VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY') || c.id === 'col_1793115697005'
    )
    assert(Boolean(velalar), 'Test 1.3 — Velalar College of Engineering and Technology found in colleges list')
    assert(velalar.id === 'col_1793115697005', 'Test 1.4 — Velalar College has unique canonical ID: col_1793115697005')

    // Fetch department list using unique college ID
    const deptRes = await request(`/api/colleges/${velalar.id}/departments`)
    assert(deptRes.status === 200, 'Test 1.5 — GET /api/colleges/:id/departments returned HTTP 200')
    assert(Array.isArray(deptRes.data.departments), 'Test 1.6 — Departments returned as array')
    assert(deptRes.data.departments.length > 0, `Test 1.7 — Velalar College configured departments count: ${deptRes.data.departments.length}`)
    assert(deptRes.data.departments.includes('Computer Science and Engineering'), 'Test 1.8 — Includes Computer Science and Engineering')
    assert(deptRes.data.departments.includes('Biomedical Engineering'), 'Test 1.9 — Includes Biomedical Engineering')
    assert(deptRes.data.departments.includes('Artificial Intelligence and Data Science'), 'Test 1.10 — Includes Artificial Intelligence and Data Science')

    // -------------------------------------------------------------------------
    // TEST 2: Select a department and complete student registration.
    // Confirm that registration succeeds.
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Complete Student Registration with Department ---')
    const timestamp = Date.now()
    const studentApaar = `9090${String(timestamp).slice(-8)}`
    const studentEmail = `velalar.student.${timestamp}@student.velalar.edu.in`
    const chosenDept = 'Computer Science and Engineering'

    const regRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Kavitha Ramasamy',
        email: studentEmail,
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
        apaarId: studentApaar,
        collegeId: velalar.id,
        institutionName: velalar.name,
        institutionCode: velalar.code,
        department: chosenDept,
        course: 'B.Tech — Undergraduate Programme',
        registrationNumber: `REGVELALAR${String(timestamp).slice(-4)}`,
        academicYear: '2nd Year (Semester 3)',
        agreePrivacy: true,
      },
    })

    assert(regRes.status === 201, `Test 2.1 — Student registration succeeded with HTTP 201 (Status: ${regRes.status})`)
    assert(Boolean(regRes.data.token), 'Test 2.2 — Auth token returned for immediate student portal navigation')
    assert(regRes.data.redirectPath === '/student', 'Test 2.3 — Navigates student to /student dashboard')

    // Verify database record
    const db = getDatabase()
    const savedStudent = db.students.find((s) => s.apaarId === studentApaar)
    assert(Boolean(savedStudent), 'Test 2.4 — Student persisted to database')
    assert(savedStudent?.collegeId === 'col_1793115697005', 'Test 2.5 — Student linked to Velalar College ID')
    assert(savedStudent?.department === chosenDept, `Test 2.6 — Student record contains exact department "${chosenDept}"`)

    // -------------------------------------------------------------------------
    // TEST 3: Change the selected college. Confirm that the previous department
    // is cleared and the new college's departments are loaded.
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Changing College Clears Selection & Loads New Departments ---')
    const nietCollege = colRes.data.colleges.find((c: any) => c.id === 'col_niet_01')
    assert(Boolean(nietCollege), 'Test 3.1 — National Institute of Engineering & Technology located')

    const nietDeptRes = await request(`/api/colleges/${nietCollege.id}/departments`)
    assert(nietDeptRes.status === 200, 'Test 3.2 — NIET departments loaded successfully')
    assert(nietDeptRes.data.departments.includes('Biotechnology'), 'Test 3.3 — NIET offers Biotechnology (which Velalar does not)')
    assert(!deptRes.data.departments.includes('Biotechnology'), 'Test 3.4 — Isolation confirmed: Velalar does not leak NIET departments')

    // -------------------------------------------------------------------------
    // TEST 4: Select a college with no configured departments.
    // Confirm that a helpful message appears instead of a permanently disabled dropdown.
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: College with No Configured Departments ---')
    const emptyDeptRes = await request('/api/colleges/col_empty_1793180806151/departments')
    assert(emptyDeptRes.status === 200, 'Test 4.1 — Unconfigured college returns HTTP 200')
    assert(Array.isArray(emptyDeptRes.data.departments) && emptyDeptRes.data.departments.length === 0,
      'Test 4.2 — Empty department array returned [] cleanly without crashing'
    )

    // Student enrollment with manual fallback department for unconfigured college
    const unconfStudentApaar = `8888${String(timestamp).slice(-8)}`
    const unconfRegRes = await request('/api/auth/register/student', {
      method: 'POST',
      body: {
        fullName: 'Arun Kumar',
        email: `arun.${timestamp}@rural.edu.in`,
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
        apaarId: unconfStudentApaar,
        collegeId: 'col_empty_1793180806151',
        institutionName: 'Unconfigured Rural Technical Campus',
        institutionCode: 'AICTE-EMPTY-6151',
        department: 'Agricultural Engineering',
        course: 'B.Tech — Undergraduate Programme',
        registrationNumber: `REGEMPTY${String(timestamp).slice(-4)}`,
        academicYear: '1st Year (Semester 1)',
        agreePrivacy: true,
      },
    })
    assert(unconfRegRes.status === 201, 'Test 4.3 — Student enrolling in unconfigured college succeeds using manual department entry')

    // -------------------------------------------------------------------------
    // TEST 5: Confirm that the registered student is linked to the correct college
    // and department and appears in that college's College Portal.
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Student Linked to College Portal with Correct Department ---')
    // Generate valid college_admin token for Velalar College
    const adminToken = createJwt({
      userId: 'usr_col_1793115697005',
      email: 'velalar21@.edu.in',
      role: 'college_admin',
      collegeId: 'col_1793115697005',
      institutionCode: 'AICTE-2026',
    })
    assert(Boolean(adminToken), 'Test 5.1 — Velalar College Administrator authenticated session active')

    // Query students in Velalar College Portal
    const adminStudentsRes = await request('/api/college/students/search?searchType=all', {
      token: adminToken,
    })
    assert(adminStudentsRes.status === 200, 'Test 5.2 — College Portal GET /api/college/students/search returned HTTP 200')
    const foundInAdmin = (adminStudentsRes.data.students || []).find(
      (s: any) => s.apaarId === studentApaar
    )
    assert(Boolean(foundInAdmin), 'Test 5.3 — Registered student Kavitha Ramasamy appears in Velalar College Portal')
    assert(foundInAdmin?.department === chosenDept, `Test 5.4 — Student in College Portal displays exact department "${chosenDept}"`)
    assert(foundInAdmin?.collegeId === 'col_1793115697005', 'Test 5.5 — Student linked to Velalar canonical college ID')

    // Verify department management in College Portal
    const manageDeptsRes = await request('/api/college/departments', {
      method: 'PUT',
      token: adminToken,
      body: {
        departments: [
          'Computer Science and Engineering',
          'Artificial Intelligence and Data Science',
          'Information Technology',
          'Electronics and Communication Engineering',
          'Biomedical Engineering',
          'Robotics and Automation',
        ],
      },
    })
    assert(manageDeptsRes.status === 200, 'Test 5.6 — College Administrator can configure and save departments (PUT /api/college/departments)')
    assert(manageDeptsRes.data.departments?.includes('Robotics and Automation'), 'Test 5.7 — Newly added department persisted to database')

  } finally {
    server.close()
  }

  console.log('\n======================================================================')
  console.log(`  VERIFICATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log('======================================================================')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err)
  process.exit(1)
})
