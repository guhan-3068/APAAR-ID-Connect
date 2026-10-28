import React, { useState, useEffect, useCallback } from 'react'
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
  KeyRound,
  Shield,
  HelpCircle,
  Briefcase,
  Clock,
  Hash,
  Loader2,
  RotateCcw,
  X,
  Plus,
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
import { authService } from '@/services/authService'

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

/* Pre-populated authoritative institutions directory */
const DEFAULT_REGISTERED_COLLEGES: Array<{
  id: string
  code: string
  name: string
  state?: string
  departments?: string[]
}> = [
  {
    id: 'col_1793115697005',
    code: 'AICTE-2026',
    name: 'VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY',
    state: 'All India',
    departments: [
      'Computer Science and Engineering',
      'Artificial Intelligence and Data Science',
      'Information Technology',
      'Electronics and Communication Engineering',
      'Biomedical Engineering',
    ],
  },
  {
    id: 'col_niet_01',
    code: 'NIET-2006-AICTE',
    name: 'National Institute of Engineering & Technology',
    state: 'Delhi NCR',
    departments: [
      'Computer Science and Engineering',
      'Information Technology',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Electrical and Electronics Engineering',
      'Biotechnology',
    ],
  },
  {
    id: 'col_cit_02',
    code: 'CIT-1956-AICTE',
    name: 'Coimbatore Institute of Technology',
    state: 'Tamil Nadu',
    departments: [
      'Computer Science and Engineering',
      'Information Technology',
      'Artificial Intelligence and Data Science',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
      'Chemical Engineering',
    ],
  },
  {
    id: 'col_rvce_03',
    code: '1-4270909',
    name: 'R. V. College of Engineering',
    state: 'Karnataka',
    departments: [
      'Computer Science and Engineering',
      'Information Science and Engineering',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Aerospace Engineering',
    ],
  },
  {
    id: 'col_1793096977650',
    code: 'AICTE-3456',
    name: 'KPR INSTITUTE OF ENGINEERING AND TECHONOLOGY',
    state: 'Tamil Nadu',
    departments: [
      'Computer Science and Engineering',
      'Artificial Intelligence and Data Science',
      'Information Technology',
      'Mechanical Engineering',
      'Civil Engineering',
    ],
  },
]

export const Register: React.FC = () => {
  const navigate = useNavigate()
  const { registerStudent, registerCollege, registerPlatformAdmin } = useAuth()

  const [step, setStep] = useState<Step>('choose_portal')
  const [selectedPortal, setSelectedPortal] = useState<Portal>('student')

  /* ---- Shared fields ------------------------------------------------- */
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [institutionName, setInstitutionName] = useState('')
  const [selectedCollegeId, setSelectedCollegeId] = useState('')
  const [collegeCode, setCollegeCode] = useState('')
  const [collegesList, setCollegesList] = useState<Array<{ id: string; code: string; name: string; state?: string; departments?: string[] }>>(DEFAULT_REGISTERED_COLLEGES)
  const [isLoadingColleges, setIsLoadingColleges] = useState(false)
  const [collegeFetchError, setCollegeFetchError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  /* ---- Student-specific fields --------------------------------------- */
  const [apaarId, setApaarId] = useState('')
  const [course, setCourse] = useState('B.Tech — Undergraduate Programme')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [academicYear, setAcademicYear] = useState('1st Year (Semester 1)')
  const [agreePrivacy, setAgreePrivacy] = useState(false)

  /* ---- College Admin-specific fields --------------------------------- */
  const [aicteCode, setAicteCode] = useState('')
  const STANDARD_AICTE_DEPARTMENTS = [
    'Computer Science and Engineering',
    'Information Technology',
    'Artificial Intelligence and Data Science',
    'Electronics and Communication Engineering',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ]
  const [adminDepartments, setAdminDepartments] = useState<string[]>([
    'Computer Science and Engineering',
    'Information Technology',
    'Electronics and Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ])
  const [newAdminDeptInput, setNewAdminDeptInput] = useState('')
  const [agreeAdminDeclaration, setAgreeAdminDeclaration] = useState(false)

  /* ---- Platform Admin-specific fields -------------------------------- */
  const [username, setUsername] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [designation, setDesignation] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('What was the name of your first school?')
  const [customSecurityQuestion, setCustomSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [enrollmentStatus, setEnrollmentStatus] = useState<{ activated?: boolean; pendingApproval?: boolean; message?: string }>({})

  /* ---- UI state ------------------------------------------------------ */
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Support ?portal= query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const portalParam = params.get('portal')
    if (portalParam === 'platform_admin' || portalParam === 'college_admin' || portalParam === 'student') {
      setSelectedPortal(portalParam)
      setStep('fill_form')
    }
  }, [])

  // Load authoritative college list
  const loadColleges = useCallback(async () => {
    setIsLoadingColleges(true)
    setCollegeFetchError(null)
    try {
      const list = await authService.getColleges()
      if (Array.isArray(list) && list.length > 0) {
        setCollegesList(list)
      }
    } catch (err: any) {
      setCollegeFetchError(err?.message || 'Failed to refresh institution directory from central registry.')
    } finally {
      setIsLoadingColleges(false)
    }
  }, [])

  useEffect(() => {
    loadColleges()
  }, [loadColleges])

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setInstitutionName('')
    setSelectedCollegeId('')
    setCollegeCode('')
    setApaarId('')
    setCourse('B.Tech — Undergraduate Programme')
    setRegistrationNumber('')
    setAcademicYear('1st Year (Semester 1)')
    setAicteCode('')
    setAdminDepartments([
      'Computer Science and Engineering',
      'Information Technology',
      'Electronics and Communication Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
    ])
    setNewAdminDeptInput('')
    setUsername('')
    setEmployeeId('')
    setDesignation('')
    setSecurityQuestion('What was the name of your first school?')
    setCustomSecurityQuestion('')
    setSecurityAnswer('')
    setInvitationCode('')
    setEnrollmentStatus({})
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
    if (!emailVal.isValid) {
      errs.email = emailVal.error!
    } else if (
      selectedPortal === 'college_admin' &&
      !/\.(edu\.in|gov\.in|ac\.in|nic\.in)$/i.test(email.trim())
    ) {
      errs.email = 'Official institutional email must use a permitted domain (e.g. .edu.in, .gov.in, .ac.in)'
    } else if (
      selectedPortal === 'platform_admin' &&
      !/\.(gov\.in|nic\.in|ac\.in|edu\.in)$/i.test(email.trim()) &&
      !/@aicte\.gov\.in$/i.test(email.trim())
    ) {
      errs.email = 'Official administrator email must belong to an authorized domain (.gov.in, .nic.in, .ac.in, .edu.in)'
    }

    const passwordVal = validatePassword(password, 8)
    if (!passwordVal.isValid) {
      errs.password = passwordVal.error!
    } else if (selectedPortal === 'platform_admin') {
      const hasUpper = /[A-Z]/.test(password)
      const hasLower = /[a-z]/.test(password)
      const hasDigitOrSpecial = /[\d!@#$%^&*(),.?":{}|<>]/.test(password)
      if (!hasUpper || !hasLower || !hasDigitOrSpecial) {
        errs.password = 'Strong password policy required: Must include uppercase, lowercase, and at least one number or symbol'
      }
    }

    const matchVal = validatePasswordMatch(password, confirmPassword)
    if (!matchVal.isValid) errs.confirmPassword = matchVal.error!

    if (selectedPortal === 'student') {
      if (!selectedCollegeId && !institutionName.trim()) {
        errs.institutionName = 'Please select your college / institution'
      } else if (selectedCollegeId === 'other') {
        if (!institutionName.trim()) {
          errs.institutionName = 'Institution name is required'
        }
        if (!collegeCode.trim()) {
          errs.collegeCode = 'AICTE / Institution identifier is required to link with your college portal'
        }
      }
    } else if (selectedPortal === 'college_admin') {
      const instVal = validateRequired(institutionName, 'Institution name')
      if (!instVal.isValid) errs.institutionName = instVal.error!
    }

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

      if (adminDepartments.length === 0) {
        errs.departments = 'Please configure at least one academic department offered by your institution'
      }

      if (!agreeAdminDeclaration) {
        errs.agreeAdminDeclaration =
          'You must certify that you are an authorized institutional representative'
      }
    }

    if (selectedPortal === 'platform_admin') {
      if (!username.trim()) {
        errs.username = 'Administrative username is required'
      } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
        errs.username = 'Username must be 3–30 characters long and contain only letters, numbers, and underscores'
      }

      const empVal = validateRequired(employeeId, 'Employee / Officer ID')
      if (!empVal.isValid) errs.employeeId = empVal.error!

      const desVal = validateRequired(designation, 'Official Designation')
      if (!desVal.isValid) errs.designation = desVal.error!

      const effectiveQuestion = securityQuestion === 'custom' ? customSecurityQuestion : securityQuestion
      if (!effectiveQuestion.trim() || effectiveQuestion.trim().length < 5) {
        errs.securityQuestion = 'Security question must be at least 5 characters long'
      }

      if (!securityAnswer.trim() || securityAnswer.trim().length < 2) {
        errs.securityAnswer = 'Security question answer is required (minimum 2 characters)'
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
        const res = await registerStudent({
          fullName,
          email,
          institutionName,
          collegeId: selectedCollegeId && selectedCollegeId !== 'other' ? selectedCollegeId : undefined,
          collegeCode: collegeCode.trim() || undefined,
          apaarId,
          password,
          course,
          academicYear,
          registrationNumber: registrationNumber.trim() || undefined,
        })
        setIsLoading(false)
        navigate(res.redirectPath || '/student')
      } else if (selectedPortal === 'college_admin') {
        const res = await registerCollege({
          fullName,
          email,
          institutionName,
          aicteCode,
          password,
          departments: adminDepartments,
        })
        setIsLoading(false)
        navigate(res.redirectPath || '/admin')
      } else if (selectedPortal === 'platform_admin') {
        const effectiveQuestion = securityQuestion === 'custom' ? customSecurityQuestion : securityQuestion
        const res = await registerPlatformAdmin({
          fullName,
          email,
          username,
          employeeId,
          designation,
          password,
          confirmPassword,
          securityQuestion: effectiveQuestion,
          securityAnswer,
          invitationCode: invitationCode.trim() || undefined,
        })
        setIsLoading(false)
        if (res.activated) {
          navigate(res.redirectPath || '/platform')
        } else {
          setEnrollmentStatus({
            activated: res.activated,
            pendingApproval: res.pendingApproval,
            message: res.message,
          })
          setStep('success')
        }
      }
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
              description="For authorized AICTE nodal officers and platform administrators. Enroll using an administrative invitation token or submit an authorization request."
              accentColor="border-rose-200 hover:border-rose-300"
              buttonLabel="Enroll as Platform Admin"
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
            {/* Platform Admin Registration Form */}
            {selectedPortal === 'platform_admin' && step === 'fill_form' && (
              <>
                <div className="text-center space-y-1.5 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-rose-500/20 mx-auto">
                    <ShieldCheck size={24} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Platform Administrator Enrollment
                  </h2>
                  <p className="text-xs text-slate-500">
                    AICTE Central Authority & Platform Operations Onboarding
                  </p>
                </div>

                {/* Privileged Enrollment Notice */}
                <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <ShieldAlert size={14} className="shrink-0" />
                    <span>Privileged Enrollment Policy</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Platform Administrator registration requires an official government email and a unique security question. Entering an authorized invitation token activates the account immediately; otherwise, requests remain pending central administrative approval.
                  </p>
                </div>

                {generalError && (
                  <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5 leading-relaxed">
                    <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{generalError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Full Name */}
                  <Input
                    label="Full Name & Title"
                    id="admin-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }))
                    }}
                    error={errors.fullName}
                    leftIcon={<User size={16} />}
                    placeholder="e.g. Dr. Anil Sahasrabudhe"
                    autoComplete="name"
                    required
                  />

                  {/* Official Email */}
                  <Input
                    label="Official Government / Educational Email"
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                    }}
                    error={errors.email}
                    leftIcon={<Mail size={16} />}
                    placeholder="e.g. nodal.officer@aicte.gov.in"
                    helperText="Must end in .gov.in, .nic.in, .ac.in, or .edu.in"
                    autoComplete="email"
                    required
                  />

                  {/* Administrative Username */}
                  <Input
                    label="Administrative Username"
                    id="admin-username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }))
                    }}
                    error={errors.username}
                    leftIcon={<User size={16} />}
                    placeholder="e.g. aicte_nodal_officer"
                    helperText="Letters, numbers, and underscores (3–30 characters)"
                    autoComplete="username"
                    required
                  />

                  {/* Identification: Employee ID & Designation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Employee / Officer ID"
                      id="admin-empid"
                      type="text"
                      value={employeeId}
                      onChange={(e) => {
                        setEmployeeId(e.target.value)
                        if (errors.employeeId) setErrors((prev) => ({ ...prev, employeeId: undefined }))
                      }}
                      error={errors.employeeId}
                      leftIcon={<Briefcase size={16} />}
                      placeholder="e.g. AICTE-EMP-1042"
                      required
                    />

                    <Input
                      label="Official Designation"
                      id="admin-designation"
                      type="text"
                      value={designation}
                      onChange={(e) => {
                        setDesignation(e.target.value)
                        if (errors.designation) setErrors((prev) => ({ ...prev, designation: undefined }))
                      }}
                      error={errors.designation}
                      leftIcon={<Building2 size={16} />}
                      placeholder="e.g. Central Nodal Officer"
                      required
                    />
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Password"
                      id="admin-password"
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
                      placeholder="Min 8 characters"
                      autoComplete="new-password"
                      required
                    />

                    <Input
                      label="Confirm Password"
                      id="admin-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
                      }}
                      error={errors.confirmPassword}
                      leftIcon={<Lock size={16} />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      required
                    />
                  </div>

                  {/* Security Question Selection */}
                  <div className="space-y-1">
                    <label htmlFor="admin-security-question" className="block text-xs font-semibold text-slate-700">
                      Unique Security Question
                    </label>
                    <div className="relative">
                      <select
                        id="admin-security-question"
                        value={securityQuestion}
                        onChange={(e) => {
                          setSecurityQuestion(e.target.value)
                          if (errors.securityQuestion) setErrors((prev) => ({ ...prev, securityQuestion: undefined }))
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all cursor-pointer shadow-sm"
                      >
                        <option value="What was the name of your first school?">What was the name of your first school?</option>
                        <option value="What was the name of your first teacher?">What was the name of your first teacher?</option>
                        <option value="What was the first book you remember reading?">What was the first book you remember reading?</option>
                        <option value="What was the name of your first childhood friend?">What was the name of your first childhood friend?</option>
                        <option value="What was the model of your first car or bike?">What was the model of your first car or bike?</option>
                        <option value="custom">Write a custom security question...</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Security Question Input */}
                  {securityQuestion === 'custom' && (
                    <Input
                      label="Your Custom Security Question"
                      id="admin-custom-question"
                      type="text"
                      value={customSecurityQuestion}
                      onChange={(e) => {
                        setCustomSecurityQuestion(e.target.value)
                        if (errors.securityQuestion) setErrors((prev) => ({ ...prev, securityQuestion: undefined }))
                      }}
                      error={errors.securityQuestion}
                      leftIcon={<HelpCircle size={16} />}
                      placeholder="e.g. In which city was your first government appointment?"
                      required
                    />
                  )}

                  {/* Security Answer */}
                  <div>
                    <Input
                      label="Security Question Answer"
                      id="admin-security-answer"
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => {
                        setSecurityAnswer(e.target.value)
                        if (errors.securityAnswer) setErrors((prev) => ({ ...prev, securityAnswer: undefined }))
                      }}
                      error={errors.securityAnswer}
                      leftIcon={<KeyRound size={16} />}
                      placeholder="Enter your security answer"
                      autoComplete="off"
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-500 leading-normal">
                      Security questions are an auxiliary recovery and verification measure. Answers are normalized (case-insensitive) and hashed using salted PBKDF2 before storage. Never share your answer.
                    </p>
                  </div>

                  {/* Invitation Token / Code */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="admin-invitation-code" className="text-xs font-semibold text-slate-700">
                        Administrator Invitation Code (Optional)
                      </label>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Optional</span>
                    </div>
                    <Input
                      id="admin-invitation-code"
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                      placeholder="e.g. AICTE-ADMIN-ENROLL-2026"
                      leftIcon={<Shield size={16} />}
                      className="font-mono uppercase tracking-wider"
                    />
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      If provided with an authorized invitation token generated by the AICTE Central Operator, your account will be activated immediately. Without a token, your registration is submitted as a pending approval request.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 shadow-md shadow-rose-500/20 rounded-xl"
                    rightIcon={<ArrowRight size={16} />}
                  >
                    Submit Administrator Enrollment
                  </Button>
                </form>
              </>
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

                  {/* Institution Name / Selection */}
                  {selectedPortal === 'student' ? (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          className="block text-xs font-semibold text-slate-700"
                          htmlFor="reg-college-select"
                        >
                          College / Institution <span className="text-red-500">*</span>
                        </label>
                        {isLoadingColleges && (
                          <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                            <Loader2 size={12} className="animate-spin" />
                            <span>Updating directory...</span>
                          </span>
                        )}
                      </div>

                      {collegeFetchError && (
                        <div className="p-3 mb-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold flex items-center gap-1.5">
                              <AlertCircle size={14} className="text-rose-600 shrink-0" />
                              Unable to refresh institution directory
                            </span>
                            <button
                              type="button"
                              onClick={loadColleges}
                              className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <RotateCcw size={12} />
                              <span>Retry</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-rose-700 leading-relaxed">
                            {collegeFetchError}
                          </p>
                        </div>
                      )}

                      <div className="relative">
                        <select
                          id="reg-college-select"
                          value={selectedCollegeId}
                          onChange={(e) => {
                            const val = e.target.value
                            setSelectedCollegeId(val)
                            const found = collegesList.find((c) => c.id === val)
                            if (found) {
                              setInstitutionName(found.name)
                              setCollegeCode(found.code)
                            } else if (val !== 'other') {
                              setInstitutionName('')
                              setCollegeCode('')
                            }
                            if (errors.institutionName) {
                              setErrors((p) => ({ ...p, institutionName: undefined }))
                            }
                            if (errors.collegeCode) {
                              setErrors((p) => ({ ...p, collegeCode: undefined }))
                            }
                          }}
                          className={`w-full rounded-xl border ${
                            errors.institutionName
                              ? 'border-red-400 bg-red-50/20'
                              : 'border-slate-300 bg-white'
                          } px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium`}
                          required
                        >
                          <option value="">
                            {isLoadingColleges && collegesList.length === 0
                              ? '-- Loading Registered Institutions... --'
                              : '-- Select Your Authorized College / Institution --'}
                          </option>
                          {collegesList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.code})
                            </option>
                          ))}
                          <option value="other">Other / Enter Institution Manually</option>
                        </select>
                      </div>

                      {selectedCollegeId === 'other' && (
                        <div className="mt-2.5 space-y-2.5">
                          <Input
                            label="Institution Name"
                            id="reg-institution-manual"
                            value={institutionName}
                            onChange={(e) => {
                              setInstitutionName(e.target.value)
                              if (errors.institutionName)
                                setErrors((p) => ({ ...p, institutionName: undefined }))
                            }}
                            error={errors.institutionName}
                            leftIcon={<Building2 size={16} />}
                            placeholder="e.g. Velalar College of Engineering and Technology"
                            required
                          />
                          <Input
                            label="AICTE Permanent Institution Number / Code"
                            id="reg-aicte-manual"
                            value={collegeCode}
                            onChange={(e) => {
                              setCollegeCode(e.target.value)
                              if (errors.collegeCode)
                                setErrors((p) => ({ ...p, collegeCode: undefined }))
                            }}
                            error={errors.collegeCode}
                            leftIcon={<Hash size={16} />}
                            placeholder="e.g. AICTE-2026 or 1-1234567"
                            helperText="Enter your institution's permanent AICTE / University affiliation number to automatically link your account with your college portal."
                            required
                          />
                        </div>
                      )}

                      {errors.institutionName && selectedCollegeId !== 'other' && (
                        <p className="mt-1 text-[11px] text-red-600 font-medium">
                          {errors.institutionName}
                        </p>
                      )}
                    </div>
                  ) : (
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
                    />
                  )}

                  {/* College Registration Number — Student only */}
                  {selectedPortal === 'student' && (
                    <Input
                      label="College Registration / Roll Number (Optional)"
                      id="reg-registration-number"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. 2024CS0841"
                      leftIcon={<Hash size={16} />}
                      helperText="Official student registration or enrollment number issued by your college (if available)"
                    />
                  )}

                  {/* Programme / Degree & Academic Year — Student only */}
                  {selectedPortal === 'student' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                          htmlFor="reg-course-input"
                        >
                          Programme / Degree
                        </label>
                        <input
                          id="reg-course-input"
                          type="text"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                          placeholder="e.g. B.Tech / Undergraduate"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-xs font-semibold text-slate-700 mb-1.5"
                          htmlFor="reg-academic-year-select"
                        >
                          Academic Year / Semester
                        </label>
                        <select
                          id="reg-academic-year-select"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                        >
                          <option value="1st Year (Semester 1)">1st Year (Semester 1)</option>
                          <option value="1st Year (Semester 2)">1st Year (Semester 2)</option>
                          <option value="2nd Year (Semester 3)">2nd Year (Semester 3)</option>
                          <option value="2nd Year (Semester 4)">2nd Year (Semester 4)</option>
                          <option value="3rd Year (Semester 5)">3rd Year (Semester 5)</option>
                          <option value="3rd Year (Semester 6)">3rd Year (Semester 6)</option>
                          <option value="4th Year (Semester 7)">4th Year (Semester 7)</option>
                          <option value="4th Year (Semester 8)">4th Year (Semester 8)</option>
                        </select>
                      </div>
                    </div>
                  )}

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

                  {/* Department Configuration — College Admin only */}
                  {selectedPortal === 'college_admin' && (
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-slate-800">
                            Offered Academic Departments <span className="text-red-500">*</span>
                          </label>
                          <p className="text-[11px] text-slate-500">
                            Configure departments offered by your institution. Enrolling students will choose from this list.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminDepartments(STANDARD_AICTE_DEPARTMENTS)
                            if (errors.departments) setErrors((p) => ({ ...p, departments: undefined }))
                          }}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer shrink-0"
                          title="Reset to recommended AICTE technical departments"
                        >
                          <RotateCcw size={12} />
                          <span>Standard AICTE</span>
                        </button>
                      </div>

                      {/* Add custom department input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAdminDeptInput}
                          onChange={(e) => setNewAdminDeptInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const trimmed = newAdminDeptInput.trim()
                              if (trimmed && !adminDepartments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
                                setAdminDepartments([...adminDepartments, trimmed])
                                setNewAdminDeptInput('')
                                if (errors.departments) setErrors((p) => ({ ...p, departments: undefined }))
                              }
                            }
                          }}
                          placeholder="Add department (e.g. Biomedical Engineering)"
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<Plus size={14} />}
                          onClick={() => {
                            const trimmed = newAdminDeptInput.trim()
                            if (trimmed && !adminDepartments.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
                              setAdminDepartments([...adminDepartments, trimmed])
                              setNewAdminDeptInput('')
                              if (errors.departments) setErrors((p) => ({ ...p, departments: undefined }))
                            }
                          }}
                          disabled={!newAdminDeptInput.trim()}
                        >
                          Add
                        </Button>
                      </div>

                      {/* Chips of configured departments */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                          {adminDepartments.map((dept) => (
                            <span
                              key={dept}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium shadow-2xs"
                            >
                              <span>{dept}</span>
                              <button
                                type="button"
                                onClick={() => setAdminDepartments(adminDepartments.filter((d) => d !== dept))}
                                className="text-slate-400 hover:text-rose-600 rounded p-0.5 cursor-pointer transition-colors"
                                title={`Remove ${dept}`}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                        {adminDepartments.length === 0 && (
                          <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            ⚠️ At least one department must be configured for your college. Click &quot;Standard AICTE&quot; above to add recommended departments.
                          </p>
                        )}
                      </div>

                      {errors.departments && (
                        <p className="text-[11px] text-red-600 font-medium">
                          {errors.departments}
                        </p>
                      )}
                    </div>
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

            {/* Platform Admin Success / Pending Status */}
            {step === 'success' && selectedPortal === 'platform_admin' && (
              <div className="space-y-5 py-2">
                <div className="flex items-center gap-4">
                  {enrollmentStatus.activated ? (
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck size={28} />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Clock size={28} />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {enrollmentStatus.activated
                        ? 'Platform Administrator Account Activated'
                        : 'Enrollment Request Submitted — Pending Approval'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {enrollmentStatus.activated
                        ? `Official credentials verified for ${fullName}`
                        : `Application logged for ${fullName} (${employeeId})`}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5">
                  <p>
                    <strong>Email:</strong> {email}
                  </p>
                  <p>
                    <strong>Administrative Username:</strong> {username}
                  </p>
                  <p>
                    <strong>Officer ID & Designation:</strong> {employeeId} — {designation}
                  </p>
                  <p>
                    <strong>Security Question:</strong>{' '}
                    <span className="italic text-slate-600">
                      {securityQuestion === 'custom' ? customSecurityQuestion : securityQuestion}
                    </span>
                  </p>

                  {enrollmentStatus.activated ? (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="shrink-0" />
                        Account Activated via Authorized Invitation Token
                      </p>
                      <p className="text-emerald-700">
                        Your platform administrator credentials and security question have been cryptographically verified and securely stored in the database. You may now sign in to the AICTE Administration Portal.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                      <p className="font-semibold flex items-center gap-1.5">
                        <ShieldAlert size={13} className="shrink-0 text-amber-600" />
                        Privileged Access Control — Authorization Required
                      </p>
                      <p className="text-amber-700 leading-relaxed">
                        In accordance with AICTE privileged access policies, administrator registration requests without a pre-authorized token remain pending until an active system administrator approves them or a system operator provisions access via the secure server CLI.
                      </p>
                    </div>
                  )}

                  <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[11px]">
                    <strong>Cryptographic Protection Note:</strong> Your security question answer is stored using a PBKDF2 hash with 100,000 iterations and a cryptographically random salt. It is never transmitted back or stored in plaintext.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700"
                    onClick={() => navigate('/login?portal=platform_admin')}
                    rightIcon={<ArrowRight size={14} />}
                  >
                    Proceed to AICTE Portal Sign In
                  </Button>
                  <Link to="/" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Return to Home
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
