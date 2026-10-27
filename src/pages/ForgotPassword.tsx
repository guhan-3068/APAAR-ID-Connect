import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'
import { validateEmail, validatePassword, validatePasswordMatch } from '@/utils/authValidation'
import { useAuth } from '@/context/AuthContext'

type Step = 'request' | 'verify_otp' | 'reset_success'

export const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, resetPassword } = useAuth()

  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [serverMessage, setServerMessage] = useState<string | null>(null)
  const [devHint, setDevHint] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /* ------------------------------------------------------------------ */
  /* Step 1: Request OTP                                                  */
  /* ------------------------------------------------------------------ */

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    const emailVal = validateEmail(email)
    if (!emailVal.isValid) {
      setErrors({ email: emailVal.error })
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      const res = await requestPasswordReset(email.trim())
      setIsLoading(false)
      setServerMessage(res.message)
      if (res.devHint) {
        setDevHint(res.devHint)
      }
      setStep('verify_otp')
    } catch (err: any) {
      setIsLoading(false)
      setGeneralError(err.message || 'Failed to dispatch password recovery OTP.')
    }
  }

  /* ------------------------------------------------------------------ */
  /* Step 2: Verify OTP & Set New Password                                */
  /* ------------------------------------------------------------------ */

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)
    const newErrors: Record<string, string> = {}

    if (!otp || otp.trim().length !== 6) {
      newErrors.otp = 'Please enter the exact 6-digit verification code'
    }

    const passVal = validatePassword(newPassword, 8)
    if (!passVal.isValid) newErrors.newPassword = passVal.error!

    const matchVal = validatePasswordMatch(newPassword, confirmNewPassword)
    if (!matchVal.isValid) newErrors.confirmNewPassword = matchVal.error!

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      await resetPassword(email.trim(), otp.trim(), newPassword)
      setIsLoading(false)
      setStep('reset_success')
    } catch (err: any) {
      setIsLoading(false)
      setGeneralError(err.message || 'OTP verification failed. Please try again.')
    }
  }

  /* ================================================================== */
  /* RENDER                                                              */
  /* ================================================================== */

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/20 selection:text-blue-700">
      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-100/60 via-indigo-100/40 to-purple-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center mb-4">
        {step === 'request' || step === 'reset_success' ? (
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setStep('request')
              setOtp('')
              setNewPassword('')
              setConfirmNewPassword('')
              setErrors({})
              setGeneralError(null)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Change email address</span>
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto">
        <Card className="border border-slate-200/90 shadow-xl rounded-2xl p-6 sm:p-8 bg-white/95 backdrop-blur-md">
          {/* Logo & Heading */}
          <div className="text-center space-y-2 mb-7">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <KeyRound size={24} className="stroke-[2.2]" />
              </div>
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Reset Password
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {step === 'request' &&
                'Enter your registered account email to receive a secure 6-digit verification code'}
              {step === 'verify_otp' &&
                `Enter the verification code dispatched for ${email} and set your new password`}
              {step === 'reset_success' && 'Your credentials have been securely updated'}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['request', 'verify_otp', 'reset_success'] as Step[]).map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    step === s
                      ? 'bg-blue-600'
                      : (step === 'verify_otp' && s === 'request') ||
                        step === 'reset_success'
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />
                {i < 2 && <div className="h-px w-6 bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* STEP 1: Request Email */}
          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4" noValidate>
              <Input
                label="Registered Email Address"
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({})
                  if (generalError) setGeneralError(null)
                }}
                error={errors.email}
                leftIcon={<Mail size={16} />}
                placeholder="e.g. aarav.sharma@student.niet.edu.in"
                helperText="A time-bound 6-digit cryptographic OTP will be generated for verification"
                required
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 rounded-xl"
                  rightIcon={<ArrowRight size={16} />}
                >
                  Send Verification OTP
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP & New Password */}
          {step === 'verify_otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4" noValidate>
              {/* Sent-to notice */}
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <span>
                  {serverMessage || `Verification OTP has been generated for ${email}.`} Valid for 10 minutes.
                </span>
              </div>

              {/* Dev/Evaluator Hint for local verification */}
              {devHint && (
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-[11px] text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles size={13} className="text-purple-600" />
                    Generated OTP: <strong className="font-mono text-purple-800">{devHint}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtp(devHint)}
                    className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-semibold hover:bg-purple-700 cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              {/* OTP Input */}
              <Input
                label="6-Digit Verification Code (OTP)"
                id="fp-otp"
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtp(digits)
                  if (errors.otp) setErrors((p) => ({ ...p, otp: undefined }))
                }}
                error={errors.otp}
                leftIcon={<KeyRound size={16} />}
                placeholder="e.g. 481920"
                maxLength={6}
                required
              />

              {/* New Password */}
              <Input
                label="New Password"
                id="fp-new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: undefined }))
                }}
                error={errors.newPassword}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                placeholder="Min 8 characters"
                required
              />

              {/* Confirm New Password */}
              <Input
                label="Confirm New Password"
                id="fp-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value)
                  if (errors.confirmNewPassword)
                    setErrors((p) => ({ ...p, confirmNewPassword: undefined }))
                }}
                error={errors.confirmNewPassword}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                placeholder="Re-enter new password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 rounded-xl"
                rightIcon={<ArrowRight size={16} />}
              >
                Verify &amp; Update Password
              </Button>
            </form>
          )}

          {/* STEP 3: Success */}
          {step === 'reset_success' && (
            <div className="text-center py-4 space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Your new password has been verified and securely hashed on the authentication server. You can now sign in to your portal.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 rounded-xl"
                    rightIcon={<ArrowRight size={15} />}
                  >
                    Sign In with New Password
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 mt-8">
        © 2026 APAAR CONNECT AI • Smart India Hackathon
      </div>
    </div>
  )
}
