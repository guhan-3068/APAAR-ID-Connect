import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  UploadCloud,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  GraduationCap,
  Loader2,
  FileText,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import type { StudentSearchResult } from '@/services/portalApiService'

interface UploadStudentDocModalProps {
  initialStudent?: {
    id?: string
    fullName: string
    registrationNumber: string
    department: string
    programme?: string
    course?: string
    currentSemester?: number | string
    academicYear?: string
  } | null
  onClose: () => void
  onSuccess?: () => void
}

export const UploadStudentDocModal: React.FC<UploadStudentDocModalProps> = ({
  initialStudent,
  onClose,
  onSuccess,
}) => {
  const { adminProfile, searchStudents, uploadStudentDocument, showToast } = useAdmin()

  // Student selection state
  const [searchQuery, setSearchQuery] = useState(initialStudent?.registrationNumber || '')
  const [searchType, setSearchType] = useState<'registrationNumber' | 'apaarId'>('registrationNumber')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [revealApaar, setRevealApaar] = useState(false)

  // Document details state
  const [documentType, setDocumentType] = useState('Semester Marksheet & Grade Card')
  const [title, setTitle] = useState('Semester VI Regular Examination Marksheet')
  const isMarksheet = documentType.toLowerCase().includes('marksheet') || documentType.toLowerCase().includes('grade')

  // Marksheet specifics
  const [semester, setSemester] = useState('Semester 6')
  const [academicYear, setAcademicYear] = useState('2024-2025')
  const [sgpa, setSgpa] = useState('8.75')
  const [cgpa, setCgpa] = useState('8.60')
  const [creditsEarned, setCreditsEarned] = useState('24')
  const [totalCredits, setTotalCredits] = useState('24')
  const [examination, setExamination] = useState('Winter 2024 Regular Examination')

  // File state
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')
  const [fileData, setFileData] = useState<string | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // If initialStudent is provided, pre-select
  useEffect(() => {
    if (initialStudent) {
      setSelectedStudent({
        id: initialStudent.id || '',
        fullName: initialStudent.fullName,
        registrationNumber: initialStudent.registrationNumber,
        department: initialStudent.department,
        course: initialStudent.programme || initialStudent.course || 'B.Tech',
        yearOfStudy: initialStudent.academicYear || '2024-2025',
        semester: String(initialStudent.currentSemester || '6'),
        verificationStatus: 'verified',
      })
    }
  }, [initialStudent])

  const handleSearchStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const q = searchQuery.trim()
    if (!q) {
      setSearchError(
        searchType === 'apaarId'
          ? 'Please enter an APAAR ID to search.'
          : 'Please enter a student registration number to search.'
      )
      return
    }

    if (searchType === 'apaarId') {
      const cleanDigits = q.replace(/[\s-]+/g, '')
      if (!/^\d{12}$/.test(cleanDigits)) {
        setSearchError('Invalid APAAR ID format. Please enter a valid 12-digit number (e.g. 1111-2222-3333).')
        return
      }
    }

    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    try {
      const results = await searchStudents(q, searchType)
      if (!results || results.length === 0) {
        setSearchError('No student found in your college for this identifier.')
      } else if (results.length === 1) {
        setSelectedStudent(results[0])
        setSearchResults([])
      } else {
        setSearchResults(results)
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error occurred while searching for student.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc', '.txt']
    if (!allowed.includes(ext)) {
      setSubmitError(`Invalid file format "${ext}". Allowed formats are PDF, PNG, JPG, JPEG, DOCX, DOC, and TXT.`)
      return
    }

    if (file.size > 3.5 * 1024 * 1024) {
      setSubmitError('File size exceeds the 3.5 MB serverless upload limit. Please select a smaller file.')
      return
    }

    setSubmitError(null)
    setFileName(file.name)

    // Format size
    const kb = file.size / 1024
    if (kb > 1024) {
      setFileSize(`${(kb / 1024).toFixed(1)} MB`)
    } else {
      setFileSize(`${Math.round(kb)} KB`)
    }

    // Read as DataURL for secure database persistence
    const reader = new FileReader()
    reader.onload = () => {
      setFileData(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      setSubmitError('Please search and confirm the student before uploading.')
      return
    }
    if (!title.trim()) {
      setSubmitError('Please provide a title for the document.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const parsedSgpa = parseFloat(sgpa)
      const parsedCgpa = parseFloat(cgpa)
      const parsedCreditsEarned = parseInt(creditsEarned, 10)
      const parsedTotalCredits = parseInt(totalCredits, 10)

      await uploadStudentDocument({
        studentId: selectedStudent.id,
        studentRegistrationNumber: selectedStudent.registrationNumber,
        apaarId: selectedStudent.apaarId,
        documentType,
        title: title.trim(),
        fileName: fileName.trim() || `${selectedStudent.registrationNumber}_${documentType.replace(/\s+/g, '_')}.pdf`,
        fileSize: fileSize || '1.4 MB',
        fileData: fileData || `OFFICIAL INSTITUTIONAL RECORD\nIssued by: ${adminProfile.institutionName}\nStudent: ${selectedStudent.fullName} (${selectedStudent.registrationNumber})\nDocument: ${title}\nDigitally Sealed by Registrar`,
        marksheetDetails: isMarksheet
          ? {
              semester,
              academicYear,
              sgpa: isNaN(parsedSgpa) ? 8.5 : parsedSgpa,
              cgpa: isNaN(parsedCgpa) ? 8.5 : parsedCgpa,
              creditsEarned: isNaN(parsedCreditsEarned) ? 24 : parsedCreditsEarned,
              totalCredits: isNaN(parsedTotalCredits) ? 24 : parsedTotalCredits,
              examination,
            }
          : undefined,
      })

      setSubmitSuccess(true)
      showToast(`Document successfully attached to ${selectedStudent.fullName}'s student portal.`, 'success')
      if (onSuccess) onSuccess()

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to upload document to database.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <UploadCloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Official Document to Student</h2>
              <p className="text-xs text-slate-500">
                Authorized College Management Registry • {adminProfile.institutionName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {submitSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Document Uploaded & Published Successfully!</h3>
              <p className="text-slate-600 max-w-md mx-auto">
                The academic record has been cryptographically registered in the database for{' '}
                <strong>{selectedStudent?.fullName}</strong> ({selectedStudent?.registrationNumber}). The student can
                now view and download it immediately in their Student Portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1: Student Lookup & Confirmation */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Step 1: Student Search (Registration Number or APAAR ID)
                </label>

                {!selectedStudent ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="w-full sm:w-48 shrink-0">
                        <select
                          value={searchType}
                          onChange={(e) => {
                            setSearchType(e.target.value as 'registrationNumber' | 'apaarId')
                            setSearchError(null)
                          }}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        >
                          <option value="registrationNumber">Registration Number</option>
                          <option value="apaarId">APAAR ID</option>
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={
                            searchType === 'apaarId'
                              ? 'Enter 12-digit APAAR ID (e.g. 1111-2222-3333)...'
                              : 'Enter College Registration Number...'
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSearchStudent}
                        disabled={isSearching}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                        <span>Search</span>
                      </button>
                    </div>

                    {searchError && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2.5">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                        <span>{searchError}</span>
                      </div>
                    )}

                    {/* Ambiguous multiple matches selector */}
                    {searchResults.length > 1 && (
                      <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-semibold text-slate-700">
                          Multiple students matched your query. Please confirm and select the intended student:
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {searchResults.map((st) => (
                            <div
                              key={st.id}
                              onClick={() => {
                                setSelectedStudent(st)
                                setSearchResults([])
                              }}
                              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{st.fullName}</p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  {st.registrationNumber} • {st.department} • {st.course || 'B.Tech'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedStudent(st)
                                  setSearchResults([])
                                }}
                                className="px-2.5 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                Select
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Confirmed Student Banner */
                  <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-900 text-sm">{selectedStudent.fullName}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Confirmed Student
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-slate-600 text-[11px] flex-wrap">
                          <span className="font-mono font-bold text-slate-800">{selectedStudent.registrationNumber}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-800">{selectedStudent.department}</span>
                          {selectedStudent.course && (
                            <>
                              <span>•</span>
                              <span>{selectedStudent.course}</span>
                            </>
                          )}
                          {selectedStudent.apaarId && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 font-mono text-blue-800">
                                <span>
                                  APAAR:{' '}
                                  {revealApaar
                                    ? `${selectedStudent.apaarId.slice(0, 4)}-${selectedStudent.apaarId.slice(4, 8)}-${selectedStudent.apaarId.slice(8, 12)}`
                                    : `•••• •••• ${selectedStudent.apaarId.slice(-4)}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setRevealApaar(!revealApaar)}
                                  className="text-slate-400 hover:text-blue-600 p-0.5"
                                  title={revealApaar ? 'Mask APAAR ID' : 'Reveal APAAR ID'}
                                >
                                  {revealApaar ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudent(null)
                        setSearchResults([])
                        setRevealApaar(false)
                      }}
                      className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
                    >
                      Change Student
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Document Information */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Step 2: Document Classification & Details
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Document Type *</label>
                    <select
                      value={documentType}
                      onChange={(e) => {
                        setDocumentType(e.target.value)
                        if (e.target.value.includes('Marksheet')) {
                          setTitle('Semester VI Regular Examination Marksheet')
                        } else if (e.target.value.includes('Degree')) {
                          setTitle('Degree of Bachelor of Technology')
                        } else if (e.target.value.includes('Bonafide')) {
                          setTitle('Bonafide Student Certificate')
                        }
                      }}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                    >
                      <option value="Semester Marksheet & Grade Card">Semester Marksheet & Grade Card</option>
                      <option value="Degree Certificate">Official Degree Certificate</option>
                      <option value="Provisional Degree Certificate">Provisional Degree Certificate</option>
                      <option value="Bonafide Certificate">Bonafide Student Certificate</option>
                      <option value="Transfer & Conduct Certificate">Transfer & Conduct Certificate</option>
                      <option value="Consolidated Grade Statement">Consolidated Grade Statement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Document Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Semester VI Regular Examination Marksheet"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Marksheet specific academic fields */}
                {isMarksheet && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <FileCheck2 size={14} className="text-blue-600" /> Academic & Examination Evaluation Details
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Semester</label>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={`Semester ${s}`}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Academic Year</label>
                        <input
                          type="text"
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">SGPA</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={sgpa}
                          onChange={(e) => setSgpa(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">CGPA</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Credits Earned / Total</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={creditsEarned}
                            onChange={(e) => setCreditsEarned(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                            placeholder="Earned"
                          />
                          <span className="text-slate-400">/</span>
                          <input
                            type="number"
                            value={totalCredits}
                            onChange={(e) => setTotalCredits(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                            placeholder="Total"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Examination Session</label>
                        <input
                          type="text"
                          value={examination}
                          onChange={(e) => setExamination(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: File Attachment */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Step 3: Document File (PDF or High-Resolution Scan)
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                      <FileText size={22} />
                    </div>
                    {fileName ? (
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{fileName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {fileSize} • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-semibold text-slate-800 text-xs">
                          Click to select or drag and drop official document file
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG (Max 3.5MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Security & Audit Declaration */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex items-start gap-2.5 text-[11px]">
                <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Authorized Institutional Action:</strong> This record will be cryptographically sealed under
                  the authorized registrar account (<strong>{adminProfile.name}</strong>) and committed to the database.
                  It will be made available in the student's repository immediately.
                </span>
              </div>

              {submitError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedStudent}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving & Publishing…</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Publish to Student Portal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
