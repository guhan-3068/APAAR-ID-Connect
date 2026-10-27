import crypto from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  dbService,
  hashPassword,
  verifyPassword,
  getDatabase,
  saveDatabase,
  type UserRecord,
  type StudentRecord,
} from './portalDb.ts'

const JWT_SECRET = process.env.JWT_SECRET || 'apaar-connect-ai-sec-key-2026-sih-token'

// ─────────────────────────────────────────────────────────────────────────────
// JWT SIGNING & VERIFICATION (HMAC-SHA256)
// ─────────────────────────────────────────────────────────────────────────────

export function createJwt(payload: Record<string, any>, expiresInSeconds: number = 86400): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  }

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyJwt(token: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { valid: false, error: 'Invalid token structure' }
    const [header, payload, signature] = parts

    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url')

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, 'utf-8'),
        Buffer.from(expectedSignature, 'utf-8')
      )
    ) {
      return { valid: false, error: 'Invalid token signature' }
    }

    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
    const now = Math.floor(Date.now() / 1000)
    if (decodedPayload.exp && decodedPayload.exp < now) {
      return { valid: false, error: 'Token has expired' }
    }

    return { valid: true, payload: decodedPayload }
  } catch (err: any) {
    return { valid: false, error: err.message || 'Token verification failed' }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST & RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body !== undefined && (req as any).body !== null) {
    const raw = (req as any).body
    if (typeof raw === 'object') return Promise.resolve(raw)
    if (typeof raw === 'string') {
      try {
        return Promise.resolve(JSON.parse(raw))
      } catch {
        return Promise.resolve({})
      }
    }
  }

  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON payload'))
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.end(JSON.stringify(data))
}

function authenticate(req: IncomingMessage): { user: UserRecord; payload: any } | null {
  const authHeader = req.headers['authorization']
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const verification = verifyJwt(token)
  if (!verification.valid || !verification.payload) return null

  const user = dbService.findUserById(verification.payload.userId)
  if (!user) return null

  return { user, payload: verification.payload }
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL ROUTER DISPATCHER
// ─────────────────────────────────────────────────────────────────────────────

export async function handleAuthRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || ''
  if (!url.startsWith('/api')) return false

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.end()
    return true
  }

  const [endpoint, queryString] = url.split('?')
  const queryParams = new URLSearchParams(queryString || '')

  try {
    // ═════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION ROUTES (/api/auth/*)
    // ═════════════════════════════════════════════════════════════

    if (endpoint === '/api/auth/status' && req.method === 'GET') {
      const db = getDatabase()
      sendJson(res, 200, {
        status: 'online',
        service: 'APAAR CONNECT Central Authentication & Database Service',
        version: '3.0.0',
        database: 'persistent_relational_store',
        collegesCount: db.colleges.length,
        studentsCount: db.students.length,
        documentsCount: db.documents.length,
        timestamp: new Date().toISOString(),
      })
      return true
    }

    if (endpoint === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req)
      const identifier = (body.identifier || body.email || '').trim()
      const password = body.password || ''
      const portal = body.portal

      if (!identifier || !password) {
        sendJson(res, 400, { error: 'Identifier (APAAR ID or Email) and password are required.' })
        return true
      }

      const cleanInput = identifier
      const cleanDigits = cleanInput.replace(/\D/g, '')
      const db = getDatabase()

      let matchedUser: UserRecord | undefined

      if (portal === 'student' || (cleanDigits.length === 12 && !cleanInput.includes('@'))) {
        matchedUser = db.users.find(
          (u) =>
            u.role === 'student' &&
            u.apaarId &&
            u.apaarId.replace(/\D/g, '') === cleanDigits
        )
      } else {
        matchedUser = db.users.find(
          (u) => u.email.toLowerCase() === cleanInput.toLowerCase()
        )
      }

      if (!matchedUser) {
        sendJson(res, 401, {
          error:
            portal === 'student'
              ? 'Invalid APAAR ID or password. Please verify your 12-digit number.'
              : 'Invalid credentials. Please verify your identifier and password.',
        })
        return true
      }

      if (portal && portal !== matchedUser.role) {
        sendJson(res, 403, {
          error: `This account has role "${matchedUser.role}" and is not authorized to sign in through the ${portal} portal.`,
        })
        return true
      }

      const isMatch = verifyPassword(password, matchedUser.passwordHash)
      if (!isMatch) {
        sendJson(res, 401, { error: 'Invalid credentials. Incorrect password entered.' })
        return true
      }

      if (matchedUser.status === 'pending_approval') {
        sendJson(res, 403, { error: 'Institutional account is pending approval by the Platform Administrator.' })
        return true
      }

      if (matchedUser.status === 'suspended') {
        sendJson(res, 403, { error: 'Account has been temporarily suspended. Contact nodal authority.' })
        return true
      }

      // Find College ID for College Admin or Student
      let collegeId = matchedUser.collegeId
      if (!collegeId && matchedUser.institutionCode) {
        const c = dbService.findCollegeByCode(matchedUser.institutionCode)
        if (c) collegeId = c.id
      }

      const studentRecord = matchedUser.role === 'student'
        ? db.students.find((s) => s.userId === matchedUser?.id || (matchedUser?.apaarId && s.apaarId === matchedUser.apaarId))
        : undefined

      const token = createJwt({
        userId: matchedUser.id,
        email: matchedUser.email,
        role: matchedUser.role,
        apaarId: matchedUser.apaarId,
        collegeId: collegeId || studentRecord?.collegeId,
        studentId: studentRecord?.id,
        institutionCode: matchedUser.institutionCode,
      })

      sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: matchedUser.id,
          fullName: matchedUser.fullName,
          email: matchedUser.email,
          role: matchedUser.role,
          apaarId: matchedUser.apaarId,
          collegeId: collegeId || studentRecord?.collegeId,
          institutionName: matchedUser.institutionName || studentRecord?.institutionName,
          institutionCode: matchedUser.institutionCode || studentRecord?.institutionCode,
        },
        profile: studentRecord,
      })
      return true
    }

    if (endpoint === '/api/auth/me' && req.method === 'GET') {
      const auth = authenticate(req)
      if (!auth) {
        sendJson(res, 401, { error: 'Invalid session token' })
        return true
      }

      const db = getDatabase()
      let studentRecord: StudentRecord | undefined
      if (auth.user.role === 'student') {
        studentRecord = db.students.find(
          (s) => s.userId === auth.user.id || (auth.user.apaarId && s.apaarId === auth.user.apaarId)
        )
      }

      sendJson(res, 200, {
        success: true,
        user: {
          id: auth.user.id,
          fullName: auth.user.fullName,
          email: auth.user.email,
          role: auth.user.role,
          apaarId: auth.user.apaarId,
          collegeId: auth.user.collegeId || studentRecord?.collegeId,
          institutionName: auth.user.institutionName || studentRecord?.institutionName,
          institutionCode: auth.user.institutionCode || studentRecord?.institutionCode,
        },
        profile: studentRecord,
      })
      return true
    }

    if (endpoint === '/api/auth/register/student' && req.method === 'POST') {
      const body = await parseBody(req)
      const { fullName, email, institutionName, apaarId, password, collegeCode, registrationNumber } = body

      if (!fullName || !email || !institutionName || !apaarId || !password) {
        sendJson(res, 400, { error: 'Full name, email, institution, APAAR ID, and password are required.' })
        return true
      }

      const cleanApaarId = apaarId.replace(/\D/g, '')
      if (cleanApaarId.length !== 12) {
        sendJson(res, 400, { error: 'APAAR ID must be exactly 12 digits.' })
        return true
      }

      if (password.length < 8) {
        sendJson(res, 400, { error: 'Password must be at least 8 characters long.' })
        return true
      }

      const db = getDatabase()

      const existingApaar = db.users.find(
        (u) => u.apaarId && u.apaarId.replace(/\D/g, '') === cleanApaarId
      )
      if (existingApaar) {
        sendJson(res, 409, { error: `APAAR ID ${apaarId} is already registered. Please sign in.` })
        return true
      }

      const existingEmail = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )
      if (existingEmail) {
        sendJson(res, 409, { error: `Email address ${email} is already associated with an account.` })
        return true
      }

      // Find or assign college
      let matchedCollege = collegeCode ? dbService.findCollegeByCode(collegeCode) : undefined
      if (!matchedCollege) {
        matchedCollege = db.colleges.find((c) =>
          c.name.toLowerCase().includes(institutionName.trim().toLowerCase())
        ) || db.colleges[0]
      }

      const userId = `usr_stu_${Date.now()}`
      const studentId = `stu_${cleanApaarId}`
      const finalRegNo = registrationNumber?.trim() || `REG${cleanApaarId.slice(-6)}`

      const newUser: UserRecord = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        apaarId: cleanApaarId,
        role: 'student',
        collegeId: matchedCollege.id,
        institutionName: matchedCollege.name,
        institutionCode: matchedCollege.code,
        passwordHash: hashPassword(password),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      const newStudent: StudentRecord = {
        id: studentId,
        userId,
        collegeId: matchedCollege.id,
        institutionName: matchedCollege.name,
        institutionCode: matchedCollege.code,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        apaarId: cleanApaarId,
        registrationNumber: finalRegNo,
        admissionNumber: `ADM${finalRegNo}`,
        department: 'Engineering / Applied Sciences',
        course: 'Undergraduate Program',
        yearOfStudy: '1st Year',
        semester: 'Semester 1',
        phone: '',
        dob: '01 Jan 2004',
        gender: 'Other',
        bloodGroup: 'Unknown',
        digilockerConnected: false,
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
      }

      db.users.push(newUser)
      db.students.push(newStudent)
      saveDatabase(db)

      const token = createJwt({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        apaarId: newUser.apaarId,
        collegeId: matchedCollege.id,
        studentId: newStudent.id,
      })

      sendJson(res, 201, {
        success: true,
        message: 'Student account registered successfully.',
        token,
        user: newUser,
        profile: newStudent,
      })
      return true
    }

    if (endpoint === '/api/auth/register/college' && req.method === 'POST') {
      const body = await parseBody(req)
      const { fullName, email, institutionName, aicteCode, password } = body

      if (!fullName || !email || !institutionName || !aicteCode || !password) {
        sendJson(res, 400, { error: 'All fields are required.' })
        return true
      }

      if (!/\.(edu\.in|gov\.in|ac\.in|nic\.in)$/i.test(email.trim())) {
        sendJson(res, 400, {
          error: 'Official institutional email must end with an authorized domain (.edu.in, .gov.in, .ac.in, .nic.in).',
        })
        return true
      }

      if (password.length < 8) {
        sendJson(res, 400, { error: 'Password must be at least 8 characters long.' })
        return true
      }

      const db = getDatabase()

      const existingEmail = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )
      if (existingEmail) {
        sendJson(res, 409, { error: `Institutional email ${email} is already registered.` })
        return true
      }

      const existingCode = db.colleges.find(
        (c) => c.code.toLowerCase() === aicteCode.trim().toLowerCase()
      )
      if (existingCode) {
        sendJson(res, 409, { error: `College code ${aicteCode} is already registered.` })
        return true
      }

      const collegeId = `col_${Date.now()}`
      const userId = `usr_col_${Date.now()}`

      const newCollege = {
        id: collegeId,
        code: aicteCode.trim(),
        name: institutionName.trim(),
        state: 'All India',
        district: 'Administrative HQ',
        type: 'AICTE Recognized Technical Institution',
        status: 'approved' as const,
        contactEmail: email.trim().toLowerCase(),
        adminUserId: userId,
        createdAt: new Date().toISOString(),
      }

      const newUser: UserRecord = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'college_admin',
        collegeId: newCollege.id,
        institutionName: newCollege.name,
        institutionCode: newCollege.code,
        passwordHash: hashPassword(password),
        status: 'approved',
        createdAt: new Date().toISOString(),
      }

      db.colleges.push(newCollege)
      db.users.push(newUser)
      saveDatabase(db)

      const token = createJwt({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        collegeId: newCollege.id,
        institutionCode: newCollege.code,
      })

      sendJson(res, 201, {
        success: true,
        message: 'College institution registered successfully.',
        token,
        user: newUser,
        college: newCollege,
      })
      return true
    }

    if (endpoint === '/api/auth/forgot-password' && req.method === 'POST') {
      const body = await parseBody(req)
      const { email } = body
      if (!email) {
        sendJson(res, 400, { error: 'Registered email address is required.' })
        return true
      }

      const db = getDatabase()
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!user) {
        sendJson(res, 404, { error: `No registered account found with email: ${email}` })
        return true
      }

      const otp = crypto.randomInt(100000, 999999).toString()
      user.resetOtp = { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 }
      saveDatabase(db)

      sendJson(res, 200, {
        success: true,
        message: `A 6-digit OTP has been generated for ${email}.`,
        devHint: otp,
      })
      return true
    }

    if (endpoint === '/api/auth/reset-password' && req.method === 'POST') {
      const body = await parseBody(req)
      const { email, otp, newPassword } = body
      if (!email || !otp || !newPassword) {
        sendJson(res, 400, { error: 'Email, OTP, and new password are required.' })
        return true
      }

      const db = getDatabase()
      const user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
      if (!user || !user.resetOtp) {
        sendJson(res, 400, { error: 'No active password reset request found for this email.' })
        return true
      }

      if (Date.now() > user.resetOtp.expiresAt) {
        delete user.resetOtp
        saveDatabase(db)
        sendJson(res, 400, { error: 'Verification OTP has expired. Please request a new one.' })
        return true
      }

      if (user.resetOtp.code !== otp.trim()) {
        sendJson(res, 400, { error: 'Invalid verification OTP.' })
        return true
      }

      user.passwordHash = hashPassword(newPassword)
      delete user.resetOtp
      saveDatabase(db)

      sendJson(res, 200, { success: true, message: 'Password has been updated successfully.' })
      return true
    }

    if (endpoint === '/api/auth/logout' && req.method === 'POST') {
      sendJson(res, 200, { success: true, message: 'Logged out successfully.' })
      return true
    }

    // ═════════════════════════════════════════════════════════════
    // 2. STUDENT PORTAL ROUTES (/api/student/*)
    // ═════════════════════════════════════════════════════════════

    if (endpoint.startsWith('/api/student')) {
      const auth = authenticate(req)
      if (!auth) {
        sendJson(res, 401, { error: 'Unauthorized: Authentication token required.' })
        return true
      }
      if (auth.user.role !== 'student') {
        sendJson(res, 403, { error: 'Forbidden: Student authorization required.' })
        return true
      }

      if (endpoint === '/api/student/dashboard' && req.method === 'GET') {
        const dashboard = dbService.getStudentDashboard(auth.user.id)
        if (!dashboard) {
          sendJson(res, 404, { error: 'Student academic dossier not found.' })
          return true
        }
        sendJson(res, 200, { success: true, ...dashboard })
        return true
      }

      if (endpoint === '/api/student/verification-requests' && req.method === 'POST') {
        const body = await parseBody(req)
        const { recordTitle, purpose, notes } = body
        if (!recordTitle || !purpose) {
          sendJson(res, 400, { error: 'Record title and verification purpose are required.' })
          return true
        }

        const result = dbService.submitVerificationRequest({
          studentUserId: auth.user.id,
          recordTitle,
          purpose,
          notes,
        })

        if (!result.success) {
          sendJson(res, 400, { error: result.error })
          return true
        }

        sendJson(res, 201, { success: true, request: result.request })
        return true
      }

      if (endpoint.startsWith('/api/student/documents/') && endpoint.endsWith('/download') && req.method === 'GET') {
        const docId = endpoint.split('/')[4]
        const db = getDatabase()
        const student = db.students.find((s) => s.userId === auth.user.id)
        const doc = db.documents.find((d) => d.id === docId)

        if (!doc) {
          sendJson(res, 404, { error: 'Document not found' })
          return true
        }

        // Security check: Only the owning student may download their document
        if (!student || doc.studentId !== student.id) {
          sendJson(res, 403, { error: 'Forbidden: You do not have permission to access this document.' })
          return true
        }

        sendJson(res, 200, {
          success: true,
          document: {
            id: doc.id,
            title: doc.title,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            fileData: doc.fileData,
            mimeType: doc.mimeType,
            hashDigest: doc.hashDigest,
          },
        })
        return true
      }

      if (endpoint.startsWith('/api/student/notifications/') && endpoint.endsWith('/read') && req.method === 'PUT') {
        const notifId = endpoint.split('/')[4]
        dbService.markNotificationRead(auth.user.id, notifId)
        sendJson(res, 200, { success: true })
        return true
      }

      if (endpoint === '/api/student/notifications/read-all' && req.method === 'PUT') {
        const student = dbService.findStudentByUserId(auth.user.id)
        dbService.markAllNotificationsRead(auth.user.id, student?.collegeId)
        sendJson(res, 200, { success: true })
        return true
      }
    }

    // ═════════════════════════════════════════════════════════════
    // 3. COLLEGE MANAGEMENT PORTAL ROUTES (/api/college/*)
    // ═════════════════════════════════════════════════════════════

    if (endpoint.startsWith('/api/college')) {
      const auth = authenticate(req)
      if (!auth) {
        sendJson(res, 401, { error: 'Unauthorized: Authentication token required.' })
        return true
      }
      if (auth.user.role !== 'college_admin') {
        sendJson(res, 403, { error: 'Forbidden: College Administrator authorization required.' })
        return true
      }

      // Derive authorized College ID directly from verified user record
      const db = getDatabase()
      const college = db.colleges.find(
        (c) =>
          c.adminUserId === auth.user.id ||
          (auth.user.collegeId && c.id === auth.user.collegeId) ||
          (auth.user.institutionCode && c.code.toLowerCase() === auth.user.institutionCode.toLowerCase())
      )

      if (!college) {
        sendJson(res, 403, { error: 'Authorized college institution profile not found for this administrator.' })
        return true
      }

      if (endpoint === '/api/college/dashboard' && req.method === 'GET') {
        const dashboard = dbService.getCollegeDashboard(auth.user)
        sendJson(res, 200, { success: true, ...dashboard })
        return true
      }

      if (endpoint === '/api/college/students/search' && req.method === 'GET') {
        const q = queryParams.get('q') || ''
        const students = dbService.searchStudentsInCollege(college.id, q)
        sendJson(res, 200, { success: true, students })
        return true
      }

      if (endpoint === '/api/college/documents/upload' && req.method === 'POST') {
        const body = await parseBody(req)
        const {
          studentRegistrationNumber,
          documentType,
          title,
          fileName,
          fileSize,
          fileData,
          marksheetDetails,
        } = body

        if (!studentRegistrationNumber || !documentType || !title || !fileName) {
          sendJson(res, 400, {
            error: 'Student Registration Number, document type, document title, and file are required.',
          })
          return true
        }

        const result = dbService.uploadDocument({
          collegeId: college.id,
          adminUserId: auth.user.id,
          studentRegistrationNumber,
          documentType,
          title,
          fileName,
          fileSize: fileSize || '1.2 MB',
          fileData,
          marksheetDetails,
        })

        if (!result.success) {
          sendJson(res, 404, { error: result.error })
          return true
        }

        sendJson(res, 201, {
          success: true,
          message: `Official document "${title}" uploaded and registered for student ${result.document?.studentName} (${result.document?.registrationNumber}).`,
          document: result.document,
          academicRecord: result.academicRecord,
        })
        return true
      }

      if (endpoint.startsWith('/api/college/documents/') && endpoint.endsWith('/review') && req.method === 'PUT') {
        const docId = endpoint.split('/')[4]
        const body = await parseBody(req)
        const { status, correctionNotes } = body

        const result = dbService.reviewDocument({
          collegeId: college.id,
          adminUserId: auth.user.id,
          documentId: docId,
          status,
          correctionNotes,
        })

        if (!result.success) {
          sendJson(res, 403, { error: result.error })
          return true
        }

        sendJson(res, 200, { success: true, document: result.document })
        return true
      }

      if (endpoint.startsWith('/api/college/verification-requests/') && endpoint.endsWith('/review') && req.method === 'PUT') {
        const reqId = endpoint.split('/')[4]
        const body = await parseBody(req)
        const { decision, reviewerNotes } = body

        if (!decision || !['approved', 'rejected', 'returned_for_correction'].includes(decision)) {
          sendJson(res, 400, { error: 'Valid decision ("approved", "rejected", "returned_for_correction") is required.' })
          return true
        }

        const result = dbService.reviewVerificationRequest({
          collegeId: college.id,
          adminUserId: auth.user.id,
          requestId: reqId,
          decision,
          reviewerNotes,
        })

        if (!result.success) {
          sendJson(res, 403, { error: result.error })
          return true
        }

        sendJson(res, 200, { success: true, request: result.request })
        return true
      }
    }

    // ═════════════════════════════════════════════════════════════
    // 4. PLATFORM ADMINISTRATION ROUTES (/api/platform/*)
    // ═════════════════════════════════════════════════════════════

    if (endpoint.startsWith('/api/platform')) {
      const auth = authenticate(req)
      if (!auth) {
        sendJson(res, 401, { error: 'Unauthorized: Authentication token required.' })
        return true
      }
      if (auth.user.role !== 'platform_admin') {
        sendJson(res, 403, { error: 'Forbidden: Platform Administrator privileges required.' })
        return true
      }

      if (endpoint === '/api/platform/dashboard' && req.method === 'GET') {
        const dashboard = dbService.getPlatformDashboard()
        sendJson(res, 200, { success: true, ...dashboard })
        return true
      }

      if (endpoint.startsWith('/api/platform/colleges/') && endpoint.endsWith('/details') && req.method === 'GET') {
        const colId = endpoint.split('/')[4]
        const details = dbService.getCollegeDetailsForPlatform(colId)
        if (!details) {
          sendJson(res, 404, { error: 'College record not found.' })
          return true
        }
        sendJson(res, 200, { success: true, ...details })
        return true
      }

      if (endpoint.startsWith('/api/platform/colleges/') && endpoint.endsWith('/status') && req.method === 'PUT') {
        const colId = endpoint.split('/')[4]
        const body = await parseBody(req)
        const { status } = body
        const db = getDatabase()
        const col = db.colleges.find((c) => c.id === colId)
        if (!col) {
          sendJson(res, 404, { error: 'College not found' })
          return true
        }
        col.status = status
        saveDatabase(db)
        sendJson(res, 200, { success: true, college: col })
        return true
      }
    }

    // ═════════════════════════════════════════════════════════════
    // 5. PUBLIC VERIFICATION TOOL ROUTE (/api/public/*)
    // ═════════════════════════════════════════════════════════════

    if (endpoint === '/api/public/verify' && req.method === 'POST') {
      const body = await parseBody(req)
      const { query } = body
      if (!query) {
        sendJson(res, 400, { error: 'APAAR ID or College Registration Number is required.' })
        return true
      }

      const cleanDigits = query.trim().replace(/\D/g, '')
      const cleanText = query.trim().toUpperCase()
      const db = getDatabase()

      const student = db.students.find(
        (s) =>
          (cleanDigits.length === 12 && s.apaarId && s.apaarId.replace(/\D/g, '') === cleanDigits) ||
          s.registrationNumber.trim().toUpperCase() === cleanText
      )

      if (!student) {
        sendJson(res, 404, {
          success: false,
          verified: false,
          message: `No active academic registry record found for query: "${query}".`,
        })
        return true
      }

      const college = db.colleges.find((c) => c.id === student.collegeId)
      const verifiedDocsCount = db.documents.filter(
        (d) => d.studentId === student.id && d.reviewStatus === 'accepted_for_verification'
      ).length

      // Mask sensitive digits
      const maskedApaar = student.apaarId
        ? `•••• •••• ${student.apaarId.slice(-4)}`
        : 'Not Assigned'

      sendJson(res, 200, {
        success: true,
        verified: true,
        record: {
          fullName: student.fullName,
          maskedApaar,
          registrationNumber: student.registrationNumber,
          institutionName: college?.name || student.institutionName,
          institutionCode: college?.code || student.institutionCode,
          department: student.department,
          course: student.course,
          status: student.verificationStatus,
          verifiedDocumentsCount: verifiedDocsCount,
          lastVerifiedAt: new Date().toLocaleDateString('en-IN'),
        },
      })
      return true
    }

    sendJson(res, 404, { error: `Endpoint ${endpoint} not found.` })
    return true
  } catch (err: any) {
    console.error('[API SERVER ERROR]', err)
    sendJson(res, 500, { error: err.message || 'Internal server error' })
    return true
  }
}
