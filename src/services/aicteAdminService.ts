/**
 * APAAR CONNECT AI — AICTE Central Administration Service
 * National higher education regulatory portal for AICTE administrators.
 * Manages institutional student enrolments, cross-institution duplicate detection,
 * data validation workflows, approved intake compliance, and reporting.
 */

export type AICTESubmissionStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Submitted'
  | 'Validation Failed'
  | 'Correction Required'
  | 'Completed'

export type AICTEValidationStatus =
  | 'Validated'
  | 'Pending Review'
  | 'Correction Required'
  | 'Potential Duplicate'
  | 'Invalid or Incomplete'
  | 'Resolved'

export interface AICTEValidationIssue {
  code:
    | 'missing_apaar'
    | 'invalid_apaar_format'
    | 'repeated_apaar'
    | 'cross_institution_duplicate'
    | 'missing_mandatory'
    | 'inconsistent_info'
    | 'intake_exceeded'
    | 'awaiting_correction'
  severity: 'critical' | 'high' | 'medium' | 'info'
  message: string
}

export interface AICTECourseIntake {
  course: string
  department: string
  approvedIntake: number
  reportedAdmissions: number
}

export interface AICTEInstitutionRecord {
  id: string
  aicteCode: string
  name: string
  state: string
  district: string
  city: string
  type: 'Government' | 'Autonomous' | 'Govt-Aided' | 'Private'
  registrarName: string
  registrarEmail: string
  phone: string
  approvedCourses: AICTECourseIntake[]
  totalApprovedIntake: number
  totalReportedEnrolment: number
  latestSubmissionDate: string
  submissionStatus: AICTESubmissionStatus
  unresolvedIssuesCount: number
  naacAccreditation: string
  complianceScore: number
  submissionHistory: {
    batchId: string
    submittedAt: string
    academicYear: string
    recordCount: number
    status: AICTESubmissionStatus
    note?: string
  }[]
  correctionRequests: {
    id: string
    requestedAt: string
    issue: string
    status: 'open' | 'addressed'
  }[]
}

export interface AICTEStudentRecord {
  id: string
  studentName: string
  apaarId: string
  registerNumber: string
  institutionName: string
  institutionId: string
  course: string
  department: string
  academicYear: string
  semester: string
  admissionCategory: 'General' | 'Management Quota' | 'Lateral Entry' | 'EWS' | 'Sports Quota' | 'State Govt Quota' | 'OBC' | 'SC/ST'
  submissionDate: string
  validationStatus: AICTEValidationStatus
  issues: AICTEValidationIssue[]
  dob?: string
  gender?: string
  cgpa?: number
  duplicateMatchInstitution?: string
  duplicateMatchRegisterNo?: string
  reviewNotes: {
    id: string
    author: string
    note: string
    timestamp: string
    action: string
  }[]
  history: {
    at: string
    by: string
    action: string
    notes?: string
  }[]
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL MOCK DATA: INSTITUTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_AICTE_INSTITUTIONS: AICTEInstitutionRecord[] = []

export const INITIAL_AICTE_STUDENTS: AICTEStudentRecord[] = []

// STATE REPOSITORY (IN-MEMORY PERSISTENCE VIA LOCALSTORAGE)
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY_INSTITUTIONS = 'apaar_aicte_institutions_v1'
const STORAGE_KEY_STUDENTS = 'apaar_aicte_students_v1'

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore
  }
}

let _institutions: AICTEInstitutionRecord[] = loadFromStorage(STORAGE_KEY_INSTITUTIONS, INITIAL_AICTE_INSTITUTIONS).filter((i: any) => !i.id?.startsWith('INST-00'))
let _students: AICTEStudentRecord[] = loadFromStorage(STORAGE_KEY_STUDENTS, INITIAL_AICTE_STUDENTS).filter((s: any) => !s.id?.startsWith('ASTU-'))

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const aicteAdminService = {
  setInstitutionsFromDb(institutions: AICTEInstitutionRecord[]): void {
    _institutions = institutions
    saveToStorage(STORAGE_KEY_INSTITUTIONS, _institutions)
  },

  setStudentsFromDb(students: AICTEStudentRecord[]): void {
    _students = students
    saveToStorage(STORAGE_KEY_STUDENTS, _students)
  },

  getInstitutions(): AICTEInstitutionRecord[] {
    return [..._institutions]
  },

  getStudents(): AICTEStudentRecord[] {
    return [..._students]
  },

  getStudentById(id: string): AICTEStudentRecord | undefined {
    return _students.find((s) => s.id === id)
  },

  getInstitutionById(id: string): AICTEInstitutionRecord | undefined {
    return _institutions.find((i) => i.id === id || i.aicteCode === id)
  },

  /**
   * Review student record workflow
   */
  reviewStudentRecord(
    recordId: string,
    action: 'resolve' | 'require_correction' | 'flag_duplicate' | 'mark_pending',
    note: string,
    author = 'AICTE Administrator'
  ): AICTEStudentRecord {
    const idx = _students.findIndex((s) => s.id === recordId)
    if (idx === -1) throw new Error('Student record not found')

    const student = _students[idx]
    const now = new Date().toISOString()
    let newStatus: AICTEValidationStatus = student.validationStatus

    if (action === 'resolve') {
      newStatus = 'Resolved'
    } else if (action === 'require_correction') {
      newStatus = 'Correction Required'
    } else if (action === 'flag_duplicate') {
      newStatus = 'Potential Duplicate'
    } else if (action === 'mark_pending') {
      newStatus = 'Pending Review'
    }

    const reviewEntry = {
      id: `RN-${Date.now()}`,
      author,
      note,
      timestamp: now,
      action: action.replace('_', ' ').toUpperCase(),
    }

    const historyEntry = {
      at: now,
      by: author,
      action: `Status modified to ${newStatus}`,
      notes: note,
    }

    const updated: AICTEStudentRecord = {
      ...student,
      validationStatus: newStatus,
      reviewNotes: [reviewEntry, ...student.reviewNotes],
      history: [historyEntry, ...student.history],
      issues: action === 'resolve' ? [] : student.issues,
    }

    _students[idx] = updated
    saveToStorage(STORAGE_KEY_STUDENTS, _students)

    // Notify listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apaar:aicte-record-reviewed', { detail: updated }))
    }

    return updated
  },

  /**
   * Update institution submission status
   */
  updateInstitutionStatus(
    institutionId: string,
    newStatus: AICTESubmissionStatus,
    note?: string,
    author = 'AICTE Administrator'
  ): AICTEInstitutionRecord {
    const idx = _institutions.findIndex((i) => i.id === institutionId || i.aicteCode === institutionId)
    if (idx === -1) throw new Error('Institution not found')

    const inst = _institutions[idx]
    const now = new Date().toISOString().split('T')[0]

    const updatedHistory = [
      {
        batchId: `BATCH-AUDIT-${Date.now().toString().slice(-4)}`,
        submittedAt: now,
        academicYear: '2024-2025',
        recordCount: inst.totalReportedEnrolment,
        status: newStatus,
        note: note || `Submission status updated to ${newStatus} by ${author}.`,
      },
      ...inst.submissionHistory,
    ]

    const updated: AICTEInstitutionRecord = {
      ...inst,
      submissionStatus: newStatus,
      submissionHistory: updatedHistory,
      unresolvedIssuesCount: newStatus === 'Completed' ? 0 : inst.unresolvedIssuesCount,
    }

    _institutions[idx] = updated
    saveToStorage(STORAGE_KEY_INSTITUTIONS, _institutions)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apaar:aicte-institution-updated', { detail: updated }))
    }

    return updated
  },

  /**
   * Issue correction request to institution
   */
  issueCorrectionRequest(
    institutionId: string,
    issueText: string
  ): AICTEInstitutionRecord {
    const idx = _institutions.findIndex((i) => i.id === institutionId || i.aicteCode === institutionId)
    if (idx === -1) throw new Error('Institution not found')

    const inst = _institutions[idx]
    const newRequest = {
      id: `CR-${Date.now().toString().slice(-4)}`,
      requestedAt: new Date().toISOString().split('T')[0],
      issue: issueText,
      status: 'open' as const,
    }

    const updated: AICTEInstitutionRecord = {
      ...inst,
      submissionStatus: 'Correction Required',
      correctionRequests: [newRequest, ...inst.correctionRequests],
      unresolvedIssuesCount: inst.unresolvedIssuesCount + 1,
    }

    _institutions[idx] = updated
    saveToStorage(STORAGE_KEY_INSTITUTIONS, _institutions)

    return updated
  },

  /**
   * Compute dynamic dashboard metrics
   */
  getDashboardMetrics(filters?: {
    academicYear?: string
    state?: string
    institution?: string
    course?: string
    department?: string
  }) {
    let insts = [..._institutions]
    let studs = [..._students]

    if (filters?.state && filters.state !== 'all') {
      insts = insts.filter((i) => i.state === filters.state)
      studs = studs.filter((s) => {
        const inst = _institutions.find((i) => i.name === s.institutionName)
        return inst?.state === filters.state
      })
    }

    if (filters?.institution && filters.institution !== 'all') {
      insts = insts.filter((i) => i.name === filters.institution || i.aicteCode === filters.institution)
      studs = studs.filter((s) => s.institutionName === filters.institution || s.institutionId === filters.institution)
    }

    if (filters?.academicYear && filters.academicYear !== 'all') {
      studs = studs.filter((s) => s.academicYear === filters.academicYear)
    }

    if (filters?.course && filters.course !== 'all') {
      studs = studs.filter((s) => s.course === filters.course)
    }

    if (filters?.department && filters.department !== 'all') {
      studs = studs.filter((s) => s.department === filters.department)
    }

    // Calculations
    const totalInstitutions = insts.length
    const totalEnrolments = insts.reduce((sum, i) => sum + i.totalReportedEnrolment, 0)
    const totalApprovedIntake = insts.reduce((sum, i) => sum + i.totalApprovedIntake, 0)
    const recordsRequiringReview = studs.filter(
      (s) => s.validationStatus === 'Pending Review' || s.validationStatus === 'Correction Required'
    ).length
    const institutionsWithPending = insts.filter(
      (i) => i.submissionStatus === 'In Progress' || i.submissionStatus === 'Submitted' || i.submissionStatus === 'Correction Required'
    ).length
    const potentialDuplicates = studs.filter(
      (s) => s.validationStatus === 'Potential Duplicate' || s.issues.some((iss) => iss.code === 'cross_institution_duplicate' || iss.code === 'repeated_apaar')
    ).length

    // State Visualisation
    const stateMap = new Map<string, { enrolled: number; intake: number; institutions: number }>()
    for (const inst of insts) {
      const cur = stateMap.get(inst.state) || { enrolled: 0, intake: 0, institutions: 0 }
      stateMap.set(inst.state, {
        enrolled: cur.enrolled + inst.totalReportedEnrolment,
        intake: cur.intake + inst.totalApprovedIntake,
        institutions: cur.institutions + 1,
      })
    }
    const enrolmentByState = Array.from(stateMap.entries()).map(([state, data]) => ({
      state,
      ...data,
    })).sort((a, b) => b.enrolled - a.enrolled)

    // Institution Visualisation
    const enrolmentByInstitution = insts.map((i) => ({
      institutionName: i.name,
      aicteCode: i.aicteCode,
      state: i.state,
      enrolled: i.totalReportedEnrolment,
      intake: i.totalApprovedIntake,
      status: i.submissionStatus,
      difference: i.totalReportedEnrolment - i.totalApprovedIntake,
      isExceeded: i.totalReportedEnrolment > i.totalApprovedIntake,
    })).sort((a, b) => b.enrolled - a.enrolled)

    // Course and Department Enrolment
    const deptMap = new Map<string, { course: string; department: string; enrolled: number; intake: number }>()
    for (const inst of insts) {
      for (const c of inst.approvedCourses) {
        if (filters?.course && filters.course !== 'all' && c.course !== filters.course) continue
        if (filters?.department && filters.department !== 'all' && c.department !== filters.department) continue

        const key = `${c.course} - ${c.department}`
        const cur = deptMap.get(key) || { course: c.course, department: c.department, enrolled: 0, intake: 0 }
        deptMap.set(key, {
          course: c.course,
          department: c.department,
          enrolled: cur.enrolled + c.reportedAdmissions,
          intake: cur.intake + c.approvedIntake,
        })
      }
    }
    const courseAndDeptEnrolment = Array.from(deptMap.values()).sort((a, b) => b.enrolled - a.enrolled)

    // Intake vs Reported Admissions Discrepancies
    const intakeVsAdmissions = []
    for (const inst of insts) {
      for (const c of inst.approvedCourses) {
        intakeVsAdmissions.push({
          institutionName: inst.name,
          aicteCode: inst.aicteCode,
          course: c.course,
          department: c.department,
          approvedIntake: c.approvedIntake,
          reportedAdmissions: c.reportedAdmissions,
          difference: c.reportedAdmissions - c.approvedIntake,
          isExceeded: c.reportedAdmissions > c.approvedIntake,
        })
      }
    }

    // Academic Year Trends
    const academicYearTrends = [
      { academicYear: '2022-2023', enrolments: 2450, intake: 2600, verified: 2410, duplicates: 3 },
      { academicYear: '2023-2024', enrolments: 2680, intake: 2750, verified: 2630, duplicates: 5 },
      { academicYear: '2024-2025', enrolments: totalEnrolments, intake: totalApprovedIntake, verified: Math.round(totalEnrolments * 0.88), duplicates: potentialDuplicates },
    ]

    return {
      totalInstitutions,
      totalEnrolments,
      totalApprovedIntake,
      recordsRequiringReview,
      institutionsWithPending,
      potentialDuplicates,
      enrolmentByState,
      enrolmentByInstitution,
      courseAndDeptEnrolment,
      intakeVsAdmissions,
      academicYearTrends,
    }
  },

  /**
   * Reset store to initial seed
   */
  resetToInitial() {
    _institutions = [...INITIAL_AICTE_INSTITUTIONS]
    _students = [...INITIAL_AICTE_STUDENTS]
    saveToStorage(STORAGE_KEY_INSTITUTIONS, _institutions)
    saveToStorage(STORAGE_KEY_STUDENTS, _students)
  },
}
