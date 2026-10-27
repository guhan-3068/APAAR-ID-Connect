import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import {
  mockPlatformInstitutions,
  mockPlatformStats,
  mockMonitoringServices,
  mockPlatformLogs,
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
  const [institutions, setInstitutions] = useState<PlatformInstitution[]>(mockPlatformInstitutions)
  const [monitoringServices] = useState<PlatformMonitoringService[]>(mockMonitoringServices)
  const [platformLogs, setPlatformLogs] = useState<PlatformLogEvent[]>(mockPlatformLogs)
  const [toast, setToast] = useState<PlatformToast | null>(null)

  // AICTE Admin state
  const [aicteInstitutions, setAicteInstitutions] = useState<AICTEInstitutionRecord[]>(() =>
    aicteAdminService.getInstitutions()
  )
  const [aicteStudents, setAicteStudents] = useState<AICTEStudentRecord[]>(() =>
    aicteAdminService.getStudents()
  )

  const fetchPlatformData = useCallback(async () => {
    try {
      const res = await platformApi.getDashboard()
      if (res && res.success) {
        if (Array.isArray(res.colleges) && res.colleges.length > 0) {
          const mapped: PlatformInstitution[] = res.colleges.map((c: any) => ({
            id: c.id,
            aicteCode: c.code,
            name: c.name,
            type: (c.type as any) || 'Autonomous',
            state: c.state,
            district: c.district,
            city: c.district,
            registrarName: c.contactEmail?.split('@')[0] || 'Registrar Office',
            registrarEmail: c.contactEmail,
            phone: '+91-80-23456789',
            status: c.status === 'approved' ? 'active' : (c.status as any) || 'active',
            onboardingDate: c.createdAt?.split('T')[0] || '2024-01-15',
            totalEnrolled: 420,
            verifiedCount: 395,
            complianceScore: 96,
            naacAccreditation: 'A++',
          }))
          setInstitutions(mapped)
        }

        if (Array.isArray(res.recentAuditLogs) && res.recentAuditLogs.length > 0) {
          const mappedLogs: PlatformLogEvent[] = res.recentAuditLogs.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            actor: `${l.actorName} (${l.actorRole})`,
            action: l.action,
            target: l.targetType,
            severity: 'info',
            details: l.details,
          }))
          setPlatformLogs(mappedLogs)
        }
      }
    } catch {
      // Retain mock fallback
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
    const totalEnrolledSum = institutions.reduce((acc, curr) => acc + curr.totalEnrolled, 0)
    const verifiedSum = institutions.reduce((acc, curr) => acc + curr.verifiedCount, 0)
    const activeCount = institutions.filter((i) => i.status === 'active').length
    const suspendedCount = institutions.filter((i) => i.status === 'suspended').length

    return {
      totalStudents: totalEnrolledSum,
      totalInstitutions: institutions.length,
      totalVerificationRequests: mockPlatformStats.totalVerificationRequests,
      verifiedRecords: verifiedSum,
      pendingRecords: mockPlatformStats.pendingRecords,
      rejectedRecords: mockPlatformStats.rejectedRecords,
      incompleteRecords: mockPlatformStats.incompleteRecords,
      activeInstitutions: activeCount,
      suspendedInstitutions: suspendedCount,
    }
  }, [institutions])

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

