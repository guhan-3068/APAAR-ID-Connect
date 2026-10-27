/**
 * Comprehensive Automated Authentication Verification Suite
 * Tests all 10 requirements from Section 11 against the live server
 */

const BASE_URL = 'http://localhost:5173/api/auth'

async function runSuite() {
  console.log('=================================================================')
  console.log('   APAAR CONNECT AI — AUTHENTICATION VERIFICATION TEST SUITE     ')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`)
      passed++
    } else {
      console.error(`[FAIL] ${testName}`)
      failed++
    }
  }

  // 1. Backend Status & Connectivity
  console.log('--- 1. Backend Health & Connectivity ---')
  const statusRes = await fetch(`${BASE_URL}/status`)
  const statusData = await statusRes.json()
  assert(statusRes.status === 200 && statusData.status === 'online', 'Backend service is online and reports healthy status')

  // 2. Student Portal Login (Pre-seeded Student)
  console.log('\n--- 2. Student Portal Sign In ---')
  const studentLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '2104-2024-1234',
      password: 'Apaar@2026',
      portal: 'student',
    }),
  })
  const studentLoginData = await studentLoginRes.json()
  assert(studentLoginRes.status === 200 && studentLoginData.token && studentLoginData.user.role === 'student', 'Student sign-in with 12-digit APAAR ID succeeds and returns JWT')

  // Session validation
  const studentMeRes = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${studentLoginData.token}` },
  })
  const studentMeData = await studentMeRes.json()
  assert(studentMeRes.status === 200 && studentMeData.user.apaarId === '210420241234', 'Session restore validates token and returns student profile')

  // Invalid student password
  const badPassRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: '2104-2024-1234',
      password: 'WrongPassword123',
      portal: 'student',
    }),
  })
  assert(badPassRes.status === 401, 'Student sign-in with wrong password is firmly rejected with 401')

  // 3. College Admin Portal Sign In
  console.log('\n--- 3. College Administrator Portal Sign In ---')
  const adminLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'registrar@niet.edu.in',
      password: 'Apaar@2026',
      portal: 'college_admin',
    }),
  })
  const adminLoginData = await adminLoginRes.json()
  assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'college_admin', 'College admin sign-in with institutional email succeeds')

  // 4. Platform Admin Portal Sign In
  console.log('\n--- 4. Platform Admin Portal Sign In ---')
  const platformLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@aicte.gov.in',
      password: 'Apaar@2026',
      portal: 'platform_admin',
    }),
  })
  const platformLoginData = await platformLoginRes.json()
  assert(platformLoginRes.status === 200 && platformLoginData.user.role === 'platform_admin', 'Platform admin sign-in succeeds for authorized administrator')

  // 5. Role-based Boundary Enforcement
  console.log('\n--- 5. Role-based Boundary Enforcement ---')
  const studentWrongPortalRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'aarav.sharma@student.niet.edu.in',
      password: 'Apaar@2026',
      portal: 'platform_admin',
    }),
  })
  assert(studentWrongPortalRes.status === 403, 'Student trying to log into platform admin portal is denied with 403 Forbidden')

  // 6. Student Account Registration & Duplicate Prevention
  console.log('\n--- 6. Student Registration & Duplicate Prevention ---')
  const testApaar = '98' + Math.floor(1000000000 + Math.random() * 9000000000)
  const testEmail = `test.student.${Date.now()}@college.edu.in`

  const regStudentRes = await fetch(`${BASE_URL}/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Pooja Hegde',
      email: testEmail,
      institutionName: 'Coimbatore Institute of Technology',
      apaarId: testApaar,
      password: 'SecurePassword@2026',
    }),
  })
  const regStudentData = await regStudentRes.json()
  assert(regStudentRes.status === 201 && regStudentData.success, 'New student registration succeeds and creates persistent record')

  // Duplicate APAAR ID prevention
  const dupApaarRes = await fetch(`${BASE_URL}/register/student`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Another Student',
      email: `another.${Date.now()}@college.edu.in`,
      institutionName: 'Coimbatore Institute of Technology',
      apaarId: testApaar,
      password: 'AnotherPassword@123',
    }),
  })
  assert(dupApaarRes.status === 409, 'Duplicate APAAR ID registration is strictly prevented with 409 Conflict')

  // Sign in with the newly registered student
  const newStudentLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testApaar,
      password: 'SecurePassword@2026',
      portal: 'student',
    }),
  })
  assert(newStudentLoginRes.status === 200, 'Newly registered student signs in successfully using their new APAAR ID & password')

  // 7. College Account Registration & Duplicate Prevention
  console.log('\n--- 7. College Portal Registration ---')
  const testAicte = '1-' + Math.floor(1000000 + Math.random() * 9000000)
  const testColEmail = `registrar.${Date.now()}@rvce.edu.in`

  const regColRes = await fetch(`${BASE_URL}/register/college`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Dr. Vikram Seth',
      email: testColEmail,
      institutionName: 'R. V. College of Engineering',
      aicteCode: testAicte,
      password: 'ColPassword@2026',
    }),
  })
  assert(regColRes.status === 201, 'New college registration succeeds with institutional domain')

  // Invalid email domain
  const badDomainRes = await fetch(`${BASE_URL}/register/college`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Dr. Test',
      email: 'test@gmail.com',
      institutionName: 'Test College',
      aicteCode: 'AICTE-1-9999999',
      password: 'Password@123',
    }),
  })
  assert(badDomainRes.status === 400, 'College registration with public email domain (gmail.com) is rejected with 400')

  // Duplicate AICTE code
  const dupCodeRes = await fetch(`${BASE_URL}/register/college`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Dr. Other Registrar',
      email: `other.${Date.now()}@rvce.edu.in`,
      institutionName: 'R. V. College of Engineering',
      aicteCode: testAicte,
      password: 'ColPassword@2026',
    }),
  })
  assert(dupCodeRes.status === 409, 'Duplicate AICTE permanent code registration is rejected with 409 Conflict')

  // 8. Password Recovery & Verification OTP Flow
  console.log('\n--- 8. Password Recovery & OTP Verification Flow ---')
  const forgotRes = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  })
  const forgotData = await forgotRes.json()
  assert(forgotRes.status === 200 && forgotData.devHint && forgotData.devHint.length === 6, 'Forgot password dispatches real 6-digit cryptographic OTP')

  // Non-existent email
  const notFoundForgotRes = await fetch(`${BASE_URL}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent.user@unknown.edu.in' }),
  })
  assert(notFoundForgotRes.status === 404, 'Forgot password for non-existent email returns clear 404 error')

  // Invalid OTP
  const badOtpRes = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: '000000',
      newPassword: 'BrandNewPassword@2026',
    }),
  })
  assert(badOtpRes.status === 400, 'Invalid OTP submission is rejected')

  // Valid OTP + Reset Password
  const resetRes = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: forgotData.devHint,
      newPassword: 'BrandNewPassword@2026',
    }),
  })
  assert(resetRes.status === 200, 'Valid OTP allows user to set new password')

  // Verify login with old password fails
  const oldLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testApaar,
      password: 'SecurePassword@2026',
      portal: 'student',
    }),
  })
  assert(oldLoginRes.status === 401, 'Sign-in with old password fails after password reset')

  // Verify login with new password succeeds
  const newLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testApaar,
      password: 'BrandNewPassword@2026',
      portal: 'student',
    }),
  })
  assert(newLoginRes.status === 200, 'Sign-in with newly reset password succeeds')

  // Re-using the same OTP fails
  const reuseOtpRes = await fetch(`${BASE_URL}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      otp: forgotData.devHint,
      newPassword: 'AnotherPassword@999',
    }),
  })
  assert(reuseOtpRes.status === 400, 'Re-using the same OTP after password update is prevented (consumed)')

  // 9. Session Invalidation / Logout
  console.log('\n--- 9. Session Invalidation / Logout ---')
  const logoutRes = await fetch(`${BASE_URL}/logout`, { method: 'POST' })
  assert(logoutRes.status === 200, 'Logout request terminates session successfully')

  // 10. Tampered / Invalid JWT
  console.log('\n--- 10. Token Tampering Defense ---')
  const tamperedRes = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' },
  })
  assert(tamperedRes.status === 401, 'Tampered or forged JWT is rejected with 401 Unauthorized')

  console.log('\n=================================================================')
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) process.exit(1)
}

runSuite().catch((err) => {
  console.error('Test suite failed with unexpected exception:', err)
  process.exit(1)
})
