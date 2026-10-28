/**
 * Test: Student Registration Without Department
 * Direct invocation test suite verifying:
 * 1. Students can register by selecting a college without providing a department.
 * 2. Backend accepts registration and saves department as "" (empty string, NO fake department).
 * 3. Student record links accurately to the selected collegeId.
 * 4. Student can log in and view their dashboard and profile.
 * 5. College Administrator can search and find the student using registration number and APAAR ID.
 * 6. Other colleges cannot see the student (multi-tenant isolation).
 * 7. College Portal department management remains fully functional.
 */

import { EventEmitter } from 'node:events'
import { handleAuthRequest } from './authBackend.ts'
import { getDatabase, saveDatabase, dbService } from './portalDb.ts'

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

function mockApiCall(url: string, method: string = 'GET', body?: any, token?: string): Promise<{ status: number; data: any }> {
  const req: any = new EventEmitter()
  req.url = url
  req.method = method
  req.headers = {
    'content-type': 'application/json',
    ...(token ? { authorization: `Bearer ${token}` } : {})
  }
  req.body = body

  return new Promise<{ status: number; data: any }>((resolve) => {
    let responseData = ''
    const res: any = {
      statusCode: 200,
      setHeader: (_k: string, _v: string) => {},
      writeHead: (code: number) => {
        res.statusCode = code
      },
      end: (chunk?: any) => {
        if (chunk) responseData += chunk.toString()
        let parsed = {}
        try {
          parsed = JSON.parse(responseData)
        } catch {
          parsed = responseData
        }
        resolve({ status: res.statusCode, data: parsed })
      }
    }

    handleAuthRequest(req, res).then((handled) => {
      if (!handled) {
        resolve({ status: 404, data: { error: `Endpoint ${url} not handled` } })
      }
    }).catch((err: any) => {
      resolve({ status: 500, data: { error: err.message } })
    })
  })
}

async function runTests() {
  console.log('\n======================================================')
  console.log('🧪 VERIFYING STUDENT REGISTRATION WITHOUT DEPARTMENT')
  console.log('======================================================\n')

  const testApaar = '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, 10)
  const testEmail = `test.student.${Date.now()}@example.edu.in`
  const testRegNo = `REG-TEST-${Date.now().toString().slice(-5)}`
  const targetCollegeId = 'col_1793115697005' // Velalar College of Engineering and Technology

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Register Student Without Department
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Register Student without Department field ---')
    const regPayload = {
      fullName: 'Senthil Kumar',
      email: testEmail,
      institutionName: 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY',
      collegeId: targetCollegeId,
      collegeCode: 'AICTE-2026',
      apaarId: testApaar,
      password: 'StrongPassword@123',
      course: 'B.Tech - Artificial Intelligence',
      academicYear: '2nd Year (Semester 3)',
      registrationNumber: testRegNo,
      // NOTE: department field is completely omitted!
    }

    const regRes = await mockApiCall('/api/auth/register/student', 'POST', regPayload)

    assert(regRes.status === 201, `Registration returned status 201 Created (got ${regRes.status})`)
    assert(regRes.data.success === true, 'Response contains success: true')
    assert(regRes.data.redirectPath === '/student', 'Response contains redirectPath: /student')
    assert(typeof regRes.data.token === 'string' && regRes.data.token.length > 20, 'Response returned valid JWT token')
    const studentToken = regRes.data.token

    // -------------------------------------------------------------------------
    // TEST 2: Verify Database Record Integrity & No Fake Department
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Database integrity & verify department is empty (no fake department) ---')
    const db = getDatabase()
    const savedUser = db.users.find((u) => u.apaarId === testApaar)
    const savedStudent = db.students.find((s) => s.apaarId === testApaar)

    assert(Boolean(savedUser), 'User record exists in database')
    assert(savedUser?.role === 'student', 'User role is student')
    assert(savedUser?.collegeId === targetCollegeId, `User collegeId correctly links to ${targetCollegeId}`)

    assert(Boolean(savedStudent), 'Student record exists in database')
    assert(savedStudent?.collegeId === targetCollegeId, `Student record collegeId matches ${targetCollegeId}`)
    assert(savedStudent?.department === '', `Student department is empty string "" (NOT a dummy department; got: "${savedStudent?.department}")`)
    assert(savedStudent?.registrationNumber === testRegNo, `Student registrationNumber is ${testRegNo}`)

    // -------------------------------------------------------------------------
    // TEST 3: Student Login & Dashboard Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Student login and dashboard retrieval without department ---')
    const loginRes = await mockApiCall('/api/auth/login', 'POST', {
      portal: 'student',
      identifier: testApaar,
      password: 'StrongPassword@123',
    })

    assert(loginRes.status === 200, `Student login succeeded with 200 OK (got ${loginRes.status})`)
    assert(typeof loginRes.data.token === 'string', 'Login returns fresh JWT')
    assert(loginRes.data.user?.collegeId === targetCollegeId, `Logged in user has collegeId ${targetCollegeId}`)

    // Dashboard check
    const dashRes = await mockApiCall('/api/student/dashboard', 'GET', undefined, studentToken)
    assert(dashRes.status === 200, `Student dashboard endpoint returned 200 OK`)
    assert(dashRes.data.student?.apaarId === testApaar, `Dashboard returns student with correct APAAR ID`)
    assert(dashRes.data.student?.collegeId === targetCollegeId, `Dashboard reflects correct college link`)
    assert(dashRes.data.student?.department === '', `Dashboard student department is empty string ""`)

    // -------------------------------------------------------------------------
    // TEST 4: College Admin Search Can Find Student (via Reg No & APAAR ID)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: College Administrator student search ---')
    // Register or use admin for Velalar College
    const adminEmail = `admin.velalar.${Date.now()}@vcet.edu.in`
    const adminRegRes = await mockApiCall('/api/auth/register/college', 'POST', {
      fullName: 'Dr. VCET Registrar',
      email: adminEmail,
      institutionName: 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY',
      aicteCode: 'AICTE-2026',
      password: 'AdminPassword@123',
      departments: ['Computer Science and Engineering', 'Artificial Intelligence and Data Science'],
    })

    let adminToken: string
    if (adminRegRes.status === 201) {
      adminToken = adminRegRes.data.token
      assert(true, 'College Admin registered and authenticated')
    } else {
      const adminLogin = await mockApiCall('/api/auth/login', 'POST', {
        portal: 'college_admin',
        identifier: 'thangaraj@vcet.edu.in',
        password: 'Password@123',
      })
      adminToken = adminLogin.data.token
      assert(adminLogin.status === 200, 'College Admin logged in successfully')
    }

    // Search by Registration Number
    const searchByReg = await mockApiCall(`/api/college/students/search?q=${encodeURIComponent(testRegNo)}`, 'GET', undefined, adminToken)
    assert(searchByReg.status === 200, `Search by registration number returned 200 OK`)
    const foundByReg = searchByReg.data.students?.find((s: any) => s.apaarId === testApaar)
    assert(Boolean(foundByReg), `College Admin found the newly registered student by registration number (${testRegNo})`)

    // Search by APAAR ID
    const searchByApaar = await mockApiCall(`/api/college/students/search?q=${encodeURIComponent(testApaar)}`, 'GET', undefined, adminToken)
    assert(searchByApaar.status === 200, `Search by APAAR ID returned 200 OK`)
    const foundByApaar = searchByApaar.data.students?.find((s: any) => s.apaarId === testApaar)
    assert(Boolean(foundByApaar), `College Admin found the newly registered student by APAAR ID (${testApaar})`)

    // -------------------------------------------------------------------------
    // TEST 5: Multi-College Isolation (Unrelated College Admin cannot find student)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Multi-college tenant isolation ---')
    // Register separate admin for NIET
    const nietAdminEmail = `admin.niet.${Date.now()}@niet.edu.in`
    const nietReg = await mockApiCall('/api/auth/register/college', 'POST', {
      fullName: 'NIET Officer',
      email: nietAdminEmail,
      institutionName: 'National Institute of Engineering & Technology',
      aicteCode: 'NIET-2006-AICTE',
      password: 'AdminPassword@123',
      departments: ['Mechanical Engineering'],
    })

    if (nietReg.status === 201) {
      const nietToken = nietReg.data.token
      const nietSearch = await mockApiCall(`/api/college/students/search?q=${encodeURIComponent(testApaar)}`, 'GET', undefined, nietToken)
      const foundInOtherCollege = nietSearch.data.students?.some((s: any) => s.apaarId === testApaar)
      assert(!foundInOtherCollege, 'Unrelated college (NIET) CANNOT see Velalar College student (Isolation intact)')
    }

    // -------------------------------------------------------------------------
    // TEST 6: College Portal Department Management is Intact
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: College Portal Department Management remains intact ---')
    const deptsRes = await mockApiCall(`/api/colleges/${targetCollegeId}/departments`, 'GET', undefined, adminToken)
    assert(deptsRes.status === 200, `College departments endpoint returned 200 OK`)
    assert(Array.isArray(deptsRes.data.departments) && deptsRes.data.departments.length > 0, `College departments list is intact (${deptsRes.data.departments?.length} departments available)`)

    // Update departments as College Admin
    const existingDepts = deptsRes.data.departments || []
    const updatedDepts = [...existingDepts, 'Department of Emerging Technologies']
    const updateDeptRes = await mockApiCall('/api/college/departments', 'PUT', {
      departments: updatedDepts,
    }, adminToken)
    assert(updateDeptRes.status === 200, `College Admin can update departments via College Portal`)
    assert(updateDeptRes.data.departments?.includes('Department of Emerging Technologies'), `Updated departments include newly added department`)

    // -------------------------------------------------------------------------
    // TEST CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Test Cleanup ---')
    const cleanDb = getDatabase()
    cleanDb.users = cleanDb.users.filter((u) => u.apaarId !== testApaar && u.email !== adminEmail && u.email !== nietAdminEmail)
    cleanDb.students = cleanDb.students.filter((s) => s.apaarId !== testApaar)
    saveDatabase(cleanDb)
    console.log('  ✓ Test fixtures cleaned up successfully')

  } catch (err: any) {
    console.error('Test execution error:', err)
    failedCount++
  }

  console.log('\n======================================================')
  console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`)
  console.log('======================================================\n')

  if (failedCount > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
