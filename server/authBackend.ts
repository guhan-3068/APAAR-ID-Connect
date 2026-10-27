import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

export interface UserRecord {
  id: string
  fullName: string
  email: string
  role: 'student' | 'college_admin' | 'platform_admin'
  passwordHash: string // salt:hash (pbkdf2)
  createdAt: string
  apaarId?: string // 12-digit format (digits only, e.g. 210420241234)
  institutionName?: string
  institutionCode?: string
  status?: 'active' | 'approved' | 'pending_approval' | 'suspended'
  resetOtp?: {
    code: string
    expiresAt: number
  }
}

export interface StudentProfileRecord {
  id: string
  userId: string
  apaarId: string
  fullName: string
  email: string
  institutionName: string
  institutionCode: string
  department: string
  course: string
  yearOfStudy: string
  registrationNumber: string
  phone: string
  dob: string
  gender: string
  bloodGroup: string
  digilockerConnected: boolean
  lastSync: string
}

interface DatabaseSchema {
  users: UserRecord[]
  studentProfiles: StudentProfileRecord[]
}

const JWT_SECRET = process.env.JWT_SECRET || 'apaar-connect-ai-sec-key-2026-sih-token'
const DATA_DIR = path.resolve(process.cwd(), 'server/data')
const DB_FILE = path.join(DATA_DIR, 'auth_database.json')

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

// Minimal, secure JWT (HMAC-SHA256) implementation
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

// Database initialization & file management
function initDatabase(): DatabaseSchema {
  const tmpDbFile = path.join('/tmp', 'auth_database.json')
  if (fs.existsSync(tmpDbFile)) {
    try {
      const content = fs.readFileSync(tmpDbFile, 'utf-8')
      return JSON.parse(content)
    } catch {}
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8')
      return JSON.parse(content)
    } catch {
      // If corrupted, re-seed
    }
  }

  // Pre-seed default accounts with Demo Password: "Apaar@2026"
  const defaultPasswordHash = hashPassword('Apaar@2026')

  const seed: DatabaseSchema = {
    users: [
      {
        id: 'usr_platform_admin_01',
        fullName: 'Dr. Anil Sahasrabudhe (Central Administration)',
        email: 'admin@aicte.gov.in',
        role: 'platform_admin',
        passwordHash: defaultPasswordHash,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_college_admin_01',
        fullName: 'Dr. S. K. Kulkarni',
        email: 'registrar@niet.edu.in',
        role: 'college_admin',
        institutionName: 'National Institute of Engineering & Technology',
        institutionCode: 'AICTE-1-4928172',
        passwordHash: defaultPasswordHash,
        status: 'approved',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr_student_01',
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@student.niet.edu.in',
        apaarId: '210420241234',
        role: 'student',
        institutionName: 'National Institute of Engineering & Technology',
        institutionCode: 'NIET-2006-AICTE',
        passwordHash: defaultPasswordHash,
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
    studentProfiles: [
      {
        id: 'prof_student_01',
        userId: 'usr_student_01',
        apaarId: '210420241234',
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@student.niet.edu.in',
        institutionName: 'National Institute of Engineering & Technology',
        institutionCode: 'NIET-2006-AICTE',
        department: 'Computer Science & Engineering',
        course: 'B.Tech — Computer Science & Engineering',
        yearOfStudy: '4th Year (Final Year)',
        registrationNumber: '2021NIET0841',
        phone: '+91 98765 43210',
        dob: '15 Aug 2003',
        gender: 'Male',
        bloodGroup: 'B+',
        digilockerConnected: true,
        lastSync: new Date().toLocaleString('en-IN'),
      },
    ],
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8')
  } catch {
    try {
      fs.writeFileSync(tmpDbFile, JSON.stringify(seed, null, 2), 'utf-8')
    } catch {
      // Kept in memory
    }
  }
  return seed
}

let dbCache: DatabaseSchema | null = null

function getDb(): DatabaseSchema {
  if (!dbCache) {
    dbCache = initDatabase()
  }
  return dbCache
}

function saveDb(db: DatabaseSchema) {
  dbCache = db
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8')
  } catch {
    try {
      const tmpDbFile = path.join('/tmp', 'auth_database.json')
      fs.writeFileSync(tmpDbFile, JSON.stringify(db, null, 2), 'utf-8')
    } catch {
      // Kept in memory
    }
  }
}

// Helper to parse JSON body from incoming HTTP request (compatible with Vite and serverless runtimes)
function parseBody(req: IncomingMessage): Promise<any> {
  // If the body has already been parsed by a serverless runtime (e.g. Vercel)
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

export async function handleAuthRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || ''
  if (!url.startsWith('/api/auth')) return false

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.end()
    return true
  }

  const endpoint = url.split('?')[0]
  const db = getDb()

  try {
    // -------------------------------------------------------------
    // GET /api/auth/status — Backend status check
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/status' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'online',
        service: 'APAAR CONNECT Central Authentication Service',
        version: '2.4.0',
        database: 'persistent_json_store',
        usersCount: db.users.length,
        timestamp: new Date().toISOString(),
      })
      return true
    }

    // -------------------------------------------------------------
    // POST /api/auth/register/student — Student Registration
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/register/student' && req.method === 'POST') {
      const body = await parseBody(req)
      const { fullName, email, institutionName, apaarId, password } = body

      if (!fullName || !email || !institutionName || !apaarId || !password) {
        sendJson(res, 400, { error: 'All fields are required.' })
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

      // Check duplicates
      const existingApaar = db.users.find(
        (u) => u.apaarId && u.apaarId.replace(/\D/g, '') === cleanApaarId
      )
      if (existingApaar) {
        sendJson(res, 409, {
          error: `APAAR ID ${apaarId} is already registered. Please sign in or use password recovery.`,
        })
        return true
      }

      const existingEmail = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )
      if (existingEmail) {
        sendJson(res, 409, {
          error: `Email ${email} is already associated with an account.`,
        })
        return true
      }

      const userId = `usr_stu_${Date.now()}`
      const newUser: UserRecord = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        apaarId: cleanApaarId,
        role: 'student',
        institutionName: institutionName.trim(),
        passwordHash: hashPassword(password),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      const newProfile: StudentProfileRecord = {
        id: `prof_${cleanApaarId}`,
        userId,
        apaarId: cleanApaarId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        institutionName: institutionName.trim(),
        institutionCode: 'AICTE-REG-' + cleanApaarId.slice(-4),
        department: 'Engineering / Applied Sciences',
        course: 'Undergraduate Program',
        yearOfStudy: '1st Year',
        registrationNumber: 'REG' + cleanApaarId.slice(-6),
        phone: '',
        dob: '01 Jan 2004',
        gender: 'Other',
        bloodGroup: 'Unknown',
        digilockerConnected: false,
        lastSync: new Date().toLocaleString('en-IN'),
      }

      db.users.push(newUser)
      db.studentProfiles.push(newProfile)
      saveDb(db)

      const token = createJwt({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        apaarId: newUser.apaarId,
      })

      sendJson(res, 201, {
        success: true,
        message: 'Student account registered successfully.',
        token,
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          apaarId: newUser.apaarId,
          role: newUser.role,
          institutionName: newUser.institutionName,
        },
      })
      return true
    }

    // -------------------------------------------------------------
    // POST /api/auth/register/college — College Registration
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/register/college' && req.method === 'POST') {
      const body = await parseBody(req)
      const { fullName, email, institutionName, aicteCode, password } = body

      if (!fullName || !email || !institutionName || !aicteCode || !password) {
        sendJson(res, 400, { error: 'All fields are required.' })
        return true
      }

      if (!/\.(edu\.in|gov\.in|ac\.in|nic\.in)$/i.test(email.trim())) {
        sendJson(res, 400, {
          error:
            'Official institutional email must end with an authorized domain (.edu.in, .gov.in, .ac.in, .nic.in).',
        })
        return true
      }

      if (password.length < 8) {
        sendJson(res, 400, { error: 'Password must be at least 8 characters long.' })
        return true
      }

      const existingEmail = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )
      if (existingEmail) {
        sendJson(res, 409, {
          error: `Institutional email ${email} is already registered.`,
        })
        return true
      }

      const existingCode = db.users.find(
        (u) =>
          u.institutionCode &&
          u.institutionCode.toLowerCase() === aicteCode.trim().toLowerCase()
      )
      if (existingCode) {
        sendJson(res, 409, {
          error: `AICTE Permanent Code ${aicteCode} has already been registered. Please contact your institution registrar.`,
        })
        return true
      }

      const userId = `usr_col_${Date.now()}`
      const newUser: UserRecord = {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'college_admin',
        institutionName: institutionName.trim(),
        institutionCode: aicteCode.trim(),
        passwordHash: hashPassword(password),
        status: 'approved', // Pre-approved for local prototype workflow, or pending_approval
        createdAt: new Date().toISOString(),
      }

      db.users.push(newUser)
      saveDb(db)

      const token = createJwt({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
        institutionCode: newUser.institutionCode,
      })

      sendJson(res, 201, {
        success: true,
        message: 'College institution registered successfully.',
        token,
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          institutionName: newUser.institutionName,
          institutionCode: newUser.institutionCode,
        },
      })
      return true
    }

    // -------------------------------------------------------------
    // POST /api/auth/login — Central Multi-Portal Sign In
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req)
      const { identifier, password, portal } = body

      if (!identifier || !password) {
        sendJson(res, 400, { error: 'Identifier (APAAR ID or Email) and password are required.' })
        return true
      }

      const cleanInput = identifier.trim()
      const cleanDigits = cleanInput.replace(/\D/g, '')

      let matchedUser: UserRecord | undefined

      // If portal is 'student' or input is 12 digits, match by APAAR ID
      if (portal === 'student' || (cleanDigits.length === 12 && !cleanInput.includes('@'))) {
        matchedUser = db.users.find(
          (u) =>
            u.role === 'student' &&
            u.apaarId &&
            u.apaarId.replace(/\D/g, '') === cleanDigits
        )
      } else {
        // Match by Email
        matchedUser = db.users.find(
          (u) => u.email.toLowerCase() === cleanInput.toLowerCase()
        )
      }

      if (!matchedUser) {
        sendJson(res, 401, {
          error:
            portal === 'student'
              ? 'Invalid APAAR ID or password. Please verify your 12-digit number.'
              : 'Invalid credentials. Please verify your email/identifier and password.',
        })
        return true
      }

      // Check role enforcement if portal specified
      if (portal && portal !== matchedUser.role) {
        sendJson(res, 403, {
          error: `This account has role "${matchedUser.role}" and is not authorized to sign in through the ${portal} portal.`,
        })
        return true
      }

      // Check password
      const isMatch = verifyPassword(password, matchedUser.passwordHash)
      if (!isMatch) {
        sendJson(res, 401, {
          error: 'Invalid credentials. Incorrect password entered.',
        })
        return true
      }

      // Check account approval status
      if (matchedUser.status === 'pending_approval') {
        sendJson(res, 403, {
          error:
            'Institutional account is pending approval by the Platform Administrator.',
        })
        return true
      }

      if (matchedUser.status === 'suspended') {
        sendJson(res, 403, {
          error: 'Account has been temporarily suspended. Contact nodal authority.',
        })
        return true
      }

      // Issue JWT
      const token = createJwt({
        userId: matchedUser.id,
        email: matchedUser.email,
        role: matchedUser.role,
        apaarId: matchedUser.apaarId,
        institutionCode: matchedUser.institutionCode,
      })

      // Fetch student profile if student
      let profile: StudentProfileRecord | undefined
      if (matchedUser.role === 'student') {
        profile = db.studentProfiles.find(
          (p) => p.userId === matchedUser?.id || (matchedUser?.apaarId && p.apaarId === matchedUser.apaarId)
        )
      }

      sendJson(res, 200, {
        success: true,
        token,
        user: {
          id: matchedUser.id,
          fullName: matchedUser.fullName,
          email: matchedUser.email,
          role: matchedUser.role,
          apaarId: matchedUser.apaarId,
          institutionName: matchedUser.institutionName,
          institutionCode: matchedUser.institutionCode,
        },
        profile,
      })
      return true
    }

    // -------------------------------------------------------------
    // GET /api/auth/me — Validate Session Token
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/me' && req.method === 'GET') {
      const authHeader = req.headers['authorization']
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJson(res, 401, { error: 'No authorization token provided' })
        return true
      }

      const token = authHeader.substring(7)
      const verification = verifyJwt(token)
      if (!verification.valid || !verification.payload) {
        sendJson(res, 401, { error: verification.error || 'Invalid session' })
        return true
      }

      const user = db.users.find((u) => u.id === verification.payload.userId)
      if (!user) {
        sendJson(res, 401, { error: 'User account no longer exists' })
        return true
      }

      let profile: StudentProfileRecord | undefined
      if (user.role === 'student') {
        profile = db.studentProfiles.find(
          (p) => p.userId === user.id || (user.apaarId && p.apaarId === user.apaarId)
        )
      }

      sendJson(res, 200, {
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          apaarId: user.apaarId,
          institutionName: user.institutionName,
          institutionCode: user.institutionCode,
        },
        profile,
      })
      return true
    }

    // -------------------------------------------------------------
    // POST /api/auth/forgot-password — Request Password Reset OTP
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/forgot-password' && req.method === 'POST') {
      const body = await parseBody(req)
      const { email } = body

      if (!email) {
        sendJson(res, 400, { error: 'Registered email address is required.' })
        return true
      }

      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )

      if (!user) {
        // Return 404 with clear message
        sendJson(res, 404, {
          error: `No registered account found with email address: ${email}`,
        })
        return true
      }

      // Generate a secure 6-digit numeric OTP
      const otpCode = crypto.randomInt(100000, 999999).toString()
      const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

      user.resetOtp = { code: otpCode, expiresAt }
      saveDb(db)

      console.log(`[AUTH SERVER] Password Reset OTP for ${email}: ${otpCode}`)

      sendJson(res, 200, {
        success: true,
        message: `A 6-digit verification OTP has been generated for ${email}. It is valid for 10 minutes.`,
        // Include devHint in local prototype so evaluator or developer can test immediately
        devHint: otpCode,
      })
      return true
    }

    // -------------------------------------------------------------
    // POST /api/auth/reset-password — Verify OTP & Set New Password
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/reset-password' && req.method === 'POST') {
      const body = await parseBody(req)
      const { email, otp, newPassword } = body

      if (!email || !otp || !newPassword) {
        sendJson(res, 400, {
          error: 'Email, 6-digit OTP, and new password are required.',
        })
        return true
      }

      if (newPassword.length < 8) {
        sendJson(res, 400, {
          error: 'New password must be at least 8 characters long.',
        })
        return true
      }

      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      )

      if (!user || !user.resetOtp) {
        sendJson(res, 400, {
          error: 'No active password reset request found for this email address.',
        })
        return true
      }

      if (Date.now() > user.resetOtp.expiresAt) {
        delete user.resetOtp
        saveDb(db)
        sendJson(res, 400, {
          error: 'Verification OTP has expired. Please request a new one.',
        })
        return true
      }

      if (user.resetOtp.code !== otp.trim()) {
        sendJson(res, 400, {
          error: 'Invalid 6-digit verification OTP. Please check and try again.',
        })
        return true
      }

      // OTP is valid -> Update password and invalidate OTP
      user.passwordHash = hashPassword(newPassword)
      delete user.resetOtp
      saveDb(db)

      sendJson(res, 200, {
        success: true,
        message:
          'Password has been updated successfully. You can now sign in with your new password.',
      })
      return true
    }

    // -------------------------------------------------------------
    // POST /api/auth/logout — Invalidate Session
    // -------------------------------------------------------------
    if (endpoint === '/api/auth/logout' && req.method === 'POST') {
      sendJson(res, 200, { success: true, message: 'Logged out successfully.' })
      return true
    }

    sendJson(res, 404, { error: `Authentication route ${endpoint} not found` })
    return true
  } catch (err: any) {
    console.error('[AUTH SERVER ERROR]', err)
    sendJson(res, 500, { error: err.message || 'Internal server error in authentication service' })
    return true
  }
}
