import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  ArrowLeft,
  FileBadge,
  ShieldAlert,
  CheckCircle2,
  GraduationCap,
  Landmark,
  FileCheck,
  Info,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from '@/utils/authValidation'
import { formatApaarId, isValidApaarId } from '@/utils/formatters'
import { useAuth } from '@/context/AuthContext'

type Portal = 'student' | 'college_admin' | 'platform_admin'
type Step = 'choose_portal' | 'fill_form' | 'success'

interface PortalCardProps {
  icon: React.ReactNode
  title: string
  description: string
  accentColor: string
  buttonLabel: string
  onClick: () => void
}

const PortalCard: React.FC<PortalCardProps> = ({
  icon,
  title,
  description,
  accentColor,
  buttonLabel,
  onClick,
}) => (
  <div
    className={`relative flex flex-col items-center text-center p-7 rounded-2xl border-2 ${accentColor} bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
  >
    <div className="mb-4">{icon}</div>
    <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-xs text-slate-500 leading-relaxed mb-5">{description}</p>
    <Button
      variant="primary"
      size="sm"
      rightIcon={<ArrowRight size={14} />}
      onClick={onClick}
      className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm text-xs font-semibold"
    >
      {buttonLabel}
    </Button>
  </div>
)

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { registerStudent, registerCollege } = useAuth()

  const [step, setStep] = useState<Step>('choose_portal')
  const [selectedPortal, setSelectedPortal] = useState<Portal>('student')

  /* ---- Shared fields ------------------------------------------------- */
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  /* ---- Student-specific fields --------------------------------------- */
  const [apaarId, setApaarId] = useState('')
  const [agreePrivacy, setAgreePrivacy] = useState(false)

  /* ---- College Admin-specific fields --------------------------------- */
  const [aicteCode, setAicteCode] = useState('')
  const [agreeAdminDeclaration, setAgreeAdminDeclaration] = useState(false)

  /* ---- UI state ------------------------------------------------------ */
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setInstitutionName('')
    setApaarId('')
    setAicteCode('')
    setAgreePrivacy(false)
    setAgreeAdminDeclaration(false)
    setErrors({})
    setGeneralError(null)
  }

  const selectPortal = (portal: Portal) => {
    setSelectedPortal(portal)
    resetForm()
    setStep('fill_form')
  }

  /* ------------------------------------------------------------------ */
  /* Validation                                                          */
  /* ------------------------------------------------------------------ */

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}

    const nameVal = validateRequired(fullName, 'Full name')
    if (!nameVal.isValid) errs.fullName = nameVal.error!

    const emailVal = validateEmail(email)
    if (!emailVal.isValid) errs.email = emailVal.error!

    // College admin: enforce educational domain
    if (
      selectedPortal === 'college_admin' &&
      email.trim() &&
      !/\.(edu\.in|gov\.in|ac\.in|nic\.in)$/i.test(email.trim())
    ) {
      errs.email =
        'Official institutional email must use a permitted domain (e.g. .edu.in, .gov.in, .ac.in)'
    }

    const passwordVal = validatePassword(password, 8)
    if (!passwordVal.isValid) errs.password = passwordVal.error!

    const matchVal = validatePasswordMatch(password, confirmPassword)
    if (!matchVal.isValid) errs.confirmPassword = matchVal.error!

    const instVal = validateRequired(institutionName, 'Institution name')
    if (!instVal.isValid) errs.institutionName = instVal.error!

    if (selectedPortal === 'student') {
      const cleanedId = apaarId.replace(/\D/g, '')
      if (!cleanedId) {
        errs.apaarId = '12-digit APAAR ID is required'
      } else if (!isValidApaarId(cleanedId)) {
        errs.apaarId = 'APAAR ID must be exactly 12 digits'
      }

      if (!agreePrivacy) {
        errs.agreePrivacy = 'You must agree to the Digital Personal Data Protection policy'
      }
    }

    if (selectedPortal === 'college_admin') {
      const aicteVal = validateRequired(aicteCode, 'AICTE Permanent Institution Code')
      if (!aicteVal.isValid) errs.aicteCode = aicteVal.error!

      if (!agreeAdminDeclaration) {
        errs.agreeAdminDeclaration =
          'You must certify that you are an authorized institutional representative'
      }
    }

    return errs
  }

  /* ------------------------------------------------------------------ */
  /* Submit                                                              */
  /* ------------------------------------------------------------------ */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneralError(null)

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      if (selectedPortal === 'student') {
        await registerStudent({
          fullName,
          email,
          institutionName,
          apaarId,
          password,
        })
      } else if (selectedPortal === 'college_admin') {
        await registerCollege({
          fullName,
          email,
          institutionName,
          aicteCode,
          password,
        })
      }
      setIsLoading(false)
      setStep('success')
    } catch (err: any) {
      setIsLoading(false)
      setGeneralError(err.message || 'Registration failed. Please verify your details.')
    }
  }

  /* ================================================================== */
  /* RENDER                                                              */
  /* ================================================================== */

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/20 selection:text-blue-700">
      {/* Background accent */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-100/60 via-indigo-100/40 to-purple-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Back navigation */}
      <div
        className={`w-full mx-auto flex items-center mb-6 ${
          step === 'choose_portal' ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        {step === 'choose_portal' ? (
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
              setStep('choose_portal')
              resetForm()
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Choose a Different Portal</span>
          </button>
        )}
      </div>

      {/* STEP 1: CHOOSE YOUR PORTAL */}
      {step === 'choose_portal' && (
        <div className="max-w-3xl w-full mx-auto">
          {/* Header */}
          <div className="text-center space-y-2 mb-10">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck size={26} className="stroke-[2.2]" />
              </div>
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Portal
            </h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Select the portal that matches your role to create your APAAR CONNECT account
            </p>
          </div>

          {/* Portal Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Student Portal */}
            <PortalCard
              icon={
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <GraduationCap size={32} />
                </div>
              }
              title="Student Portal"
              description="For undergraduate, postgraduate, and doctoral students. Register using your 12-digit APAAR ID to access academic records, credit tracking, and DigiLocker integration."
              accentColor="border-blue-200 hover:border-blue-400"
              buttonLabel="Register as Student"
              onClick={() => selectPortal('student')}
            />

            {/* College Portal */}
            <PortalCard
              icon={
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Landmark size={32} />
                </div>
              }
              title="College Portal"
              description="For registrars and nodal officers of AICTE-approved institutions. Manage student records, verification queues, AICTE compliance, and academic audit workflows."
              accentColor="border-indigo-200 hover:border-indigo-400"
              buttonLabel="Register Institution"
              onClick={() => selectPortal('college_admin')}
            />

            {/* Platform Admin Portal */}
            <PortalCard
              icon={
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
                  <ShieldAlert size={32} />
                </div>
              }
              title="Platform Admin Portal"
              description="Restricted to authorized AICTE platform administrators. Access is provisioned exclusively through official government channels — public self-registration is not permitted."
              accentColor="border-rose-200 hover:border-rose-300"
              buttonLabel="Platform Admin Access"
              onClick={() => selectPortal('platform_admin')}
            />
          </div>

          {/* Already have account */}
          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:text-purple-600 hover:underline transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      )}

      {/* STEP 2: REGISTRATION FORM */}
      {(step === 'fill_form' || step === 'success') && (
        <div className="max-w-lg w-full mx-auto">
          <Card className="border border-slate-200/90 shadow-xl rounded-2xl p-6 sm:p-8 bg-white/95 backdrop-blur-md">
            {/* Platform Admin Restriction (no form) */}
            {selectedPortal === 'platform_admin' && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-6 space-y-4 text-center">
                <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <ShieldAlert size={30} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-rose-900">
                    Public Registration Not Permitted
                  </h2>
                  <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto">
                    In compliance with AICTE cybersecurity and Ministry of Education data
                    protection mandates,{' '}
                    <strong>Platform Administrator accounts cannot be self-registered</strong>.
                  </p>
                  <p className="text-[11px] text-rose-700 leading-relaxed max-w-md mx-auto pt-1">
                    Platform Admin credentials are provisioned exclusively through authorized
                    government nodal authorities. An administrative account (`admin@aicte.gov.in`) has
                    been provisioned for official platform operations.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 text-rose-800 hover:bg-rose-100"
                    >
                      Go to Sign In
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('choose_portal')
                      resetForm()
                    }}
                    className="text-xs font-semibold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                  >
                    Choose a different portal
                  </button>
                </div>
              </div>
            )}

            {/* Student / College Admin Form */}
            {selectedPortal !== 'platform_admin' && step === 'fill_form' && (
              <>
                {/* Heading */}
                <div className="text-center space-y-1.5 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20 mx-auto">
                    {selectedPortal === 'student' ? (
                      <GraduationCap size={24} />
                    ) : (
                      <Landmark size={24} />
                    )}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {selectedPortal === 'student'
                      ? 'Student Registration'
                      : 'College Portal Registration'}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {selectedPortal === 'student'
                      ? 'Complete enrollment to access your APAAR-linked academic portal'
                      : 'Register your institution to manage students and AICTE compliance'}
                  </p>
                </div>

                {/* Error Banner */}
                {generalError && (
                  <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{generalError}</span>
                  </div>
                )}

                {/* Context notice */}
                <div className="mb-5 p-3 rounded-xl bg-blue-50/80 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2">
                  <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>
                    {selectedPortal === 'student'
                      ? 'All fields are required. Your APAAR ID must match the 12-digit One Nation One Student ID.'
                      : 'All fields are required. Enter your official institutional domain email and AICTE permanent code.'}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Full Name */}
                  <Input
                    label={
                      selectedPortal === 'student'
                        ? 'Full Name'
                        : 'Registrar / Admin Full Name'
                    }
                    id="reg-full-name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (errors.fullName) setErrors((p) => ({ ...p, fullName: undefined }))
                    }}
                    error={errors.fullName}
                    leftIcon={<User size={16} />}
                    placeholder="e.g. Aarav Sharma"
                    required
                  />

                  {/* Email */}
                  <Input
                    label={
                      selectedPortal === 'student'
                        ? 'Email ID'
                        : 'Official Institutional Email'
                    }
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                    }}
                    error={errors.email}
                    leftIcon={<Mail size={16} />}
                    placeholder={
                      selectedPortal === 'student'
                        ? 'aarav.sharma@student.niet.edu.in'
                        : 'registrar@institution.edu.in'
                    }
                    helperText={
                      selectedPortal === 'college_admin'
                        ? 'Must be an official educational or government domain (.edu.in, .gov.in, .ac.in)'
                        : undefined
                    }
                    required
                  />

                  {/* Institution Name */}
                  <Input
                    label="Institution Name"
                    id="reg-institution"
                    value={institutionName}
                    onChange={(e) => {
                      setInstitutionName(e.target.value)
                      if (errors.institutionName)
                        setErrors((p) => ({ ...p, institutionName: undefined }))
                    }}
                    error={errors.institutionName}
                    leftIcon={<Building2 size={16} />}
                    placeholder="e.g. National Institute of Engineering & Technology"
                    required
                  />

                  {/* APAAR ID — Student only */}
                  {selectedPortal === 'student' && (
                    <Input
                      label="12-Digit APAAR ID"
                      id="reg-apaar-id"
                      inputMode="numeric"
                      value={apaarId}
                      onChange={(e) => {
                        setApaarId(formatApaarId(e.target.value))
                        if (errors.apaarId) setErrors((p) => ({ ...p, apaarId: undefined }))
                      }}
                      error={errors.apaarId}
                      leftIcon={<FileBadge size={16} />}
                      placeholder="e.g. 2104-2024-1234"
                      helperText="Your 12-digit One Nation One Student ID issued by Academic Bank of Credits"
                      maxLength={14}
                      required
                    />
                  )}

                  {/* AICTE Code — College Admin only */}
                  {selectedPortal === 'college_admin' && (
                    <Input
                      label="AICTE Permanent Institution Code"
                      id="reg-aicte-code"
                      value={aicteCode}
                      onChange={(e) => {
                        setAicteCode(e.target.value)
                        if (errors.aicteCode)
                          setErrors((p) => ({ ...p, aicteCode: undefined }))
                      }}
                      error={errors.aicteCode}
                      leftIcon={<FileCheck size={16} />}
                      placeholder="e.g. 1-4928172"
                      helperText="Issued by AICTE for approved technical institutions"
                      required
                    />
                  )}

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Create Password"
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                      }}
                      error={errors.password}
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
                    <Input
                      label="Confirm Password"
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errors.confirmPassword)
                          setErrors((p) => ({ ...p, confirmPassword: undefined }))
                      }}
                      error={errors.confirmPassword}
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
                      placeholder="Re-enter password"
                      required
                    />
                  </div>

                  {/* Consent checkbox */}
                  <div className="pt-1 space-y-1">
                    {selectedPortal === 'student' ? (
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                        <input
                          type="checkbox"
                          id="reg-agree-privacy"
                          checked={agreePrivacy}
                          onChange={(e) => {
                            setAgreePrivacy(e.target.checked)
                            if (errors.agreePrivacy)
                              setErrors((p) => ({ ...p, agreePrivacy: undefined }))
                          }}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>
                          I agree to the{' '}
                          <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>{' '}
                          policy and authorize linkage with DigiLocker and the Academic Bank of
                          Credits for APAAR ID verification.
                        </span>
                      </label>
                    ) : (
                      <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                        <input
                          type="checkbox"
                          id="reg-agree-admin"
                          checked={agreeAdminDeclaration}
                          onChange={(e) => {
                            setAgreeAdminDeclaration(e.target.checked)
                            if (errors.agreeAdminDeclaration)
                              setErrors((p) => ({ ...p, agreeAdminDeclaration: undefined }))
                          }}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span>
                          I certify that I am an authorized registrar or nodal officer
                          designated by the college administration for AICTE student data
                          governance responsibilities.
                        </span>
                      </label>
                    )}
                    {(errors.agreePrivacy || errors.agreeAdminDeclaration) && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.agreePrivacy || errors.agreeAdminDeclaration}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 rounded-xl"
                    rightIcon={<ArrowRight size={16} />}
                  >
                    {selectedPortal === 'student'
                      ? 'Complete Enrollment'
                      : 'Register Institution'}
                  </Button>
                </form>
              </>
            )}

            {/* Success / Status */}
            {step === 'success' && selectedPortal !== 'platform_admin' && (
              <div className="space-y-5 py-2">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedPortal === 'student'
                        ? 'Account Created & Authenticated'
                        : 'Institution Registered Successfully'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedPortal === 'student'
                        ? `Account created for ${fullName}`
                        : `Registration completed for ${institutionName}`}
                    </p>
                  </div>
                </div>

                {/* Status details box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
                  <p>
                    <strong>Email:</strong> {email}
                  </p>
                  <p>
                    <strong>Institution:</strong> {institutionName}
                  </p>
                  {selectedPortal === 'student' && apaarId && (
                    <p>
                      <strong>APAAR ID:</strong> {apaarId}
                    </p>
                  )}
                  {selectedPortal === 'college_admin' && (
                    <p>
                      <strong>AICTE Code:</strong> {aicteCode}
                    </p>
                  )}
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                    <strong>Authentication Session Active:</strong> Your credentials have been verified and securely stored in the database.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => navigate(selectedPortal === 'student' ? '/student' : '/admin')}
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Go to {selectedPortal === 'student' ? 'Student Dashboard' : 'College Portal'}
                  </Button>
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Bottom link */}
            {selectedPortal !== 'platform_admin' && step === 'fill_form' && (
              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-blue-600 hover:text-purple-600 hover:underline transition-colors"
                >
                  Sign in here
                </Link>
              </div>
            )}
          </Card>

          {/* Disclaimer */}
          {step === 'fill_form' && selectedPortal !== 'platform_admin' && (
            <div className="mt-4 text-center text-[11px] text-slate-400">
              <p className="flex items-center justify-center gap-1.5">
                <AlertTriangle size={12} className="text-amber-500" />
                <span>
                  {selectedPortal === 'student'
                    ? 'A 12-digit APAAR ID is verified against the backend registry. Duplicate APAAR IDs are prevented.'
                    : 'Institutional accounts are associated with official AICTE codes and educational email domains.'}
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 mt-8">
        © 2026 APAAR CONNECT AI • AICTE Smart India Hackathon Innovation
      </div>
    </div>
  )
}
