import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Home } from '@/pages/Home'
import { Dashboard } from '@/pages/Dashboard'
import { Verification } from '@/pages/Verification'
import { Students } from '@/pages/Students'
import { Analytics } from '@/pages/Analytics'
import { NotFound } from '@/pages/NotFound'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ProtectedRoute } from '@/components/common/ProtectedRoute'

// Student Dashboard Components
import { StudentLayout } from '@/components/student/StudentLayout'
import { StudentOverview } from '@/pages/student/StudentOverview'
import { StudentProfile } from '@/pages/student/StudentProfile'
import { StudentRecords } from '@/pages/student/StudentRecords'
import { StudentDocuments } from '@/pages/student/StudentDocuments'
import { StudentRequests } from '@/pages/student/StudentRequests'
import { StudentNotifications } from '@/pages/student/StudentNotifications'
import { StudentSettings } from '@/pages/student/StudentSettings'

// College Administrator Dashboard Components
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminOverview } from '@/pages/admin/AdminOverview'
import { AdminStudents } from '@/pages/admin/AdminStudents'
import { AdminAcademicRecords } from '@/pages/admin/AdminAcademicRecords'
import { AdminDocumentReview } from '@/pages/admin/AdminDocumentReview'
import { AdminVerificationRequests } from '@/pages/admin/AdminVerificationRequests'
import { AdminDataQuality } from '@/pages/admin/AdminDataQuality'
import { AdminNotifications } from '@/pages/admin/AdminNotifications'
import { AdminSettings } from '@/pages/admin/AdminSettings'
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics'

// Apex Platform Administrator Dashboard Components (Stages 6, 7, 8)
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { PlatformOverview } from '@/pages/platform/PlatformOverview'
import { PlatformInstitutions } from '@/pages/platform/PlatformInstitutions'
import { PlatformMonitoring } from '@/pages/platform/PlatformMonitoring'
import { PlatformQuality } from '@/pages/platform/PlatformQuality'
import { PlatformAuditLogs } from '@/pages/platform/PlatformAuditLogs'
import { PlatformAnalytics } from '@/pages/platform/PlatformAnalytics'
import { PlatformNotifications } from '@/pages/platform/PlatformNotifications'
import { PlatformValidation } from '@/pages/platform/PlatformValidation'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Modern Public Landing Page */}
      <Route path="/" element={<Home />} />

      {/* Public APAAR Verification Tool */}
      <Route path="/verification" element={<Verification />} />

      {/* Authentication Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Student Dashboard Portal — Protected for role 'student' */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentOverview />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="records" element={<StudentRecords />} />
        <Route path="documents" element={<StudentDocuments />} />
        <Route path="requests" element={<StudentRequests />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="settings" element={<StudentSettings />} />
      </Route>

      {/* College Administrator Dashboard Portal — Protected for role 'college_admin' */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['college_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="academic-records" element={<AdminAcademicRecords />} />
        <Route path="documents" element={<AdminDocumentReview />} />
        <Route path="verifications" element={<AdminVerificationRequests />} />
        <Route path="data-quality" element={<AdminDataQuality />} />
        <Route path="audit" element={<Navigate to="/admin" replace />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Apex Platform Administrator Dashboard Portal — Protected for role 'platform_admin' */}
      <Route
        path="/platform"
        element={
          <ProtectedRoute allowedRoles={['platform_admin']}>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformOverview />} />
        <Route path="validation" element={<PlatformValidation />} />
        <Route path="institutions" element={<PlatformInstitutions />} />
        <Route path="monitoring" element={<PlatformMonitoring />} />
        <Route path="quality" element={<PlatformQuality />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="notifications" element={<PlatformNotifications />} />
        <Route path="audit" element={<PlatformAuditLogs />} />
      </Route>

      {/* Legacy Institutional Management & Verification Portal */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['college_admin', 'platform_admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
