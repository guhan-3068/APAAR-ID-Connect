/**
 * APAAR CONNECT AI — Central Authentication Service
 * Communicates with the real backend authentication infrastructure (/api/auth/*)
 */

export interface AuthUser {
  id: string
  fullName: string
  email: string
  role: 'student' | 'college_admin' | 'platform_admin'
  apaarId?: string
  institutionName?: string
  institutionCode?: string
}

export interface StudentProfileData {
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

export interface LoginResponse {
  success: boolean
  token: string
  user: AuthUser
  profile?: StudentProfileData
  error?: string
}

export interface RegisterStudentData {
  fullName: string
  email: string
  institutionName: string
  apaarId: string
  password: string
}

export interface RegisterCollegeData {
  fullName: string
  email: string
  institutionName: string
  aicteCode: string
  password: string
}

const TOKEN_KEY = 'apaar_auth_jwt'

class AuthService {
  private token: string | null = null

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY)
    }
    return this.token
  }

  public setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token)
    }
  }

  public clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  /**
   * Helper to perform authenticated HTTP requests
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`)
      }

      return data as T
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(
          'Unable to connect to the authentication service. Please verify network connectivity.'
        )
      }
      throw err
    }
  }

  /**
   * Sign In across all portals
   */
  public async login(
    identifier: string,
    password: string,
    portal?: 'student' | 'college_admin' | 'platform_admin'
  ): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, portal }),
    })

    if (result.token) {
      this.setToken(result.token)
    }

    return result
  }

  /**
   * Register Student
   */
  public async registerStudent(data: RegisterStudentData): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>('/api/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (result.token) {
      this.setToken(result.token)
    }

    return result
  }

  /**
   * Register College / Institutional Administrator
   */
  public async registerCollege(data: RegisterCollegeData): Promise<LoginResponse> {
    const result = await this.request<LoginResponse>('/api/auth/register/college', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (result.token) {
      this.setToken(result.token)
    }

    return result
  }

  /**
   * Restore user session from backend
   */
  public async getCurrentUser(): Promise<{ user: AuthUser; profile?: StudentProfileData } | null> {
    const token = this.getToken()
    if (!token) return null

    try {
      const res = await this.request<{
        success: boolean
        user: AuthUser
        profile?: StudentProfileData
      }>('/api/auth/me', {
        method: 'GET',
      })
      return { user: res.user, profile: res.profile }
    } catch {
      this.clearToken()
      return null
    }
  }

  /**
   * Request Password Reset OTP
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string; devHint?: string }> {
    return this.request<{ success: boolean; message: string; devHint?: string }>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    )
  }

  /**
   * Verify OTP and Reset Password
   */
  public async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      }
    )
  }

  /**
   * Sign Out
   */
  public async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearToken()
    }
  }
}

export const authService = new AuthService()
