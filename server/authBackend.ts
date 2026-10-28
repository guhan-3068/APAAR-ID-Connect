import crypto from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  dbService,
  hashPassword,
  verifyPassword,
  hashSecurityAnswer,
  verifySecurityAnswer,
  normalizeSecurityAnswer,
  normalizeInstitutionCode,
  normalizeInstitutionName,
  getDatabase,
  saveDatabase,
  type UserRecord,
  type StudentRecord,
  type CollegeRecord,
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

    if ((endpoint === '/api/colleges' || endpoint === '/api/auth/colleges') && req.method === 'GET') {
      const db = getDatabase()
      const colleges = db.colleges
        .filter((c) => c.status === 'approved' || c.status === 'active')
        .map((c) => ({
          id: c.id,
          code: c.code,
          name: c.name,
          state: c.state,
          district: c.district,
          type: c.type,
          departments: dbService.getCollegeDepartments(c.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name))

      sendJson(res, 200, { success: true, colleges })
      return true
    }

    if (endpoint.startsWith('/api/colleges/') && endpoint.endsWith('/departments') && req.method === 'GET') {
      const parts = endpoint.split('/')
      const colId = parts[3]
      const departments = dbService.getCollegeDepartments(colId)
      sendJson(res, 200, { success: true, collegeId: colId, departments })
      return true
    }

    if (endpoint === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req)
      const identifier = (body.identifier || body.email || body.username || '').trim()
      const password = body.password || ''
      const portal = body.portal
      const securityAnswer = body.securityAnswer

      if (!identifier || !password) {
        sendJson(res, 400, { error: 'Identifier (APAAR ID, Email, or Username) and password are required.' })
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
          (u) =>
            u.email.toLowerCase() === cleanInput.toLowerCase() ||
            (u.username && u.username.toLowerCase() === cleanInput.toLowerCase())
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

      // Check account lockout
      if (matchedUser.lockoutUntil && matchedUser.lockoutUntil > Date.now()) {
        const remainingMinutes = Math.max(1, Math.ceil((matchedUser.lockoutUntil - Date.now()) / 60000))
        sendJson(res, 429, {
          error: `Account is temporarily locked due to excessive failed attempts. Please retry in ${remainingMinutes} minute(s).`,
          locked: true,
          remainingMinutes,
          lockoutUntil: matchedUser.lockoutUntil,
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
        matchedUser.failedLoginAttempts = (matchedUser.failedLoginAttempts || 0) + 1
        if (matchedUser.failedLoginAttempts >= 5) {
          matchedUser.lockoutUntil = Date.now() + 15 * 60 * 1000 // 15-minute lockout
          saveDatabase(db)
          sendJson(res, 429, {
            error: 'Account temporarily locked for 15 minutes due to 5 consecutive failed attempts.',
            locked: true,
          })
          return true
        }
        saveDatabase(db)
        sendJson(res, 401, {
          error: `Invalid credentials. Incorrect password entered. (${5 - matchedUser.failedLoginAttempts} attempts remaining before temporary lockout)`,
        })
        return true
      }

      if (matchedUser.status === 'pending_approval') {
        sendJson(res, 403, {
          error:
            matchedUser.role === 'platform_admin'
              ? 'Platform Administrator registration is pending authorization and approval by the Central AICTE Platform Authority.'
              : 'Institutional account is pending approval by the Platform Administrator.',
          pendingApproval: true,
          requiresApproval: true,
        })
        return true
      }

      if (matchedUser.status === 'suspended') {
        sendJson(res, 403, { error: 'Account has been temporarily suspended. Contact nodal authority.' })
        return true
      }

      // Platform Administrator Security Question Verification
      if (matchedUser.role === 'platform_admin' && matchedUser.securityQuestion && matchedUser.securityAnswerHash) {
        // If security answer was provided in login request, verify it immediately
        if (securityAnswer) {
          const isAnswerMatch = verifySecurityAnswer(securityAnswer, matchedUser.securityAnswerHash)
          if (!isAnswerMatch) {
            matchedUser.failedLoginAttempts = (matchedUser.failedLoginAttempts || 0) + 1
            if (matchedUser.failedLoginAttempts >= 5) {
              matchedUser.lockoutUntil = Date.now() + 15 * 60 * 1000
            }
            saveDatabase(db)
            sendJson(res, 401, {
              error: 'Security challenge failed: Incorrect security question answer.',
              securityChallengeFailed: true,
            })
            return true
          }
        } else if (body.directLogin !== true && portal === 'platform_admin') {
          // Two-step challenge prompt: Return security question to verify
          const challengeToken = createJwt(
            {
              userId: matchedUser.id,
              role: matchedUser.role,
              purpose: 'security_challenge',
            },
            300 // 5-minute validity
          )

          sendJson(res, 200, {
            success: true,
            requireSecurityChallenge: true,
            question: matchedUser.securityQuestion,
            securityQuestion: matchedUser.securityQuestion,
            challengeToken,
            user: {
              id: matchedUser.id,
              fullName: matchedUser.fullName,
              email: matchedUser.email,
              username: matchedUser.username,
              role: matchedUser.role,
            },
          })
          return true
        }
      }

      // Successful login: reset failed attempts & lockout
      matchedUser.failedLoginAttempts = 0
      matchedUser.lockoutUntil = 0
      saveDatabase(db)

      // Find College ID for College Admin or Student
      let collegeId = matchedUser.collegeId
      if (!collegeId && matchedUser.institutionCode) {
        const c = dbService.findCollegeByCode(matchedUser.institutionCode)
        if (c) collegeId = c.id
      }

      const studentRecord = matchedUser.role === 'student'
        ? db.students.find((s) => s.userId === matchedUser?.id || (matchedUser?.apaarId && s.apaarId === matchedUser.apaarId))
        : undefined

      const effectiveCollegeId = collegeId || studentRecord?.collegeId
      const college = effectiveCollegeId ? dbService.findCollegeById(effectiveCollegeId) : undefined
      const effectiveInstitutionName = college ? college.name : (matchedUser.institutionName || studentRecord?.institutionName)
      const effectiveInstitutionCode = college ? college.code : (matchedUser.institutionCode || studentRecord?.institutionCode)

      // Keep user and student profile synchronized with authoritative college
      if (college) {
        matchedUser.collegeId = college.id
        matchedUser.institutionName = college.name
        matchedUser.institutionCode = college.code
        if (studentRecord) {
          studentRecord.collegeId = college.id
          studentRecord.institutionName = college.name
          studentRecord.institutionCode = college.code
        }
      }

      const token = createJwt({
        userId: matchedUser.id,
        email: matchedUser.email,
        username: matchedUser.username,
        role: matchedUser.role,
        apaarId: matchedUser.apaarId,
        collegeId: effectiveCollegeId,
        studentId: studentRecord?.id,
        institutionCode: effectiveInstitutionCode,
      })

      sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: matchedUser.id,
          fullName: matchedUser.fullName,
          email: matchedUser.email,
          username: matchedUser.username,
          role: matchedUser.role,
          apaarId: matchedUser.apaarId,
          collegeId: effectiveCollegeId,
          institutionName: effectiveInstitutionName,
          institutionCode: effectiveInstitutionCode,
        },
        profile: studentRecord
          ? {
            ...studentRecord,
            collegeId: effectiveCollegeId || studentRecord.collegeId,
            institutionName: effectiveInstitutionName,
            institutionCode: effectiveInstitutionCode,
          }
          : undefined,
      })
      return true
    }

    if (endpoint === '/api/auth/verify-security-challenge' && req.method === 'POST') {
      const body = await parseBody(req)
      const { challengeToken, securityAnswer } = body

      if (!challengeToken || !securityAnswer) {
        sendJson(res, 400, { error: 'Challenge session token and security answer are required.' })
        return true
      }

      const verification = verifyJwt(challengeToken)
      if (!verification.valid || !verification.payload || verification.payload.purpose !== 'security_challenge') {
        sendJson(res, 401, { error: 'Security challenge session has expired or is invalid. Please sign in again.' })
        return true
      }

      const db = getDatabase()
      const user = db.users.find((u) => u.id === verification.payload.userId)
      if (!user) {
        sendJson(res, 404, { error: 'Administrator account not found.' })
        return true
      }

      // Check lockout
      if (user.lockoutUntil && user.lockoutUntil > Date.now()) {
        const remainingMinutes = Math.max(1, Math.ceil((user.lockoutUntil - Date.now()) / 60000))
        sendJson(res, 429, {
          error: `Account is temporarily locked due to excessive failed attempts. Please retry in ${remainingMinutes} minute(s).`,
          locked: true,
          remainingMinutes,
        })
        return true
      }

      const isMatch = verifySecurityAnswer(securityAnswer, user.securityAnswerHash)
      if (!isMatch) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
        if (user.failedLoginAttempts >= 5) {
          user.lockoutUntil = Date.now() + 15 * 60 * 1000
        }
        saveDatabase(db)
        sendJson(res, 401, {
          error: `Incorrect security answer. Access denied. (${5 - user.failedLoginAttempts} attempts remaining before temporary lockout)`,
          remainingAttempts: Math.max(0, 5 - user.failedLoginAttempts),
        })
        return true
      }

      // Success: Reset failed attempts & lockout
      user.failedLoginAttempts = 0
      user.lockoutUntil = 0
      saveDatabase(db)

      const token = createJwt({
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      })

      sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
        },
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

      const effectiveCollegeId = auth.user.collegeId || studentRecord?.collegeId
      const college = effectiveCollegeId ? dbService.findCollegeById(effectiveCollegeId) : undefined
      const effectiveInstitutionName = college ? college.name : (auth.user.institutionName || studentRecord?.institutionName)
      const effectiveInstitutionCode = college ? college.code : (auth.user.institutionCode || studentRecord?.institutionCode)

      sendJson(res, 200, {
        success: true,
        user: {
          id: auth.user.id,
          fullName: auth.user.fullName,
          email: auth.user.email,
          role: auth.user.role,
          apaarId: auth.user.apaarId,
          collegeId: effectiveCollegeId,
          institutionName: effectiveInstitutionName,
          institutionCode: effectiveInstitutionCode,
        },
        profile: studentRecord
          ? {
            ...studentRecord,
            collegeId: effectiveCollegeId || studentRecord.collegeId,
            institutionName: effectiveInstitutionName,
            institutionCode: effectiveInstitutionCode,
          }
          : undefined,
      })
      return true
    }

    if (endpoint === '/api/auth/verify-token' && req.method === 'POST') {
      const body = await parseBody(req)
      const token =
        body.token || (req.headers.authorization ? req.headers.authorization.replace('Bearer ', '').trim() : '')
      if (!token) {
        sendJson(res, 400, { valid: false, error: 'Token is required.' })
        return true
      }

      const verified = verifyJwt(token)
      if (!verified.valid || !verified.payload) {
        sendJson(res, 401, { valid: false, error: 'Invalid or expired token.' })
        return true
      }

      const db = getDatabase()
      const user = db.users.find((u) => u.id === verified.payload.userId)
      if (!user) {
        sendJson(res, 404, { valid: false, error: 'User not found.' })
        return true
      }

      sendJson(res, 200, {
        valid: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role,
        },
      })
      return true
    }

    if (endpoint === '/api/auth/register/student' && req.method === 'POST') {
      const body = await parseBody(req)
      const {
        fullName,
        email,
        institutionName,
        apaarId,
        password,
        collegeCode,
        collegeId,
        registrationNumber,
        department,
        course,
        academicYear,
      } = body

      if (!fullName || !email || (!institutionName && !collegeId) || !apaarId || !password) {
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

      // 1. Authoritative College Selection & Resolution
      let matchedCollege: CollegeRecord | undefined

      // Match by unique collegeId if provided
      if (collegeId) {
        matchedCollege = dbService.findCollegeById(collegeId)
      }

      // Match by code if provided
      if (!matchedCollege && (collegeCode || body.aicteCode)) {
        matchedCollege = dbService.findCollegeByCode(collegeCode || body.aicteCode)
      }

      // Match by name using normalized comparison
      if (!matchedCollege && institutionName) {
        matchedCollege = dbService.findCollegeByName(institutionName)
      }

      // If still not matched, preserve the student's selected college with normalized code
      if (!matchedCollege) {
        const newColId = `col_${Date.now()}`
        const finalCollegeName = (institutionName || 'AICTE Technical Institution').trim()
        const rawCode = collegeCode || body.aicteCode || `COL-${cleanApaarId.slice(-4)}`
        const finalCode = normalizeInstitutionCode(rawCode)
        matchedCollege = {
          id: newColId,
          code: finalCode,
          name: finalCollegeName,
          state: 'All India',
          district: 'Administrative HQ',
          type: 'AICTE Recognized Technical Institution',
          status: 'approved',
          contactEmail: email.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
        }
        db.colleges.push(matchedCollege)
      }

      // 2. Department Resolution & Validation (Optional)
      let finalDepartment = (department || '').trim()
      const collegeDepartments = dbService.getCollegeDepartments(matchedCollege.id)

      if (finalDepartment) {
        if (collegeDepartments && collegeDepartments.length > 0) {
          const cleanDept = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim()
          const normDept = cleanDept(finalDepartment)
          const matched = collegeDepartments.find((d) => cleanDept(d) === normDept)
          if (matched) {
            finalDepartment = matched
          }
        }
      } else {
        finalDepartment = ''
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
        department: finalDepartment,
        course: (course && course.trim()) || 'B.Tech / Undergraduate Program',
        yearOfStudy: (academicYear && academicYear.trim()) || '1st Year',
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
        redirectPath: '/student',
        user: newUser,
        profile: newStudent,
      })
      return true
    }

    if (endpoint === '/api/auth/register/college' && req.method === 'POST') {
      const body = await parseBody(req)
      const { fullName, email, institutionName, aicteCode, password, departments } = body

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

      // Step 1: Search shared college records by normalized code and normalized name
      const normAicte = normalizeInstitutionCode(aicteCode)
      const normInstName = normalizeInstitutionName(institutionName)

      if (!normAicte || normAicte.length < 3) {
        sendJson(res, 400, { error: 'Invalid AICTE permanent institution code format.' })
        return true
      }

      const codeMatch = dbService.findCollegeByCode(normAicte)
      const nameMatch = dbService.findCollegeByName(normInstName)

      // Step 4: Conflict Detection (Prompt Step 4)
      // If code is already registered to a completely different institution name
      if (codeMatch) {
        const codeMatchNormName = normalizeInstitutionName(codeMatch.name)
        if (
          normInstName &&
          codeMatchNormName !== normInstName &&
          !codeMatchNormName.includes(normInstName) &&
          !normInstName.includes(codeMatchNormName)
        ) {
          sendJson(res, 409, {
            error: `College details conflict: AICTE permanent code "${aicteCode}" is already registered to "${codeMatch.name}". Please verify institutional credentials or contact platform administration.`,
          })
          return true
        }
      }

      // If name matches an existing college with a completely conflicting code
      if (nameMatch && !codeMatch) {
        const nameMatchNormCode = normalizeInstitutionCode(nameMatch.code)
        if (normAicte && nameMatchNormCode !== normAicte) {
          sendJson(res, 409, {
            error: `College details conflict: Institution "${institutionName}" is already registered under code "${nameMatch.code}". Please verify institutional credentials or contact platform administration.`,
          })
          return true
        }
      }

      const matchedCollege = codeMatch || nameMatch

      // Step 6: Authorization & Impersonation Prevention (Prompt Step 6)
      if (matchedCollege) {
        const emailDomain = email.trim().split('@')[1]?.toLowerCase()
        const collegeContactDomain = matchedCollege.contactEmail?.split('@')[1]?.toLowerCase()
        const existingAdmins = db.users.filter((u) => u.role === 'college_admin' && u.collegeId === matchedCollege!.id)

        if (emailDomain && collegeContactDomain && !collegeContactDomain.startsWith('.') && collegeContactDomain !== emailDomain) {
          const hasMatchingDomain = existingAdmins.some((a) => a.email.toLowerCase().endsWith(`@${emailDomain}`))
          if (!hasMatchingDomain && existingAdmins.length > 0 && !collegeContactDomain.includes(emailDomain) && !emailDomain.includes(collegeContactDomain)) {
            sendJson(res, 403, {
              error: `Unauthorized institutional claim: Email domain "${emailDomain}" is not authorized for "${matchedCollege.name}". Administrator accounts must use the official institutional email domain.`,
            })
            return true
          }
        }
      }

      const userId = `usr_col_${Date.now()}`
      let effectiveCollege: CollegeRecord

      // Step 2 & 3: Associate with existing record and preserve status, or create new record (Step 5)
      if (matchedCollege) {
        effectiveCollege = matchedCollege
        if (!matchedCollege.adminUserId) {
          matchedCollege.adminUserId = userId
        }
      } else {
        const collegeId = `col_${Date.now()}`
        effectiveCollege = {
          id: collegeId,
          code: normAicte,
          name: institutionName.trim(),
          state: 'All India',
          district: 'Administrative HQ',
          type: 'AICTE Recognized Technical Institution',
          status: 'approved',
          contactEmail: email.trim().toLowerCase(),
          adminUserId: userId,
          createdAt: new Date().toISOString(),
        }
        db.colleges.push(effectiveCollege)
      }

      if (Array.isArray(departments) && departments.length > 0) {
        effectiveCollege.departments = departments
          .map((d: string) => String(d).trim())
          .filter((d: string) => d.length > 0)
      } else if (!effectiveCollege.departments || effectiveCollege.departments.length === 0) {
        const fallbackDepts = dbService.getCollegeDepartments(effectiveCollege.id)
        effectiveCollege.departments = fallbackDepts.length > 0 ? fallbackDepts : [
          'Computer Science and Engineering',
          'Information Technology',
          'Electronics and Communication Engineering',
          'Mechanical Engineering',
          'Civil Engineering',
        ]
      }

      const newUser: UserRecord = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'college_admin',
        collegeId: effectiveCollege.id,
        institutionName: effectiveCollege.name,
        institutionCode: effectiveCollege.code,
        passwordHash: hashPassword(password),
        status: effectiveCollege.status === 'pending_approval' ? 'pending_approval' : 'approved',
        createdAt: new Date().toISOString(),
      }

      db.users.push(newUser)
      saveDatabase(db)

      const token = createJwt({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        collegeId: effectiveCollege.id,
        institutionCode: effectiveCollege.code,
      })

      sendJson(res, 201, {
        success: true,
        message: 'College institution registered successfully.',
        token,
        redirectPath: '/admin',
        user: newUser,
        college: effectiveCollege,
      })
      return true
    }

    if (endpoint === '/api/auth/register/platform-admin' && req.method === 'POST') {
      const body = await parseBody(req)
      const {
        fullName,
        email,
        username,
        password,
        confirmPassword,
        securityQuestion,
        securityAnswer,
        employeeId,
        designation,
        invitationCode,
      } = body

      // 1. Mandatory Fields Validation
      if (!fullName || !email || !username || !password || !securityQuestion || !securityAnswer) {
        sendJson(res, 400, {
          error: 'Full name, official email, username, password, security question, and security answer are required.',
        })
        return true
      }

      // 2. Email format & domain validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        sendJson(res, 400, { error: 'Please enter a valid official email address.' })
        return true
      }

      if (!/\.(gov\.in|nic\.in|ac\.in|edu\.in)$/i.test(email.trim()) && !/@aicte\.gov\.in$/i.test(email.trim())) {
        sendJson(res, 400, {
          error: 'Official government or educational email domain required (.gov.in, .nic.in, .ac.in, .edu.in).',
        })
        return true
      }

      // 3. Username format (3-30 characters, alphanumeric and underscore)
      const cleanUsername = username.trim()
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        sendJson(res, 400, {
          error: 'Username must be 3–30 characters long and contain only letters, numbers, and underscores.',
        })
        return true
      }

      // 4. Password validation (Minimum 8 chars, strong password policy)
      if (password.length < 8) {
        sendJson(res, 400, { error: 'Password must be at least 8 characters long.' })
        return true
      }

      const hasUpper = /[A-Z]/.test(password)
      const hasLower = /[a-z]/.test(password)
      const hasDigitOrSpecial = /[\d!@#$%^&*(),.?":{}|<>]/.test(password)
      if (!hasUpper || !hasLower || !hasDigitOrSpecial) {
        sendJson(res, 400, {
          error: 'Strong password policy required: Must contain uppercase, lowercase, and at least one number or special character.',
        })
        return true
      }

      // 5. Password Confirmation
      if (confirmPassword !== undefined && confirmPassword !== password) {
        sendJson(res, 400, { error: 'Password and password confirmation do not match.' })
        return true
      }

      // 6. Security Question & Answer Validation
      if (securityQuestion.trim().length < 5) {
        sendJson(res, 400, { error: 'Security question must be at least 5 characters long.' })
        return true
      }

      const normalizedAnswer = normalizeSecurityAnswer(securityAnswer)
      if (normalizedAnswer.length < 2) {
        sendJson(res, 400, { error: 'Security question answer must contain at least 2 alphanumeric characters.' })
        return true
      }

      const db = getDatabase()

      // 7. Prevent Overwriting Root Bootstrap Administrator
      if (email.trim().toLowerCase() === 'admin@aicte.gov.in' || cleanUsername.toLowerCase() === 'aicte_central_admin') {
        sendJson(res, 409, {
          error: 'Cannot overwrite or re-register the central root platform administrator account; email is already registered.',
        })
        return true
      }

      // 8. Duplicate Account Checks
      const existingEmail = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )
      if (existingEmail) {
        sendJson(res, 409, { error: `Administrator email ${email} is already registered in the system.` })
        return true
      }

      const existingUsername = db.users.find(
        (u) => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase()
      )
      if (existingUsername) {
        sendJson(res, 409, { error: `Username "${cleanUsername}" is already taken. Please choose another.` })
        return true
      }

      // 9. Invitation Token Verification & Privileged Enrollment Enforcement
      let isApproved = false
      let usedCode: string | undefined

      if (invitationCode && invitationCode.trim()) {
        const cleanCode = invitationCode.trim().toUpperCase()
        const foundInvitation = (db.invitationCodes || []).find(
          (inv) => inv.code.trim().toUpperCase() === cleanCode
        )

        if (!foundInvitation) {
          sendJson(res, 400, {
            error: 'Invalid Administrator Invitation Code. Please verify your code or register as a pending request.',
          })
          return true
        }

        if (foundInvitation.used) {
          sendJson(res, 400, {
            error: 'This Administrator Invitation Code has already been used or redeemed.',
          })
          return true
        }

        if (new Date(foundInvitation.expiresAt) < new Date()) {
          sendJson(res, 400, {
            error: 'This Administrator Invitation Code has expired. Please request a new token from AICTE nodal authority.',
          })
          return true
        }

        // Mark invitation code used
        foundInvitation.used = true
        foundInvitation.usedByEmail = email.trim().toLowerCase()
        foundInvitation.usedAt = new Date().toISOString()
        isApproved = true
        usedCode = cleanCode
      }

      // 10. Securely hash password and security answer (PBKDF2)
      const passwordHash = hashPassword(password)
      const securityAnswerHash = hashSecurityAnswer(securityAnswer)

      const newUserId = `usr_platform_${Date.now()}`
      const newAdminUser: UserRecord = {
        id: newUserId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: cleanUsername,
        role: 'platform_admin',
        passwordHash,
        securityQuestion: securityQuestion.trim(),
        securityAnswerHash,
        employeeId: (employeeId || `AICTE-EMP-${Date.now().toString().slice(-4)}`).trim().toUpperCase(),
        designation: (designation || 'Platform Administrative Officer').trim(),
        status: isApproved ? 'active' : 'pending_approval',
        invitationCodeUsed: usedCode,
        approvedAt: isApproved ? new Date().toISOString() : undefined,
        approvedByAdminId: isApproved ? 'SYSTEM_INVITATION' : undefined,
        failedLoginAttempts: 0,
        lockoutUntil: 0,
        createdAt: new Date().toISOString(),
      }

      db.users.push(newAdminUser)

      // Audit Log Entry (Secrets are NEVER logged!)
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        actorId: newAdminUser.id,
        actorName: newAdminUser.fullName,
        actorRole: 'platform_admin',
        action: isApproved ? 'ADMIN_ENROLLMENT_TOKEN_ACTIVATED' : 'ADMIN_REGISTRATION_REQUEST_SUBMITTED',
        targetType: 'PLATFORM_ADMIN_USER',
        targetId: newAdminUser.id,
        details: isApproved
          ? `Platform Administrator enrolled with authorization token: ${newAdminUser.fullName} (${newAdminUser.email})`
          : `Platform Administrator registration request submitted for approval: ${newAdminUser.fullName} (${newAdminUser.email})`,
        timestamp: new Date().toISOString(),
      })

      saveDatabase(db)

      if (isApproved) {
        const token = createJwt({
          userId: newAdminUser.id,
          email: newAdminUser.email,
          username: newAdminUser.username,
          role: newAdminUser.role,
        })

        sendJson(res, 201, {
          success: true,
          activated: true,
          message: 'Platform Administrator account created and authorized successfully. You may now sign in.',
          token,
          user: {
            id: newAdminUser.id,
            fullName: newAdminUser.fullName,
            email: newAdminUser.email,
            username: newAdminUser.username,
            role: newAdminUser.role,
            status: newAdminUser.status,
            employeeId: newAdminUser.employeeId,
            designation: newAdminUser.designation,
          },
        })
        return true
      }

      sendJson(res, 201, {
        success: true,
        activated: false,
        pendingApproval: true,
        message:
          'Platform Administrator registration request submitted successfully. Your request is pending verification and approval by the Central AICTE Authority before portal access is granted.',
        user: {
          id: newAdminUser.id,
          fullName: newAdminUser.fullName,
          email: newAdminUser.email,
          username: newAdminUser.username,
          role: newAdminUser.role,
          status: newAdminUser.status,
          employeeId: newAdminUser.employeeId,
          designation: newAdminUser.designation,
        },
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
      if (endpoint === '/api/student/profile' && req.method === 'PUT') {
        const body = await parseBody(req)
        const updatedStudent = dbService.updateStudentProfile(auth.user.id, body)
        if (!updatedStudent) {
          sendJson(res, 404, { error: 'Student record not found.' })
          return true
        }
        sendJson(res, 200, { success: true, student: updatedStudent })
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

      if (endpoint === '/api/college/departments' && req.method === 'PUT') {
        const body = await parseBody(req)
        const { departments } = body
        if (!Array.isArray(departments)) {
          sendJson(res, 400, { error: 'departments must be an array of strings.' })
          return true
        }
        const updated = dbService.updateCollegeDepartments(college.id, departments)
        sendJson(res, 200, { success: true, departments: updated })
        return true
      }

      if (endpoint === '/api/college/students/search' && req.method === 'GET') {
        const q = queryParams.get('q') || ''
        const dept = queryParams.get('department') || ''
        const year = queryParams.get('year') || ''
        const searchType = (queryParams.get('searchType') as 'all' | 'registrationNumber' | 'apaarId') || 'all'
        const students = dbService.searchStudentsInCollege(college.id, q, {
          department: dept,
          academicYear: year,
          searchType,
        })
        sendJson(res, 200, { success: true, students })
        return true
      }

      if (endpoint === '/api/college/documents/upload' && req.method === 'POST') {
        const body = await parseBody(req)
        const {
          studentRegistrationNumber,
          studentId,
          apaarId,
          documentType,
          title,
          fileName,
          fileSize,
          fileData,
          marksheetDetails,
        } = body

        if ((!studentRegistrationNumber && !studentId && !apaarId) || !documentType || !title || !fileName) {
          sendJson(res, 400, {
            error: 'Student identifier (Registration Number, Student ID, or APAAR ID), document type, document title, and file are required.',
          })
          return true
        }

        const result = dbService.uploadDocument({
          collegeId: college.id,
          adminUserId: auth.user.id,
          studentRegistrationNumber,
          studentId,
          apaarId,
          documentType,
          title,
          fileName,
          fileSize: fileSize || '1.2 MB',
          fileData,
          marksheetDetails,
        })

        if (!result.success) {
          sendJson(res, 400, { error: result.error })
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

      if (endpoint === '/api/college/verification-requests' && req.method === 'GET') {
        const db = getDatabase()
        const requests = db.verificationRequests.filter((v) => v.collegeId === college.id)
        sendJson(res, 200, { success: true, requests })
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

      const collegeDetailsMatch = endpoint.match(/^\/api\/platform\/colleges\/([^/]+)(\/details)?$/)
      if (collegeDetailsMatch && req.method === 'GET') {
        const colId = collegeDetailsMatch[1]
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

      // Platform Administrator Pending Approval Management
      if (endpoint === '/api/platform/admins/pending' && req.method === 'GET') {
        const pending = dbService.getPendingAdminRequests()
        sendJson(res, 200, { success: true, pendingAdmins: pending })
        return true
      }

      if (endpoint.startsWith('/api/platform/admins/') && endpoint.endsWith('/approve') && req.method === 'POST') {
        const adminId = endpoint.split('/')[4]
        const result = dbService.approveAdminRequest(adminId, auth.user.id)
        if (!result.success) {
          sendJson(res, 400, { error: result.error })
          return true
        }
        const adminData = {
          id: result.user?.id,
          fullName: result.user?.fullName,
          email: result.user?.email,
          username: result.user?.username,
          status: result.user?.status,
        }
        sendJson(res, 200, {
          success: true,
          message: `Administrator account for ${result.user?.fullName} approved successfully.`,
          admin: adminData,
          user: adminData,
        })
        return true
      }

      // Platform Administrator Invitation Management
      if (endpoint === '/api/platform/invitations/create' && req.method === 'POST') {
        const body = await parseBody(req)
        const expiresInDays = Number(body.expiresInDays) || 7
        const invitation = dbService.createAdminInvitation(auth.user.id, expiresInDays)

        // Audit log
        const db = getDatabase()
        db.auditLogs.unshift({
          id: `aud_${Date.now()}`,
          actorId: auth.user.id,
          actorName: auth.user.fullName,
          actorRole: 'platform_admin',
          action: 'ADMIN_INVITATION_CREATED',
          targetType: 'ADMIN_INVITATION',
          targetId: invitation.id,
          details: `Generated Administrator Invitation Token: ${invitation.code} (Expires in ${expiresInDays} days)`,
          timestamp: new Date().toISOString(),
        })
        saveDatabase(db)

        sendJson(res, 201, {
          success: true,
          message: 'Platform Administrator invitation token created successfully.',
          invitation,
        })
        return true
      }

      if (endpoint === '/api/platform/invitations' && req.method === 'GET') {
        const db = getDatabase()
        sendJson(res, 200, { success: true, invitations: db.invitationCodes || [] })
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
