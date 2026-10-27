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

  const refreshAicteData = useCallback(() => {
    setAicteInstitutions(aicteAdminService.getInstitutions())
    setAicteStudents(aicteAdminService.getStudents())
  }, [])

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

