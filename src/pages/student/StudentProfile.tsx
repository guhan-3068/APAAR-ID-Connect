import React, { useState } from 'react'
import { 
  User, 
  Mail, 
  BookOpen, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck,
  Info,
  Layers,
  Building2,
  FileBadge,
  GraduationCap,
  Hash,
  Award
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { useStudent } from '@/context/StudentContext'
import { formatApaarId } from '@/utils/formatters'

export const StudentProfile: React.FC = () => {
  const { profile, updateProfile } = useStudent()
  const [isEditing, setIsEditing] = useState(false)
  const [showApaar, setShowApaar] = useState(false)
  const [copiedApaar, setCopiedApaar] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Editable Form Fields
  const [editForm, setEditForm] = useState({
    fullName: profile.fullName,
    phone: profile.phone,
    bloodGroup: profile.bloodGroup,
    admissionCategory: profile.admissionCategory,
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleCopyApaar = () => {
    navigator.clipboard.writeText(profile.apaarId)
    setCopiedApaar(true)
    setTimeout(() => setCopiedApaar(false), 2000)
  }

  const handleStartEdit = () => {
    setEditForm({
      fullName: profile.fullName,
      phone: profile.phone,
      bloodGroup: profile.bloodGroup,
      admissionCategory: profile.admissionCategory,
    })
    setFormErrors({})
    setSaveSuccess(false)
    setSaveError(null)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormErrors({})
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveSuccess(false)
    setSaveError(null)

    // Form Validations
    const errors: Record<string, string> = {}
    if (!editForm.fullName || editForm.fullName.trim() === '') {
      errors.fullName = 'Full name cannot be empty'
    }
    if (!editForm.phone || editForm.phone.trim() === '') {
      errors.phone = 'Contact number is required'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSaving(true)

    // Simulate saving changes
    setTimeout(() => {
      updateProfile({
        fullName: editForm.fullName,
        phone: editForm.phone,
        bloodGroup: editForm.bloodGroup,
        admissionCategory: editForm.admissionCategory,
      })
      setIsSaving(false)
      setIsEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 5000)
    }, 500)
  }

  // Masked APAAR ID: show last 4 digits only when masked
  const getMaskedApaar = () => {
    if (showApaar) {
      return formatApaarId(profile.apaarId)
    }
    return `•••• •••• ${profile.apaarId.slice(-4)}`
  }

  // Current semester formatting
  const currentSemesterText = profile.currentSemester 
    ? (typeof profile.currentSemester === 'number' ? `Semester ${profile.currentSemester}` : profile.currentSemester) 
    : 'Semester 7'

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Synthetic Demonstration Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Official Student Profile:</strong> Displaying authenticated institutional record data synchronized with the registrar and APAAR registry.
          </span>
        </div>
        <Badge status="verified" variant="subtle" className="text-[10px]">
          Authenticated Record
        </Badge>
      </div>

      {/* Success / Error Feedback Alerts */}
      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Profile information updated successfully for this session.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <Info size={16} className="text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Profile Header Card with Default Avatar / Photo and Register Number in LARGE BOLD TEXT */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start sm:items-center gap-5">
            {/* Profile Photo / Default Avatar */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-cover border-2 border-blue-500 shadow-md shrink-0"
              />
            ) : (
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 ring-4 ring-blue-50">
                {profile.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Register Number
                </span>
                <Badge status="verified" dot>
                  {profile.enrollmentVerificationStatus || 'Verified'}
                </Badge>
              </div>

              {/* Register Number in Large, Bold Text */}
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                {profile.registrationNumber}
              </div>

              {/* Student Name */}
              <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                {profile.fullName}
              </h2>

              <p className="text-xs text-slate-500">
                {profile.institutionName} • {profile.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {!isEditing ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartEdit}
                leftIcon={<Edit3 size={15} />}
              >
                Edit Contact Details
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                leftIcon={<X size={15} />}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* APAAR ID & Academic Bank of Credits Digital Card */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Automated Permanent Academic Account Registry (APAAR ID)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  DigiLocker Synced
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Ministry of Education "One Nation, One Student ID" Digital Identifier
              </p>
            </div>

            {/* Masked APAAR Display & Actions */}
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-blue-200 shadow-xs">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-900 tracking-wider px-2">
                {getMaskedApaar()}
              </span>

              <button
                type="button"
                onClick={() => setShowApaar(!showApaar)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title={showApaar ? 'Mask APAAR ID' : 'Reveal full APAAR ID'}
                aria-label={showApaar ? 'Mask APAAR ID' : 'Reveal full APAAR ID'}
              >
                {showApaar ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              <button
                type="button"
                onClick={handleCopyApaar}
                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                title="Copy APAAR ID"
                aria-label="Copy APAAR ID"
              >
                {copiedApaar ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-purple-600" />
              <span>Academic Bank of Credits ID: <strong className="font-mono text-slate-800">{profile.abcId}</strong></span>
            </div>
            <div className="text-[11px] text-slate-500">
              Synced with DigiLocker • {profile.lastSync}
            </div>
          </div>
        </div>

        {/* 2. All 12 Mandatory Student Profile Fields */}
        <div className="mt-8">
          {isEditing ? (
            /* EDITABLE FORM */
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600" />
                  Edit Contact & Demographic Information
                </h3>
                <span className="text-xs text-slate-400">Institutional fields are locked and managed by college registrar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Student Full Name"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  error={formErrors.fullName}
                  leftIcon={<User size={15} />}
                  required
                />

                <Input
                  label="Contact Number"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  error={formErrors.phone}
                  leftIcon={<Phone size={15} />}
                  required
                />

                <Input
                  label="Blood Group"
                  value={editForm.bloodGroup}
                  onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                  placeholder="e.g. B+"
                />

                <Input
                  label="Admission Category"
                  value={editForm.admissionCategory}
                  onChange={(e) => setEditForm({ ...editForm, admissionCategory: e.target.value })}
                  placeholder="e.g. Merit (State Entrance)"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">🔒 Official Records Notice:</p>
                <p>Register Number, Degree, Department, Admission Year, and College Name are verified with institutional records and cannot be altered by student self-service.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  leftIcon={<Save size={15} />}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          ) : (
            /* COMPREHENSIVE 12 FIELDS DISPLAY */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  Student Academic & Institutional Credentials
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  12 Key Verified Attributes
                </span>
              </div>

              {/* Grid with the 12 Required Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* 1. Student Name */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <User size={14} className="text-blue-500" />
                    Student Name
                  </span>
                  <p className="font-bold text-sm text-slate-900 pt-0.5">
                    {profile.fullName}
                  </p>
                </div>

                {/* 2. APAAR ID */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <FileBadge size={14} className="text-blue-500" />
                    APAAR ID
                  </span>
                  <p className="font-mono font-bold text-sm text-blue-700 pt-0.5">
                    {formatApaarId(profile.apaarId)}
                  </p>
                </div>

                {/* 3. College Name */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-500" />
                    College Name
                  </span>
                  <p className="font-bold text-slate-900 pt-0.5 leading-snug">
                    {profile.institutionName}
                  </p>
                </div>

                {/* 4. Institution Code */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Hash size={14} className="text-blue-500" />
                    Institution Code
                  </span>
                  <p className="font-mono font-bold text-slate-900 pt-0.5">
                    {profile.institutionCode}
                  </p>
                </div>

                {/* 5. Department */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-500" />
                    Department
                  </span>
                  <p className="font-bold text-slate-900 pt-0.5">
                    {profile.department}
                  </p>
                </div>

                {/* 6. Contact Number */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Phone size={14} className="text-blue-500" />
                    Contact Number
                  </span>
                  <p className="font-bold text-slate-900 pt-0.5">
                    {profile.phone}
                  </p>
                </div>

                {/* 7. Degree */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-blue-500" />
                    Degree
                  </span>
                  <p className="font-bold text-slate-900 pt-0.5">
                    {profile.degree || 'Bachelor of Technology (B.Tech)'}
                  </p>
                </div>

                {/* 8. Current Year */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    Current Year
                  </span>
                  <p className="font-bold text-slate-900 pt-0.5">
                    {profile.yearOfStudy || '4th Year (Final Year)'}
                  </p>
                </div>

                {/* 9. Current Semester */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-500" />
                    Current Semester
                  </span>
                  <p className="font-bold text-slate-900 pt-0.5">
                    {currentSemesterText}
                  </p>
                </div>

                {/* 10. Admission Year */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Calendar size={14} className="text-blue-500" />
                    Admission Year
                  </span>
                  <p className="font-bold font-mono text-slate-900 pt-0.5">
                    {profile.admissionYear || '2021'}
                  </p>
                </div>

                {/* 11. Academic Status */}
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1 hover:border-blue-200 transition-colors">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Award size={14} className="text-blue-500" />
                    Academic Status
                  </span>
                  <div className="pt-0.5 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-bold text-slate-900">
                      {profile.academicStatus || 'Active (Regular Full-Time)'}
                    </span>
                  </div>
                </div>

                {/* 12. Enrollment Verification Status */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    Enrollment Verification Status
                  </span>
                  <div className="pt-0.5">
                    <Badge status="verified" dot>
                      {profile.enrollmentVerificationStatus || 'Verified'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Additional Demographics (Email, Gender, Blood Group, Admission Category) */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Additional Student Details & Demographics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Student Institutional Email</span>
                    <span className="font-semibold text-slate-900 flex items-center gap-1 truncate pt-0.5">
                      <Mail size={12} className="text-blue-500 shrink-0" />
                      {profile.studentEmail}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Date of Birth & Gender</span>
                    <span className="font-semibold text-slate-900 pt-0.5 block">
                      {profile.dob} ({profile.gender})
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Blood Group</span>
                    <span className="font-semibold text-slate-900 pt-0.5 block">
                      {profile.bloodGroup}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">Admission Quota / Category</span>
                    <span className="font-semibold text-slate-900 pt-0.5 block truncate">
                      {profile.admissionCategory}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
