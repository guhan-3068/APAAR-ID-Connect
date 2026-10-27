import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CreditCard,
  Building2,
  ShieldAlert,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'
import { formatApaarId, isValidApaarId } from '@/utils/formatters'
import { validatePassword, validateEmail } from '@/utils/authValidation'
import { useAuth } from '@/context/AuthContext'

type PortalType = 'student' | 'college_admin' | 'platform_admin'
type AuthError = { identifier?: string; password?: string; general?: string }

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Selected Portal Tab
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('student')

  // Form state
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // UI state
  const [errors, setErrors] = useState<AuthError>({})
  const [isLoading, setIsLoading] = useState(false)

  // Message from ProtectedRoute redirect
  const redirectMessage = (location.state as any)?.message

  /* ------------------------------------------------------------------ */
  /* Validation                                                           */
  /* ------------------------------------------------------------------ */

  const validate = (): AuthError => {
    const errs: AuthError = {}

    if (selectedPortal === 'student') {
      const cleanedId = identifier.replace(/\D/g, '')
      if (!cleanedId) {
        errs.identifier = 'APAAR ID is required'
      } else if (!isValidApaarId(cleanedId)) {
        errs.identifier = 'APAAR ID must be exactly 12 digits (e.g. 2104-2024-1234)'
      }
    } else {
      const emailVal = validateEmail(identifier)
      if (!emailVal.isValid) {
        errs.identifier = emailVal.error
      }
    }

    const passwordVal = validatePassword(password, 6)
    if (!passwordVal.isValid) errs.password = passwordVal.error

    return errs
  }

  /* ------------------------------------------------------------------ */
  /* Submit handler                                                       */
  /* ------------------------------------------------------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const res = await login(identifier, password, selectedPortal)
      setIsLoading(false)
      navigate(res.redirectPath)
    } catch (err: any) {
      setIsLoading(false)
      setErrors({
        general:
          err.message ||
          'Failed to sign in. Please verify your credentials and network connection.',
      })
    }
  }

  /* ------------------------------------------------------------------ */
  /* Field change handlers                                                */
  /* ------------------------------------------------------------------ */

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (selectedPortal === 'student') {
      setIdentifier(formatApaarId(val))
    } else {
      setIdentifier(val)
    }
    if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }))
  }

  const handlePortalSwitch = (portal: PortalType) => {
    setSelectedPortal(portal)
    setIdentifier('')
    setPassword('')
    setErrors({})
  }

  const fillDemoCredentials = () => {
    setErrors({})
    if (selectedPortal === 'student') {
      setIdentifier('2104-2024-1234')
      setPassword('Apaar@2026')
    } else if (selectedPortal === 'college_admin') {
      setIdentifier('registrar@niet.edu.in')
      setPassword('Apaar@2026')
    } else {
      setIdentifier('admin@aicte.gov.in')
      setPassword('Apaar@2026')
    }
  }

  /* ------------------------------------------------------------------ */
  /* Render                                                               */
  /* ------------------------------------------------------------------ */

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/20 selection:text-blue-700">
      {/* Background Decorative Accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-100/60 via-indigo-100/40 to-purple-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header / Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto">
        <Card className="border border-slate-200/90 shadow-xl rounded-2xl p-6 sm:p-8 bg-white/95 backdrop-blur-md">
          {/* Logo & Headline */}
          <div className="text-center space-y-2 mb-6">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck size={26} className="stroke-[2.2]" />
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                APAAR CONNECT
              </span>
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Unified Authentication Gateway for Higher Educational Institutions
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-semibold mb-6">
            <button
              type="button"
              onClick={() => handlePortalSwitch('student')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all ${
                selectedPortal === 'student'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap size={15} />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('college_admin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all ${
                selectedPortal === 'college_admin'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 size={14} />
              <span>College</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('platform_admin')}
              className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-all ${
                selectedPortal === 'platform_admin'
                  ? 'bg-white text-blue-600 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Platform</span>
            </button>
          </div>

          {/* Redirect message notice */}
          {redirectMessage && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
              <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {/* General Error Banner */}
          {errors.general && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Sign-In Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Identifier Field (APAAR ID for Student, Email for Admins) */}
            {selectedPortal === 'student' ? (
              <Input
                label="12-Digit APAAR ID"
                id="login-apaar-id"
                type="text"
                inputMode="numeric"
                value={identifier}
                onChange={handleIdentifierChange}
                error={errors.identifier}
                leftIcon={<CreditCard size={16} />}
                placeholder="e.g. 2104-2024-1234"
                autoComplete="username"
                maxLength={14}
                required
              />
            ) : (
              <Input
                label={
                  selectedPortal === 'college_admin'
                    ? 'Official Institutional Email'
                    : 'Platform Admin Email'
                }
                id="login-email"
                type="email"
                value={identifier}
                onChange={handleIdentifierChange}
                error={errors.identifier}
                leftIcon={selectedPortal === 'college_admin' ? <Building2 size={16} /> : <ShieldAlert size={16} />}
                placeholder={
                  selectedPortal === 'college_admin'
                    ? 'registrar@niet.edu.in'
                    : 'admin@aicte.gov.in'
                }
                autoComplete="username"
                required
              />
            )}

            {/* Password Field */}
            <div>
              <Input
                label="Password"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                }}
                error={errors.password}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            {/* Forgot Password Link & Demo Auto-fill */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                title="Fill pre-seeded demonstration credentials"
              >
                <Sparkles size={12} />
                <span>Fill Demo Credentials</span>
              </button>

              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-purple-600 hover:underline transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 rounded-xl"
              rightIcon={<ArrowRight size={16} />}
            >
              Sign In to {selectedPortal === 'student' ? 'Student' : selectedPortal === 'college_admin' ? 'College' : 'Platform'} Portal
            </Button>
          </form>

          {/* Create Account Link */}
          {selectedPortal !== 'platform_admin' ? (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
              First-Time User?{' '}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-purple-600 hover:underline transition-colors"
              >
                Create Account
              </Link>
            </div>
          ) : (
            <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
              Platform Admin accounts are restricted and provisioned by AICTE nodal authority.
            </div>
          )}
        </Card>

        {/* Security Reminder */}
        <div className="mt-4 text-center text-[11px] text-slate-400">
          <p className="flex items-center justify-center gap-1.5">
            <AlertCircle size={12} className="text-slate-400" />
            <span>Never share your credentials. All sign-in attempts are cryptographically audited.</span>
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-slate-400 mt-8">
        © 2026 APAAR CONNECT AI • Smart India Hackathon Innovation for AICTE
      </div>
    </div>
  )
}
