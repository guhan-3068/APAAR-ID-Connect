import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import {
  mockMonitoringServices,
} from '@/services/platformMockData'
import {
  aicteAdminService,
  type AICTEInstitutionRecord,
  type AICTEStudentRecord,
  type AICTESubmissionStatus,
} from '@/services/aicteAdminService'
import { platformApi, type CollegeDetailForPlatform } from '@/services/portalApiService'
import type {
  PlatformInstitution,
  PlatformMonitoringService,
  PlatformLogEvent,
  PlatformMetricStats,
} from '@/types'

export interface PlatformToast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface PlatformContextType {
  institutions: PlatformInstitution[]
  stats: PlatformMetricStats
  monitoringServices: PlatformMonitoringService[]
  platformLogs: PlatformLogEvent[]
  toast: PlatformToast | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  dismissToast: () => void
  updateInstitutionStatus: (
    institutionId: string,
    newStatus: PlatformInstitution['status'],
    reason?: string
  ) => void
  getCollegeDetails: (collegeId: string) => Promise<CollegeDetailForPlatform>
  refreshPlatformData: () => Promise<void>
  // AICTE Admin Portal Additions
  aicteInstitutions: AICTEInstitutionRecord[]
  aicteStudents: AICTEStudentRecord[]
  reviewStudentRecord: (
    recordId: string,
    action: 'resolve' | 'require_correction' | 'flag_duplicate' | 'mark_pending',
    note: string,
    author?: string
  ) => void
  updateAicteInstitutionStatus: (
    institutionId: string,
    newStatus: AICTESubmissionStatus,
    note?: string
  ) => void
  issueCorrectionRequest: (
    institutionId: string,
    issueText: string
  ) => void
  refreshAicteData: () => void
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined)

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [institutions, setInstitutions] = useState<PlatformInstitution[]>([])
  const [backendStats, setBackendStats] = useState<any>(null)
  const [monitoringServices] = useState<PlatformMonitoringService[]>(mockMonitoringServices)
  const [platformLogs, setPlatformLogs] = useState<PlatformLogEvent[]>([])
  const [toast, setToast] = useState<PlatformToast | null>(null)

  // AICTE Admin state initialized empty
  const [aicteInstitutions, setAicteInstitutions] = useState<AICTEInstitutionRecord[]>([])
  const [aicteStudents, setAicteStudents] = useState<AICTEStudentRecord[]>([])

  const fetchPlatformData = useCallback(async () => {
    try {
      const res = await platformApi.getDashboard()
      if (res && res.success) {
        const mapped: PlatformInstitution[] = Array.isArray(res.colleges)
          ? res.colleges.map((c: any) => ({
              id: c.id,
              aicteCode: c.code,
              name: c.name,
              type: (c.type as any) || 'Affiliated',
              state: c.state || 'State',
              district: c.district || 'District',
              city: c.district || 'City',
              registrarName: c.contactEmail?.split('@')[0] || 'Registrar Office',
              registrarEmail: c.contactEmail,
              phone: c.contactPhone || '+91-00-00000000',
              status: c.status === 'approved' ? 'active' : (c.status as any) || 'active',
              onboardingDate: c.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
              totalEnrolled: c.totalStudents || 0,
              verifiedCount: c.verifiedStudents || 0,
              complianceScore: 100,
              naacAccreditation: 'A',
            }))
          : []
        setInstitutions(mapped)
        setBackendStats(res.stats || null)

        // Sync with AICTE governance state
        const aicteMapped: AICTEInstitutionRecord[] = mapped.map((m) => ({
          id: m.id,
          aicteCode: m.aicteCode,
          name: m.name,
          state: m.state,
          district: m.district,
          city: m.city,
          type: (m.type as any) || 'Autonomous',
          registrarName: m.registrarName,
          registrarEmail: m.registrarEmail,
          phone: m.phone,
          approvedCourses: [],
          totalApprovedIntake: 0,
          totalReportedEnrolment: m.totalEnrolled,
          latestSubmissionDate: m.onboardingDate,
          submissionStatus: m.status === 'active' ? 'Completed' : 'Submitted',
          unresolvedIssuesCount: 0,
          naacAccreditation: m.naacAccreditation,
          complianceScore: m.complianceScore,
          submissionHistory: [],
          correctionRequests: [],
        }))
        aicteAdminService.setInstitutionsFromDb(aicteMapped)
        setAicteInstitutions(aicteMapped)

        if (Array.isArray(res.recentAuditLogs)) {
          const mappedLogs: PlatformLogEvent[] = res.recentAuditLogs.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            actor: l.actorName ? `${l.actorName} (${l.actorRole || 'System'})` : 'System Audit',
            action: l.action,
            target: l.targetType || 'Database',
            severity: 'info',
            details: l.details,
          }))
          setPlatformLogs(mappedLogs)
        } else {
          setPlatformLogs([])
        }
      } else {
        setInstitutions([])
        setPlatformLogs([])
      }
    } catch {
      setInstitutions([])
      setPlatformLogs([])
    }
  }, [])

  const getCollegeDetails = useCallback(async (collegeId: string) => {
    return platformApi.getCollegeDetails(collegeId)
  }, [])

  const refreshAicteData = useCallback(() => {
    setAicteInstitutions(aicteAdminService.getInstitutions())
    setAicteStudents(aicteAdminService.getStudents())
  }, [])

  useEffect(() => {
    fetchPlatformData()
  }, [fetchPlatformData])

  useEffect(() => {
    const handleRecordReviewed = () => refreshAicteData()
    const handleInstUpdated = () => refreshAicteData()

    window.addEventListener('apaar:aicte-record-reviewed', handleRecordReviewed)
    window.addEventListener('apaar:aicte-institution-updated', handleInstUpdated)

    return () => {
      window.removeEventListener('apaar:aicte-record-reviewed', handleRecordReviewed)
      window.removeEventListener('apaar:aicte-institution-updated', handleInstUpdated)
    }
  }, [refreshAicteData])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now()
    setToast({ id, message, type })
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr))
    }, 4500)
  }, [])

  const dismissToast = useCallback(() => {
    setToast(null)
  }, [])

  const reviewStudentRecord = useCallback(
    (
      recordId: string,
      action: 'resolve' | 'require_correction' | 'flag_duplicate' | 'mark_pending',
      note: string,
      author = 'AICTE Administrator'
    ) => {
      const updated = aicteAdminService.reviewStudentRecord(recordId, action, note, author)
      setAicteStudents(aicteAdminService.getStudents())
      showToast(
        `Record for ${updated.studentName} updated to "${updated.validationStatus}".`,
        action === 'resolve' ? 'success' : action === 'require_correction' ? 'info' : 'error'
      )
    },
    [showToast]
  )

  const updateAicteInstitutionStatus = useCallback(
    (institutionId: string, newStatus: AICTESubmissionStatus, note?: string) => {
      const updated = aicteAdminService.updateInstitutionStatus(institutionId, newStatus, note)
      setAicteInstitutions(aicteAdminService.getInstitutions())
      showToast(
        `Submission status for ${updated.name} updated to "${newStatus}".`,
        newStatus === 'Completed' ? 'success' : 'info'
      )
    },
    [showToast]
  )

  const issueCorrectionRequest = useCallback(
    (institutionId: string, issueText: string) => {
      const updated = aicteAdminService.issueCorrectionRequest(institutionId, issueText)
      setAicteInstitutions(aicteAdminService.getInstitutions())
      showToast(
        `Correction notice issued to ${updated.name}.`,
        'info'
      )
    },
    [showToast]
  )

  const updateInstitutionStatus = useCallback(
    (institutionId: string, newStatus: PlatformInstitution['status'], reason?: string) => {
      const targetInst = institutions.find((i) => i.id === institutionId)
      if (!targetInst) return

      const prevStatus = targetInst.status

      platformApi.updateCollegeStatus(institutionId, newStatus).catch((err) => {
        console.warn('Backend updateCollegeStatus:', err.message)
      })

      setInstitutions((prev) =>
        prev.map((inst) => {
          if (inst.id !== institutionId) return inst
          return {
            ...inst,
            status: newStatus,
            suspensionReason: newStatus === 'suspended' ? reason : undefined,
          }
        })
      )

      // Add to platform audit log
      const newLog: PlatformLogEvent = {
        id: `PLOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: 'platform.admin@aicte.gov.in',
        action: `Institution Status: ${prevStatus.toUpperCase()} → ${newStatus.toUpperCase()}`,
        target: `${targetInst.name} (${targetInst.aicteCode})`,
        severity: newStatus === 'suspended' ? 'critical' : newStatus === 'active' ? 'info' : 'warning',
        details: reason ? `Reason provided: ${reason}` : `Status modified by Platform Administrator.`,
      }
      setPlatformLogs((prev) => [newLog, ...prev])

      showToast(
        `Institution ${targetInst.name} status updated to ${newStatus.replace('_', ' ').toUpperCase()}.`,
        newStatus === 'suspended' ? 'error' : 'success'
      )
    },
    [institutions, showToast]
  )

  const stats = useMemo<PlatformMetricStats>(() => {
    const totalEnrolledSum = institutions.reduce((acc, curr) => acc + (curr.totalEnrolled || 0), 0)
    const verifiedSum = institutions.reduce((acc, curr) => acc + (curr.verifiedCount || 0), 0)
    const activeCount = institutions.filter((i) => i.status === 'active').length
    const suspendedCount = institutions.filter((i) => i.status === 'suspended').length

    return {
      totalStudents: backendStats?.totalStudents ?? totalEnrolledSum,
      totalInstitutions: backendStats?.totalColleges ?? institutions.length,
      totalVerificationRequests: backendStats?.totalVerificationRequests ?? 0,
      verifiedRecords: backendStats?.verifiedRecords ?? verifiedSum,
      pendingRecords: backendStats?.pendingVerificationRequests ?? 0,
      rejectedRecords: backendStats?.rejectedRequests ?? 0,
      incompleteRecords: 0,
      activeInstitutions: activeCount,
      suspendedInstitutions: suspendedCount,
    }
  }, [institutions, backendStats])

  return (
    <PlatformContext.Provider
      value={{
        institutions,
        stats,
        monitoringServices,
        platformLogs,
        toast,
        showToast,
        dismissToast,
        updateInstitutionStatus,
        getCollegeDetails,
        refreshPlatformData: fetchPlatformData,
        aicteInstitutions,
        aicteStudents,
        reviewStudentRecord,
        updateAicteInstitutionStatus,
        issueCorrectionRequest,
        refreshAicteData,
      }}
    >
      {children}
    </PlatformContext.Provider>
  )
}

export const usePlatform = () => {
  const context = useContext(PlatformContext)
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider')
  }
  return context
}

export const usePlatformContext = usePlatform

