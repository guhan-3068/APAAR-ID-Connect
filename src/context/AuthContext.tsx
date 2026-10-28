import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  authService,
  type AuthUser,
  type StudentProfileData,
  type RegisterStudentData,
  type RegisterCollegeData,
  type RegisterPlatformAdminData,
} from '@/services/authService'

export interface AuthContextType {
  user: AuthUser | null
  profile: StudentProfileData | null
  token: string | null
  role: 'student' | 'college_admin' | 'platform_admin' | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (
    identifier: string,
    password: string,
    portal?: 'student' | 'college_admin' | 'platform_admin',
    securityAnswer?: string
  ) => Promise<{
    success: boolean
    role: string
    redirectPath: string
    requireSecurityChallenge?: boolean
    question?: string
    challengeToken?: string
  }>
  verifySecurityChallenge: (
    challengeToken: string,
    securityAnswer: string
  ) => Promise<{ success: boolean; role: string; redirectPath: string }>
  registerStudent: (data: RegisterStudentData) => Promise<{ success: boolean; redirectPath: string }>
  registerCollege: (data: RegisterCollegeData) => Promise<{ success: boolean; redirectPath: string }>
  registerPlatformAdmin: (
    data: RegisterPlatformAdminData
  ) => Promise<{
    success: boolean
    activated: boolean
    message: string
    pendingApproval?: boolean
    redirectPath?: string
  }>
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; devHint?: string }>
  resetPassword: (email: string, otp: string, pass: string) => Promise<{ success: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [token, setToken] = useState<string | null>(authService.getToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Restore authenticated session on initial mount
  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      if (!authService.getToken()) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const session = await authService.getCurrentUser()
        if (session && isMounted) {
          setUser(session.user)
          if (session.profile) setProfile(session.profile)
          setToken(authService.getToken())
        } else if (isMounted) {
          setUser(null)
          setProfile(null)
          setToken(null)
        }
      } catch {
        if (isMounted) {
          setUser(null)
          setProfile(null)
          setToken(null)
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const getPortalRedirect = (role: string): string => {
    switch (role) {
      case 'platform_admin':
        return '/platform'
      case 'college_admin':
        return '/admin'
      case 'student':
      default:
        return '/student'
    }
  }

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      portal?: 'student' | 'college_admin' | 'platform_admin',
      securityAnswer?: string
    ) => {
      const res = await authService.login(identifier, password, portal, securityAnswer)

      if (res.requireSecurityChallenge) {
        return {
          success: true,
          role: 'platform_admin',
          redirectPath: '',
          requireSecurityChallenge: true,
          question: res.question,
          challengeToken: res.challengeToken,
        }
      }

      if (res.user && res.token) {
        setUser(res.user)
        if (res.profile) setProfile(res.profile)
        setToken(res.token)
        return {
          success: true,
          role: res.user.role,
          redirectPath: getPortalRedirect(res.user.role),
        }
      }

      throw new Error(res.error || 'Login verification failed.')
    },
    []
  )

  const verifySecurityChallenge = useCallback(
    async (challengeToken: string, securityAnswer: string) => {
      const res = await authService.verifySecurityChallenge(challengeToken, securityAnswer)
      if (res.user && res.token) {
        setUser(res.user)
        setToken(res.token)
        return {
          success: true,
          role: res.user.role,
          redirectPath: getPortalRedirect(res.user.role),
        }
      }
      throw new Error(res.error || 'Security verification failed.')
    },
    []
  )

  const registerStudent = useCallback(async (data: RegisterStudentData) => {
    const res = await authService.registerStudent(data)
    if (res.user && res.token) {
      setUser(res.user)
      if (res.profile) setProfile(res.profile)
      setToken(res.token)
    }
    return {
      success: true,
      redirectPath: '/student',
    }
  }, [])

  const registerCollege = useCallback(async (data: RegisterCollegeData) => {
    const res = await authService.registerCollege(data)
    if (res.user && res.token) {
      setUser(res.user)
      setToken(res.token)
    }
    return {
      success: true,
      redirectPath: '/admin',
    }
  }, [])

  const registerPlatformAdmin = useCallback(
    async (data: RegisterPlatformAdminData) => {
      const res = await authService.registerPlatformAdmin(data)
      if (res.activated && res.user && res.token) {
        setUser(res.user)
        setToken(res.token)
        return {
          success: true,
          activated: true,
          message: res.message,
          redirectPath: '/platform',
        }
      }
      return {
        success: true,
        activated: false,
        pendingApproval: true,
        message: res.message,
      }
    },
    []
  )

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    setProfile(null)
    setToken(null)
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    return authService.requestPasswordReset(email)
  }, [])

  const resetPassword = useCallback(async (email: string, otp: string, pass: string) => {
    return authService.resetPassword(email, otp, pass)
  }, [])

  const value = {
    user,
    profile,
    token,
    role: user?.role || null,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    verifySecurityChallenge,
    registerStudent,
    registerCollege,
    registerPlatformAdmin,
    logout,
    requestPasswordReset,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
