/**
 * APAAR CONNECT AI — Stage 8 Secure Verification & Controlled Record Sharing Service
 *
 * Implements DPDP Act (Digital Personal Data Protection) student consent workflows,
 * least-privilege credential disclosure, access token generation, and audit logging.
 */

import type { SharingConsentRequest, VerificationAuditTrailItem } from '@/types'

export const mockSharingConsentRequests: SharingConsentRequest[] = [
  {
    id: 'SHR-001',
    referenceCode: 'APAAR-SHR-2026-9021',
    studentId: 'STU-001',
    studentName: 'Aarav Mehta',
    apaarId: '234567890123',
    requesterName: 'Tata Consultancy Services — National Campus Hiring',
    requesterType: 'Employer',
    purpose: 'Pre-employment background credential check and academic tier verification.',
    requestedFields: ['Full Legal Name', 'Degree Conferred', 'Cumulative CGPA', 'DigiLocker Verification Hash'],
    status: 'pending_consent',
    requestedAt: '2026-10-21T10:15:00',
    expiresAt: '2026-11-04T23:59:59',
  },
  {
    id: 'SHR-002',
    referenceCode: 'APAAR-SHR-2026-8812',
    studentId: 'STU-001',
    studentName: 'Aarav Mehta',
    apaarId: '234567890123',
    requesterName: 'Indian Institute of Science (IISc Bengaluru) — M.Tech Admissions',
    requesterType: 'Higher Education',
    purpose: 'Postgraduate entrance qualification review and Academic Bank of Credits credit transfer.',
    requestedFields: ['All Semester Transcripts', 'Cumulative CGPA', 'Academic Bank of Credits ID', 'AICTE Institutional Accreditation'],
    status: 'approved',
    requestedAt: '2026-10-15T09:30:00',
    expiresAt: '2026-11-15T23:59:59',
    consentGivenAt: '2026-10-16T14:20:00',
    temporaryAccessToken: 'APAAR-TKN-7A2B-9F8C-44E1',
    verificationHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  },
  {
    id: 'SHR-003',
    referenceCode: 'APAAR-SHR-2026-7491',
    studentId: 'STU-001',
    studentName: 'Aarav Mehta',
    apaarId: '234567890123',
    requesterName: 'AICTE Pragati & Saksham National Scholarship Cell',
    requesterType: 'Government Agency',
    purpose: 'Merit-cum-means scholarship renewal eligibility check and semester fee disbursement verification.',
    requestedFields: ['Current Semester Status', 'Semester 1–6 SGPA', 'Attendance Certificate', 'DigiLocker APAAR Link'],
    status: 'approved',
    requestedAt: '2026-09-01T11:00:00',
    expiresAt: '2026-12-31T23:59:59',
    consentGivenAt: '2026-09-02T16:45:00',
    temporaryAccessToken: 'APAAR-TKN-3D4E-5F6A-7890',
    verificationHash: 'sha256:cbf529a4d5d4470bced7f122eb4e63469c37b4b5bff684ee322b004f34000a1e',
  },
  {
    id: 'SHR-004',
    referenceCode: 'APAAR-SHR-2026-6102',
    studentId: 'STU-001',
    studentName: 'Aarav Mehta',
    apaarId: '234567890123',
    requesterName: 'Fintech Credit Bureau (Student Educational Loan Processing)',
    requesterType: 'Financial/Scholarship',
    purpose: 'Education loan repayment schedule risk underwriting.',
    requestedFields: ['Permanent Address', 'Full Marksheet History', 'Guardian Aadhaar Linkage'],
    status: 'rejected',
    requestedAt: '2026-10-05T08:00:00',
    expiresAt: '2026-10-19T23:59:59',
  },
]

export const mockConsentAuditTrail: VerificationAuditTrailItem[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-10-16T14:20:00',
    eventType: 'consent_granted',
    actor: 'Aarav Mehta (Student)',
    details: 'Student granted controlled sharing consent to IISc Bengaluru for M.Tech Admissions. Token valid for 30 days.',
    ipSubnetHash: 'ip:157.48.***.***',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-10-16T15:02:11',
    eventType: 'credentials_accessed',
    actor: 'IISc Bengaluru Admissions Node',
    details: 'Authorized verifier accessed cumulative CGPA and semester transcripts using access token APAAR-TKN-7A2B-****.',
    ipSubnetHash: 'ip:14.139.***.***',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-10-06T11:15:30',
    eventType: 'consent_denied',
    actor: 'Aarav Mehta (Student)',
    details: 'Student denied consent to Fintech Credit Bureau. Requested data scope exceeded necessary academic verification.',
    ipSubnetHash: 'ip:157.48.***.***',
  },
  {
    id: 'AUD-004',
    timestamp: '2026-09-02T16:45:00',
    eventType: 'consent_granted',
    actor: 'Aarav Mehta (Student)',
    details: 'Student approved data release to AICTE National Scholarship Cell. Token valid through semester end.',
    ipSubnetHash: 'ip:157.48.***.***',
  },
]

/**
 * Deterministic helper to generate secure simulated verification tokens
 */
export const generateAccessToken = (refCode: string): { token: string; hash: string } => {
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const token = `APAAR-TKN-${refCode.slice(-4)}-${randomSuffix}`
  const hash = `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
  return { token, hash }
}
