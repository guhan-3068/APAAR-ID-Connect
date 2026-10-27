import type { StudentRecord, InstitutionProfile } from '@/types'

export const mockInstitution: InstitutionProfile = {
  id: 'inst-01',
  aicteCode: 'AICTE-1-4928172',
  name: 'National Institute of Engineering & Technology',
  state: 'Karnataka',
  district: 'Bengaluru Urban',
  type: 'Autonomous',
  totalStudentsEnrolled: 2840,
  verifiedApaarCount: 2618,
  pendingVerificationCount: 182,
}

export const mockStudents: StudentRecord[] = []
