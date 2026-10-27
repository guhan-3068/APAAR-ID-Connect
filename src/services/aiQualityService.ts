/**
 * APAAR CONNECT AI — Stage 7 AI-Assisted Data Quality & Anomaly Detection Service
 *
 * NOTE: All assessment models are deterministic, explainable rule-based heuristics
 * and document extraction simulations. No black-box machine learning claims are made.
 */

import type {
  AdminStudentRecord,
  AdminAcademicRecord,
  QualityScoringBreakdown,
  AnomalyFlagItem,
  OcrExtractionRecord,
} from '@/types'
import { isValidApaarId } from '@/utils/formatters'

// ==========================================
// 1. Rule-Based Data Quality Scoring Engine
// ==========================================

export const calculateStudentQualityScore = (
  student: AdminStudentRecord,
  records: AdminAcademicRecord[] = []
): QualityScoringBreakdown => {
  let score = 100
  const deductions: QualityScoringBreakdown['deductions'] = []
  const recommendations: string[] = []

  // Rule Q-101: 12-digit APAAR Format Check
  if (!student.apaarId || !isValidApaarId(student.apaarId)) {
    score -= 25
    deductions.push({
      ruleId: 'Q-101',
      description: 'APAAR ID does not conform to the 12-digit national standard format.',
      pointsDeducted: 25,
      category: 'format',
    })
    recommendations.push('Re-verify 12-digit APAAR credential with UIDAI / DigiLocker gateway.')
  }

  // Rule Q-102: Academic Bank of Credits (ABC) Linkage
  if (!student.abcId || !student.abcId.startsWith('ABC-')) {
    score -= 15
    deductions.push({
      ruleId: 'Q-102',
      description: 'Academic Bank of Credits (ABC) identifier is missing or malformed.',
      pointsDeducted: 15,
      category: 'missing',
    })
    recommendations.push('Prompt student to link official ABC account from the student portal.')
  }

  // Rule Q-103: DigiLocker Depository Synchronization
  if (!student.digilockerSynced) {
    score -= 15
    deductions.push({
      ruleId: 'Q-103',
      description: 'Records are not cryptographically synced with the DigiLocker repository.',
      pointsDeducted: 15,
      category: 'missing',
    })
    recommendations.push('Initiate automated DigiLocker repository synchronization cycle.')
  }

  // Rule Q-104: Missing Profile Fields
  if (student.missingFields && student.missingFields.length > 0) {
    const penalty = Math.min(30, student.missingFields.length * 10)
    score -= penalty
    deductions.push({
      ruleId: 'Q-104',
      description: `Mandatory institutional data points missing: ${student.missingFields.join(', ')}.`,
      pointsDeducted: penalty,
      category: 'missing',
    })
    recommendations.push(`Collect required missing documents: ${student.missingFields.join(', ')}.`)
  }

  // Rule Q-105: CGPA Range Validation
  if (student.cgpa < 0 || student.cgpa > 10.0 || isNaN(student.cgpa)) {
    score -= 20
    deductions.push({
      ruleId: 'Q-105',
      description: 'Cumulative CGPA falls outside the valid 0.00 – 10.00 AICTE grading scale.',
      pointsDeducted: 20,
      category: 'consistency',
    })
    recommendations.push('Request examination department re-calculation of cumulative grade point average.')
  }

  // Rule Q-106: Academic Records Availability
  const matchingRecords = records.filter(
    (r) => r.studentId === student.id || r.registrationNumber === student.registrationNumber
  )
  if (matchingRecords.length === 0 && student.currentSemester > 1) {
    score -= 10
    deductions.push({
      ruleId: 'Q-106',
      description: 'Student is in Semester 2+ but has no uploaded semester examination marksheets.',
      pointsDeducted: 10,
      category: 'consistency',
    })
    recommendations.push('Ensure prior semester transcripts are registered in the academic repository.')
  }

  // Rule Q-107: Institutional Domain Match
  if (!student.email.endsWith('@students.niet.edu.in') && !student.email.endsWith('.edu.in')) {
    score -= 5
    deductions.push({
      ruleId: 'Q-107',
      description: 'Registered email does not match official institutional sub-domain.',
      pointsDeducted: 5,
      category: 'format',
    })
    recommendations.push('Update student email to official institutional domain for official alerts.')
  }

  // Final score clamping
  const finalScore = Math.max(0, Math.min(100, score))

  let grade: QualityScoringBreakdown['grade'] = 'Needs Attention'
  if (finalScore >= 90) grade = 'A+'
  else if (finalScore >= 80) grade = 'A'
  else if (finalScore >= 65) grade = 'B'
  else if (finalScore >= 50) grade = 'C'

  if (recommendations.length === 0) {
    recommendations.push('All demographic and academic integrity rules passed with 100% compliance.')
  }

  return {
    recordId: student.id,
    studentName: student.fullName,
    registrationNumber: student.registrationNumber,
    overallScore: finalScore,
    grade,
    deductions,
    recommendations,
    calculatedAt: new Date().toISOString(),
  }
}

// ==========================================
// 2. Explainable Anomaly Heuristics Data
// ==========================================

export const mockAnomalyFlags: AnomalyFlagItem[] = [
  {
    id: 'ANOM-001',
    affectedRecordId: 'STU-025',
    recordType: 'Student',
    title: 'Duplicate 12-Digit APAAR Identifier Collision',
    severity: 'critical',
    category: 'duplicate_identifier',
    explanation:
      'Identical 12-digit APAAR ID (234567890123) is registered under both Aarav Mehta (STU-001) and Aarav Mehta (STU-025). This violates the uniqueness constraint of the National Academic Account Registry.',
    recommendedReviewAction:
      'Contact the admissions department to verify original secondary school matriculation roll and merge duplicate profile entries.',
    status: 'flagged',
  },
  {
    id: 'ANOM-002',
    affectedRecordId: 'STU-026',
    recordType: 'Student',
    title: 'Conflicting Institutional Registration Number',
    severity: 'high',
    category: 'duplicate_identifier',
    explanation:
      'Registration number NIET-2022-EC-001 is assigned to two distinct student records (Rohit Nair and Rohit R. Nair). Two candidates cannot share an active institutional roll.',
    recommendedReviewAction:
      'Audit the physical admission register for academic year 2022–2026 to reconcile student identity documents.',
    status: 'flagged',
  },
  {
    id: 'ANOM-003',
    affectedRecordId: 'DOC-007',
    recordType: 'Document',
    title: 'Typography & Layout Inconsistency in Marksheet Header',
    severity: 'high',
    category: 'format_mismatch',
    explanation:
      'Heuristic image analysis detected a 3.4pt font size mismatch in the SGPA score line of the uploaded PDF compared to the certified institutional examination template. This is a heuristic data quality alert, not a conclusive determination of fraud.',
    recommendedReviewAction:
      'Request certified physical marksheet from Controller of Examinations for manual cross-verification.',
    status: 'under_review',
    reviewedBy: 'Dr. S. K. Kulkarni',
    reviewedAt: '2026-10-22',
    resolutionNotes: 'Awaiting certified hard copy from department.',
  },
  {
    id: 'ANOM-004',
    affectedRecordId: 'AR-004',
    recordType: 'Academic Record',
    title: 'Missing Mandatory Laboratory Component Grade',
    severity: 'medium',
    category: 'academic_discrepancy',
    explanation:
      'Semester 1 credits earned (22) do not match the expected curriculum total (24 credits). Analog Electronics Lab grade is omitted from the submission.',
    recommendedReviewAction:
      'Request laboratory in-charge to submit grade ledger and re-publish the semester transcript.',
    status: 'flagged',
  },
  {
    id: 'ANOM-005',
    affectedRecordId: 'STU-007',
    recordType: 'Student',
    title: 'Degree Programme Discrepancy Across Documents',
    severity: 'medium',
    category: 'academic_discrepancy',
    explanation:
      'Admissions record lists B.Tech in Information Technology, but uploaded migration certificate references Computer Science & Engineering.',
    recommendedReviewAction:
      'Cross-reference original seat allotment slip issued by the State CET Cell.',
    status: 'flagged',
  },
]

// ==========================================
// 3. OCR Document Data Extraction Prototype
// ==========================================

export const mockOcrSamples: OcrExtractionRecord[] = [
  {
    id: 'OCR-001',
    documentTitle: 'Semester 1 Official Grade Sheet',
    sampleFileName: 'NIET-2021-CS-001_Sem1_Official_GradeCard.pdf',
    documentType: 'Semester Marksheet',
    previewUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=60',
    humanConfirmed: true,
    status: 'confirmed_match',
    reviewedBy: 'Dr. S. K. Kulkarni',
    extractedFields: [
      { fieldName: 'Candidate Full Name', extractedValue: 'Aarav Mehta', studentRecordValue: 'Aarav Mehta', confidencePercent: 99.4, isMatch: true },
      { fieldName: 'Registration Roll No.', extractedValue: 'NIET-2021-CS-001', studentRecordValue: 'NIET-2021-CS-001', confidencePercent: 99.1, isMatch: true },
      { fieldName: 'Semester / Term', extractedValue: 'Semester 1', studentRecordValue: 'Semester 1', confidencePercent: 98.6, isMatch: true },
      { fieldName: 'Semester SGPA', extractedValue: '8.50', studentRecordValue: '8.50', confidencePercent: 97.8, isMatch: true },
      { fieldName: 'Total Credits Earned', extractedValue: '24', studentRecordValue: '24', confidencePercent: 98.9, isMatch: true },
      { fieldName: 'Issuing Authority', extractedValue: 'Controller of Examinations, NIET', studentRecordValue: 'Controller of Examinations, NIET', confidencePercent: 96.5, isMatch: true },
    ],
  },
  {
    id: 'OCR-002',
    documentTitle: 'Semester 1 Examination Transcript',
    sampleFileName: 'NIET-2022-EC-001_Sem1_Transcript_Scan.pdf',
    documentType: 'Semester Marksheet',
    previewUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=600&auto=format&fit=crop&q=60',
    humanConfirmed: false,
    status: 'discrepancy_flagged',
    extractedFields: [
      { fieldName: 'Candidate Full Name', extractedValue: 'Rohit Nair', studentRecordValue: 'Rohit Nair', confidencePercent: 98.2, isMatch: true },
      { fieldName: 'Registration Roll No.', extractedValue: 'NIET-2022-EC-001', studentRecordValue: 'NIET-2022-EC-001', confidencePercent: 99.0, isMatch: true },
      { fieldName: 'Semester / Term', extractedValue: 'Semester 1', studentRecordValue: 'Semester 1', confidencePercent: 97.5, isMatch: true },
      { fieldName: 'Semester SGPA', extractedValue: '7.80', studentRecordValue: '7.80', confidencePercent: 96.2, isMatch: true },
      { fieldName: 'Total Credits Earned', extractedValue: '22', studentRecordValue: '24', confidencePercent: 91.4, isMatch: false, humanOverride: '' },
      { fieldName: 'Lab Practical Grade', extractedValue: '[MISSING / UNREADABLE]', studentRecordValue: 'Analog Electronics Lab (Pending)', confidencePercent: 64.0, isMatch: false },
    ],
  },
  {
    id: 'OCR-003',
    documentTitle: 'Bachelor of Technology Degree Certificate',
    sampleFileName: 'NIET-2020-CS-003_Degree_Certificate.pdf',
    documentType: 'Degree Certificate',
    previewUrl: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=600&auto=format&fit=crop&q=60',
    humanConfirmed: true,
    status: 'confirmed_match',
    reviewedBy: 'Prof. M. R. Hegde',
    extractedFields: [
      { fieldName: 'Graduate Name', extractedValue: 'Vikram Joshi', studentRecordValue: 'Vikram Joshi', confidencePercent: 99.8, isMatch: true },
      { fieldName: 'Permanent Roll Number', extractedValue: 'NIET-2020-CS-003', studentRecordValue: 'NIET-2020-CS-003', confidencePercent: 99.4, isMatch: true },
      { fieldName: 'Conferred Programme', extractedValue: 'Bachelor of Technology (Computer Science & Engineering)', studentRecordValue: 'B.Tech — Computer Science & Engineering', confidencePercent: 96.7, isMatch: true },
      { fieldName: 'Final Cumulative CGPA', extractedValue: '8.30', studentRecordValue: '8.30', confidencePercent: 98.5, isMatch: true },
      { fieldName: 'Degree Classification', extractedValue: 'First Class with Distinction', studentRecordValue: 'First Class with Distinction', confidencePercent: 95.8, isMatch: true },
      { fieldName: 'Convocation Date', extractedValue: '15 June 2024', studentRecordValue: '2024-06-15', confidencePercent: 97.0, isMatch: true },
    ],
  },
]
