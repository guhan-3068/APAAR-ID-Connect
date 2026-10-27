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

export const INITIAL_AICTE_INSTITUTIONS: AICTEInstitutionRecord[] = [
  {
    id: 'INST-001',
    aicteCode: 'AICTE-1-4928172',
    name: 'National Institute of Engineering & Technology',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Bengaluru',
    type: 'Autonomous',
    registrarName: 'Dr. S. K. Kulkarni',
    registrarEmail: 'registrar@niet.edu.in',
    phone: '+91-80-23456789',
    naacAccreditation: 'A++',
    complianceScore: 94,
    latestSubmissionDate: '2026-10-22',
    submissionStatus: 'Correction Required',
    unresolvedIssuesCount: 3,
    totalApprovedIntake: 420,
    totalReportedEnrolment: 445, // 25 students over intake in CSE!
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 120, reportedAdmissions: 145 },
      { course: 'B.Tech', department: 'AI & Data Science', approvedIntake: 60, reportedAdmissions: 58 },
      { course: 'B.Tech', department: 'Electronics & Communication', approvedIntake: 120, reportedAdmissions: 118 },
      { course: 'B.Tech', department: 'Information Technology', approvedIntake: 60, reportedAdmissions: 64 },
      { course: 'B.Tech', department: 'Mechanical Engineering', approvedIntake: 60, reportedAdmissions: 60 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-01', submittedAt: '2026-10-22', academicYear: '2024-2025', recordCount: 445, status: 'Correction Required', note: 'Reported admissions in CSE exceed sanctioned quota of 120.' },
      { batchId: 'BATCH-2025-02', submittedAt: '2025-10-15', academicYear: '2023-2024', recordCount: 412, status: 'Completed', note: 'Approved and sealed into NAD depository.' },
    ],
    correctionRequests: [
      { id: 'CR-001', requestedAt: '2026-10-23', issue: 'Clarify 25 excess admissions in Computer Science (Reported: 145, Approved: 120). Verify if Lateral Entry or Supernumerary quota applies.', status: 'open' },
    ],
  },
  {
    id: 'INST-002',
    aicteCode: 'AICTE-1-3829104',
    name: 'Maharashtra Institute of Technology & Research',
    state: 'Maharashtra',
    district: 'Pune',
    city: 'Pune',
    type: 'Private',
    registrarName: 'Prof. Anjali Ranade',
    registrarEmail: 'registrar@mitr.ac.in',
    phone: '+91-20-45678901',
    naacAccreditation: 'A+',
    complianceScore: 89,
    latestSubmissionDate: '2026-10-20',
    submissionStatus: 'Submitted',
    unresolvedIssuesCount: 2,
    totalApprovedIntake: 480,
    totalReportedEnrolment: 462,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 180, reportedAdmissions: 178 },
      { course: 'B.Tech', department: 'Information Technology', approvedIntake: 120, reportedAdmissions: 115 },
      { course: 'B.Tech', department: 'Electronics & Communication', approvedIntake: 120, reportedAdmissions: 112 },
      { course: 'B.Tech', department: 'Mechanical Engineering', approvedIntake: 60, reportedAdmissions: 57 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-03', submittedAt: '2026-10-20', academicYear: '2024-2025', recordCount: 462, status: 'Submitted', note: 'Awaiting regulatory data verification.' },
    ],
    correctionRequests: [
      { id: 'CR-002', requestedAt: '2026-10-21', issue: 'Potential dual-enrolment APAAR detected with NIET Bengaluru.', status: 'open' },
    ],
  },
  {
    id: 'INST-003',
    aicteCode: 'AICTE-1-7821903',
    name: 'Delhi State Technical University',
    state: 'Delhi',
    district: 'North Delhi',
    city: 'New Delhi',
    type: 'Government',
    registrarName: 'Dr. Rameshwar Varma',
    registrarEmail: 'registrar@dstu.delhi.gov.in',
    phone: '+91-11-27890123',
    naacAccreditation: 'A++',
    complianceScore: 98,
    latestSubmissionDate: '2026-10-24',
    submissionStatus: 'Completed',
    unresolvedIssuesCount: 0,
    totalApprovedIntake: 600,
    totalReportedEnrolment: 592,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 180, reportedAdmissions: 180 },
      { course: 'B.Tech', department: 'AI & Data Science', approvedIntake: 120, reportedAdmissions: 118 },
      { course: 'B.Tech', department: 'Electronics & Communication', approvedIntake: 120, reportedAdmissions: 119 },
      { course: 'B.Tech', department: 'Mechanical Engineering', approvedIntake: 120, reportedAdmissions: 115 },
      { course: 'M.Tech', department: 'Computer Science & Engineering', approvedIntake: 60, reportedAdmissions: 60 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-04', submittedAt: '2026-10-24', academicYear: '2024-2025', recordCount: 592, status: 'Completed', note: 'All records validated against NAD portal with zero discrepancies.' },
    ],
    correctionRequests: [],
  },
  {
    id: 'INST-004',
    aicteCode: 'AICTE-1-9081234',
    name: 'Tamil Nadu College of Advanced Technology',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    city: 'Coimbatore',
    type: 'Govt-Aided',
    registrarName: 'Dr. V. Sundaramurthy',
    registrarEmail: 'registrar@tncat.edu.in',
    phone: '+91-422-2678901',
    naacAccreditation: 'A',
    complianceScore: 78,
    latestSubmissionDate: '2026-10-18',
    submissionStatus: 'Validation Failed',
    unresolvedIssuesCount: 4,
    totalApprovedIntake: 360,
    totalReportedEnrolment: 340,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 120, reportedAdmissions: 118 },
      { course: 'B.Tech', department: 'Electronics & Communication', approvedIntake: 120, reportedAdmissions: 114 },
      { course: 'B.Tech', department: 'Mechanical Engineering', approvedIntake: 120, reportedAdmissions: 108 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-05', submittedAt: '2026-10-18', academicYear: '2024-2025', recordCount: 340, status: 'Validation Failed', note: 'Missing mandatory registration codes and invalid APAAR formats.' },
    ],
    correctionRequests: [
      { id: 'CR-003', requestedAt: '2026-10-19', issue: 'Multiple records missing 12-digit APAAR ID numbers. Re-upload with government IDs.', status: 'open' },
    ],
  },
  {
    id: 'INST-005',
    aicteCode: 'AICTE-1-5561289',
    name: 'Telangana Institute of Science & Cybernetics',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    type: 'Autonomous',
    registrarName: 'Prof. B. Chandrasekhar',
    registrarEmail: 'registrar@tisc.edu.in',
    phone: '+91-40-29876543',
    naacAccreditation: 'A+',
    complianceScore: 91,
    latestSubmissionDate: '2026-10-21',
    submissionStatus: 'In Progress',
    unresolvedIssuesCount: 1,
    totalApprovedIntake: 420,
    totalReportedEnrolment: 410,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 180, reportedAdmissions: 177 },
      { course: 'B.Tech', department: 'AI & Data Science', approvedIntake: 60, reportedAdmissions: 60 },
      { course: 'B.Tech', department: 'Information Technology', approvedIntake: 120, reportedAdmissions: 116 },
      { course: 'B.Tech', department: 'Electronics & Communication', approvedIntake: 60, reportedAdmissions: 57 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-06', submittedAt: '2026-10-21', academicYear: '2024-2025', recordCount: 410, status: 'In Progress', note: 'Partial batch upload completed. Additional departments pending.' },
    ],
    correctionRequests: [],
  },
  {
    id: 'INST-006',
    aicteCode: 'AICTE-1-1192834',
    name: 'Gujarat Apex Institute of Engineering',
    state: 'Gujarat',
    district: 'Ahmedabad',
    city: 'Ahmedabad',
    type: 'Private',
    registrarName: 'Dr. Paresh Shah',
    registrarEmail: 'registrar@gaie.ac.in',
    phone: '+91-79-28901234',
    naacAccreditation: 'B++',
    complianceScore: 68,
    latestSubmissionDate: '2026-10-12',
    submissionStatus: 'Not Started',
    unresolvedIssuesCount: 0,
    totalApprovedIntake: 300,
    totalReportedEnrolment: 0,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 120, reportedAdmissions: 0 },
      { course: 'B.Tech', department: 'Mechanical Engineering', approvedIntake: 120, reportedAdmissions: 0 },
      { course: 'B.Tech', department: 'Civil Engineering', approvedIntake: 60, reportedAdmissions: 0 },
    ],
    submissionHistory: [],
    correctionRequests: [],
  },
  {
    id: 'INST-007',
    aicteCode: 'AICTE-1-4478901',
    name: 'Kerala Technological Science Academy',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    city: 'Thiruvananthapuram',
    type: 'Government',
    registrarName: 'Dr. Mary Mathew',
    registrarEmail: 'registrar@ktsa.kerala.gov.in',
    phone: '+91-471-2567890',
    naacAccreditation: 'A++',
    complianceScore: 98,
    latestSubmissionDate: '2026-10-25',
    submissionStatus: 'Completed',
    unresolvedIssuesCount: 0,
    totalApprovedIntake: 360,
    totalReportedEnrolment: 355,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 120, reportedAdmissions: 120 },
      { course: 'B.Tech', department: 'Electronics & Communication', approvedIntake: 120, reportedAdmissions: 118 },
      { course: 'B.Tech', department: 'Information Technology', approvedIntake: 120, reportedAdmissions: 117 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-07', submittedAt: '2026-10-25', academicYear: '2024-2025', recordCount: 355, status: 'Completed', note: 'Full compliance verified.' },
    ],
    correctionRequests: [],
  },
  {
    id: 'INST-008',
    aicteCode: 'AICTE-1-2389012',
    name: 'Eastern Regional Institute of Technology',
    state: 'West Bengal',
    district: 'Kolkata',
    city: 'Kolkata',
    type: 'Govt-Aided',
    registrarName: 'Prof. Subir Roy',
    registrarEmail: 'registrar@erit.ac.in',
    phone: '+91-33-24567890',
    naacAccreditation: 'B',
    complianceScore: 54,
    latestSubmissionDate: '2026-10-10',
    submissionStatus: 'Correction Required',
    unresolvedIssuesCount: 3,
    totalApprovedIntake: 240,
    totalReportedEnrolment: 185,
    approvedCourses: [
      { course: 'B.Tech', department: 'Computer Science & Engineering', approvedIntake: 120, reportedAdmissions: 102 },
      { course: 'B.Tech', department: 'Mechanical Engineering', approvedIntake: 120, reportedAdmissions: 83 },
    ],
    submissionHistory: [
      { batchId: 'BATCH-2026-08', submittedAt: '2026-10-10', academicYear: '2024-2025', recordCount: 185, status: 'Correction Required', note: 'Multiple unverified APAAR identifiers.' },
    ],
    correctionRequests: [
      { id: 'CR-004', requestedAt: '2026-10-15', issue: 'Institutional credit sync failed. Provide updated semester marksheet transcripts.', status: 'open' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL MOCK DATA: STUDENT SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_AICTE_STUDENTS: AICTEStudentRecord[] = [
  {
    id: 'ASTU-101',
    studentName: 'Aarav Sharma',
    apaarId: '2104-2024-1234',
    registerNumber: '2021/CS/0841',
    institutionName: 'National Institute of Engineering & Technology',
    institutionId: 'AICTE-1-4928172',
    course: 'B.Tech',
    department: 'Computer Science & Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 7',
    admissionCategory: 'General',
    submissionDate: '2026-10-22',
    validationStatus: 'Potential Duplicate',
    dob: '2003-05-14',
    gender: 'Male',
    cgpa: 8.85,
    duplicateMatchInstitution: 'Maharashtra Institute of Technology & Research',
    duplicateMatchRegisterNo: 'MITR-2022-CSE-091',
    issues: [
      {
        code: 'cross_institution_duplicate',
        severity: 'critical',
        message: 'Active dual-enrolment suspected: Identical APAAR ID 2104-2024-1234 concurrently submitted by MITR Pune.',
      },
      {
        code: 'intake_exceeded',
        severity: 'high',
        message: 'Submitted under NIET Computer Science which has reported 145 admissions against approved intake of 120.',
      },
    ],
    reviewNotes: [
      {
        id: 'RN-1',
        author: 'AICTE Senior Inspector K. Verma',
        note: 'Cross-checked with Maharashtra state CET allocation list. Student transferred in 2023. Notice sent to MITR to cancel previous registration.',
        timestamp: '2026-10-23T11:40:00Z',
        action: 'Flagged for Institutional Clarification',
      },
    ],
    history: [
      { at: '2026-10-22T09:00:00Z', by: 'NIET Institutional Registrar', action: 'Uploaded in Batch 2026-01' },
      { at: '2026-10-23T11:40:00Z', by: 'AICTE Inspector', action: 'Flagged Potential Duplicate' },
    ],
  },
  {
    id: 'ASTU-102',
    studentName: 'Aarav Sharma',
    apaarId: '2104-2024-1234',
    registerNumber: 'MITR-2022-CSE-091',
    institutionName: 'Maharashtra Institute of Technology & Research',
    institutionId: 'AICTE-1-3829104',
    course: 'B.Tech',
    department: 'Computer Science & Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 5',
    admissionCategory: 'State Govt Quota',
    submissionDate: '2026-10-20',
    validationStatus: 'Potential Duplicate',
    dob: '2003-05-14',
    gender: 'Male',
    cgpa: 7.92,
    duplicateMatchInstitution: 'National Institute of Engineering & Technology',
    duplicateMatchRegisterNo: '2021/CS/0841',
    issues: [
      {
        code: 'cross_institution_duplicate',
        severity: 'critical',
        message: 'Active dual-enrolment suspected: Identical APAAR ID concurrently claimed by NIET Bengaluru.',
      },
    ],
    reviewNotes: [],
    history: [
      { at: '2026-10-20T14:15:00Z', by: 'MITR Registrar', action: 'Uploaded in Batch 2026-03' },
    ],
  },
  {
    id: 'ASTU-103',
    studentName: 'Priya Sundaram',
    apaarId: '3819-2023-8842',
    registerNumber: '2022/AI/0104',
    institutionName: 'National Institute of Engineering & Technology',
    institutionId: 'AICTE-1-4928172',
    course: 'B.Tech',
    department: 'AI & Data Science',
    academicYear: '2024-2025',
    semester: 'Semester 5',
    admissionCategory: 'General',
    submissionDate: '2026-10-22',
    validationStatus: 'Validated',
    dob: '2004-08-21',
    gender: 'Female',
    cgpa: 9.32,
    issues: [],
    reviewNotes: [],
    history: [
      { at: '2026-10-22T09:00:00Z', by: 'NIET Institutional Registrar', action: 'Validated and Approved' },
    ],
  },
  {
    id: 'ASTU-104',
    studentName: 'Rohan Verma',
    apaarId: '9821-2021-0021',
    registerNumber: '2022/ME/0199',
    institutionName: 'National Institute of Engineering & Technology',
    institutionId: 'AICTE-1-4928172',
    course: 'B.Tech',
    department: 'Mechanical Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 5',
    admissionCategory: 'EWS',
    submissionDate: '2026-10-22',
    validationStatus: 'Validated',
    dob: '2004-03-11',
    gender: 'Male',
    cgpa: 8.12,
    issues: [],
    reviewNotes: [],
    history: [
      { at: '2026-10-22T09:00:00Z', by: 'NIET Institutional Registrar', action: 'Validated' },
    ],
  },
  {
    id: 'ASTU-105',
    studentName: 'Kavita Pillai',
    apaarId: '', // MISSING APAAR ID
    registerNumber: 'TNCAT-2023-CSE-045',
    institutionName: 'Tamil Nadu College of Advanced Technology',
    institutionId: 'AICTE-1-9081234',
    course: 'B.Tech',
    department: 'Computer Science & Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 3',
    admissionCategory: 'Management Quota',
    submissionDate: '2026-10-18',
    validationStatus: 'Invalid or Incomplete',
    dob: '2005-01-19',
    gender: 'Female',
    cgpa: 7.45,
    issues: [
      {
        code: 'missing_apaar',
        severity: 'critical',
        message: 'Mandatory 12-digit APAAR ID has not been provided by the institution.',
      },
    ],
    reviewNotes: [
      {
        id: 'RN-2',
        author: 'AICTE Audit Desk',
        note: 'Institution notified that APAAR generation consent must be completed before statutory enrollment acceptance.',
        timestamp: '2026-10-20T10:00:00Z',
        action: 'Flagged for Resubmission',
      },
    ],
    history: [
      { at: '2026-10-18T16:00:00Z', by: 'TNCAT Registrar', action: 'Uploaded' },
    ],
  },
  {
    id: 'ASTU-106',
    studentName: 'Vikramaditya Rao',
    apaarId: '98421098', // INVALID FORMAT (only 8 digits)
    registerNumber: 'TNCAT-2023-ECE-112',
    institutionName: 'Tamil Nadu College of Advanced Technology',
    institutionId: 'AICTE-1-9081234',
    course: 'B.Tech',
    department: 'Electronics & Communication',
    academicYear: '2024-2025',
    semester: 'Semester 3',
    admissionCategory: 'State Govt Quota',
    submissionDate: '2026-10-18',
    validationStatus: 'Invalid or Incomplete',
    dob: '2005-06-30',
    gender: 'Male',
    cgpa: 6.95,
    issues: [
      {
        code: 'invalid_apaar_format',
        severity: 'critical',
        message: 'APAAR ID "98421098" has only 8 digits; valid APAAR IDs require exactly 12 numeric digits.',
      },
    ],
    reviewNotes: [],
    history: [
      { at: '2026-10-18T16:00:00Z', by: 'TNCAT Registrar', action: 'Uploaded' },
    ],
  },
  {
    id: 'ASTU-107',
    studentName: 'Ananya Deshmukh',
    apaarId: '7721-4402-9912',
    registerNumber: 'DSTU-2021-CSE-004',
    institutionName: 'Delhi State Technical University',
    institutionId: 'AICTE-1-7821903',
    course: 'B.Tech',
    department: 'Computer Science & Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 7',
    admissionCategory: 'General',
    submissionDate: '2026-10-24',
    validationStatus: 'Validated',
    dob: '2003-11-05',
    gender: 'Female',
    cgpa: 9.68,
    issues: [],
    reviewNotes: [],
    history: [
      { at: '2026-10-24T10:30:00Z', by: 'DSTU Registrar', action: 'Validated' },
    ],
  },
  {
    id: 'ASTU-108',
    studentName: 'Mohammed Zeeshan',
    apaarId: '5512-8890-3341',
    registerNumber: 'DSTU-2022-AIDS-018',
    institutionName: 'Delhi State Technical University',
    institutionId: 'AICTE-1-7821903',
    course: 'B.Tech',
    department: 'AI & Data Science',
    academicYear: '2024-2025',
    semester: 'Semester 5',
    admissionCategory: 'OBC',
    submissionDate: '2026-10-24',
    validationStatus: 'Validated',
    dob: '2004-09-17',
    gender: 'Male',
    cgpa: 8.74,
    issues: [],
    reviewNotes: [],
    history: [
      { at: '2026-10-24T10:30:00Z', by: 'DSTU Registrar', action: 'Validated' },
    ],
  },
  {
    id: 'ASTU-109',
    studentName: 'Divya Reddy',
    apaarId: '6610-3329-8810',
    registerNumber: 'TISC-2022-CSE-077',
    institutionName: 'Telangana Institute of Science & Cybernetics',
    institutionId: 'AICTE-1-5561289',
    course: 'B.Tech',
    department: 'Computer Science & Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 5',
    admissionCategory: 'General',
    submissionDate: '2026-10-21',
    validationStatus: 'Pending Review',
    dob: '2004-04-02',
    gender: 'Female',
    cgpa: 8.35,
    issues: [
      {
        code: 'inconsistent_info',
        severity: 'medium',
        message: 'Marksheet CGPA discrepancy: Cumulative CGPA 8.35 differs from ABC synchronized transcript score of 8.15.',
      },
    ],
    reviewNotes: [],
    history: [
      { at: '2026-10-21T12:00:00Z', by: 'TISC Registrar', action: 'Uploaded' },
    ],
  },
  {
    id: 'ASTU-110',
    studentName: 'Sunil Kumar',
    apaarId: '4490-2210-9988',
    registerNumber: 'KTSA-2021-ECE-031',
    institutionName: 'Kerala Technological Science Academy',
    institutionId: 'AICTE-1-4478901',
    course: 'B.Tech',
    department: 'Electronics & Communication',
    academicYear: '2024-2025',
    semester: 'Semester 7',
    admissionCategory: 'State Govt Quota',
    submissionDate: '2026-10-25',
    validationStatus: 'Validated',
    dob: '2003-12-14',
    gender: 'Male',
    cgpa: 8.91,
    issues: [],
    reviewNotes: [],
    history: [
      { at: '2026-10-25T11:00:00Z', by: 'KTSA Registrar', action: 'Validated' },
    ],
  },
  {
    id: 'ASTU-111',
    studentName: 'Tanvi Chatterjee',
    apaarId: '1109-8871-3324',
    registerNumber: 'ERIT-2022-CSE-012',
    institutionName: 'Eastern Regional Institute of Technology',
    institutionId: 'AICTE-1-2389012',
    course: 'B.Tech',
    department: 'Computer Science & Engineering',
    academicYear: '2024-2025',
    semester: 'Semester 5',
    admissionCategory: 'General',
    submissionDate: '2026-10-10',
    validationStatus: 'Correction Required',
    dob: '2004-07-28',
    gender: 'Female',
    cgpa: 7.18,
    issues: [
      {
        code: 'awaiting_correction',
        severity: 'high',
        message: 'Institution flagged for credit ledger verification failure. Awaiting resubmission of certified grade sheets.',
      },
    ],
    reviewNotes: [],
    history: [
      { at: '2026-10-10T15:30:00Z', by: 'ERIT Registrar', action: 'Uploaded' },
    ],
  },
  {
    id: 'ASTU-112',
    studentName: 'Sanjay Patel',
    apaarId: '5512-8890-3341', // DUPLICATE APAAR (Same as ASTU-108 Mohammed Zeeshan!)
    registerNumber: 'MITR-2023-IT-088',
    institutionName: 'Maharashtra Institute of Technology & Research',
    institutionId: 'AICTE-1-3829104',
    course: 'B.Tech',
    department: 'Information Technology',
    academicYear: '2024-2025',
    semester: 'Semester 3',
    admissionCategory: 'Management Quota',
    submissionDate: '2026-10-20',
    validationStatus: 'Potential Duplicate',
    dob: '2005-02-18',
    gender: 'Male',
    cgpa: 7.62,
    duplicateMatchInstitution: 'Delhi State Technical University',
    duplicateMatchRegisterNo: 'DSTU-2022-AIDS-018',
    issues: [
      {
        code: 'cross_institution_duplicate',
        severity: 'critical',
        message: 'Repeated APAAR ID across institutions: ID 5512-8890-3341 belongs to Mohammed Zeeshan (DSTU Delhi). Identity clash requires registrar scrutiny.',
      },
    ],
    reviewNotes: [
      {
        id: 'RN-3',
        author: 'AICTE Data Officer S. Gupta',
        note: 'Clerical data entry typo suspected in MITR submission. Requested original Aadhaar verification copy.',
        timestamp: '2026-10-21T15:00:00Z',
        action: 'Investigation Opened',
      },
    ],
    history: [
      { at: '2026-10-20T14:15:00Z', by: 'MITR Registrar', action: 'Uploaded' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
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

let _institutions: AICTEInstitutionRecord[] = loadFromStorage(STORAGE_KEY_INSTITUTIONS, INITIAL_AICTE_INSTITUTIONS)
let _students: AICTEStudentRecord[] = loadFromStorage(STORAGE_KEY_STUDENTS, INITIAL_AICTE_STUDENTS)

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const aicteAdminService = {
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
