import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FileCheck2, 
  Clock, 
  AlertCircle, 
  UploadCloud, 
  FileBadge, 
  Building2,
  Bell,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Calendar
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { StatCard } from '@/components/common/StatCard'
import { useStudent } from '@/context/StudentContext'
import { formatApaarId } from '@/utils/formatters'

export const StudentOverview: React.FC = () => {
  const { profile, documents, notifications } = useStudent()

  // Document Metrics
  const submittedDocumentsCount = documents.length
  const verifiedDocumentsCount = documents.filter((d) => d.status === 'verified').length
  const pendingVerificationCount = documents.filter((d) => d.status === 'pending').length
  const actionsRequiredCount = documents.filter((d) => d.status === 'requires_review' || d.status === 'rejected').length

  const totalExpectedDocuments = documents.length > 0 ? documents.length : 0
  const remainingDocuments = Math.max(0, totalExpectedDocuments - verifiedDocumentsCount)
  const verificationProgressPct = totalExpectedDocuments > 0 ? Math.min(100, Math.round((verifiedDocumentsCount / totalExpectedDocuments) * 100)) : 0

  return (
    <div className="space-y-6">
      {/* 1. Student Information Header - Large & Bold Font */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-blue-100/60 via-purple-50/40 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {profile.fullName.split(' ').map((n) => n[0]).join('')}
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Logged-in Student
                </span>
                <Badge status="verified" dot>
                  APAAR SEEDED & DIGILOCKER SYNCED
                </Badge>
              </div>

              {/* Student Name in Large, Bold Font */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {profile.fullName}
              </h1>

              {/* APAAR ID and College Name in Large, Bold Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-1 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <FileBadge size={20} className="text-blue-600 shrink-0" />
                  <span className="text-slate-500 font-medium">APAAR ID:</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-blue-700 tracking-wider">
                    {formatApaarId(profile.apaarId)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-purple-600 shrink-0" />
                  <span className="text-slate-500 font-medium">College:</span>
                  <span className="text-base sm:text-lg font-bold text-slate-800">
                    {profile.institutionName}
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-500 pt-0.5">
                Reg No: <span className="font-mono font-bold text-slate-700">{profile.registrationNumber}</span> • {profile.course} {profile.department ? `• ${profile.department}` : ''}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <Link to="/student/documents">
              <Button size="sm" variant="outline" leftIcon={<UploadCloud size={15} />}>
                Upload Document
              </Button>
            </Link>
            <Link to="/student/requests">
              <Button size="sm" variant="primary" leftIcon={<FileCheck2 size={15} />}>
                Verification Requests
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Four Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Documents: submitted / total expected */}
        <StatCard
          title="Total Documents"
          value={`${submittedDocumentsCount}/${totalExpectedDocuments}`}
          description="Submitted Documents / Total Expected Documents"
          icon={<FileSpreadsheet size={22} />}
          color="blue"
        />

        {/* Card 2: Verified Documents: number only */}
        <StatCard
          title="Verified Documents"
          value={verifiedDocumentsCount}
          description="Digitally sealed & verified by college"
          icon={<CheckCircle size={22} />}
          color="emerald"
        />

        {/* Card 3: Pending Verification: number only */}
        <StatCard
          title="Pending Verification"
          value={pendingVerificationCount}
          description="Under review by college registrar"
          icon={<Clock size={22} />}
          color="amber"
        />

        {/* Card 4: Actions Required: number only */}
        <StatCard
          title="Actions Required"
          value={actionsRequiredCount}
          description="Documents requiring correction or rescan"
          icon={<AlertCircle size={22} />}
          color={actionsRequiredCount > 0 ? 'rose' : 'purple'}
        />
      </div>

      {/* 3. Your Document Verification Progress */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={22} />
                Your Document Verification Progress
              </CardTitle>
              <CardDescription>
                Progress towards complete institutional document verification for degree eligibility & Academic Bank of Credits (ABC)
              </CardDescription>
            </div>
            <Badge
              status={verificationProgressPct === 100 ? 'verified' : verificationProgressPct >= 50 ? 'info' : 'pending'}
              className="text-xs self-start sm:self-auto"
            >
              {verificationProgressPct}% Completed
            </Badge>
          </div>
        </CardHeader>

        {/* Progress Bar & Numerical Metrics */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Overall Verification Completion</span>
              <span className="text-blue-700 font-bold">{verifiedDocumentsCount} of {totalExpectedDocuments} Documents Verified ({verificationProgressPct}%)</span>
            </div>
            
            {/* Animated Gradient Progress Bar */}
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 transition-all duration-700"
                style={{ width: `${verificationProgressPct}%` }}
              />
            </div>
          </div>

          {/* 3 Metrics Callouts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs font-medium text-emerald-800 block">Verified Count</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-emerald-700">{verifiedDocumentsCount}</span>
                <span className="text-xs text-emerald-600 font-medium">documents verified</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="text-xs font-medium text-blue-800 block">Total Expected Documents</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-blue-700">{totalExpectedDocuments}</span>
                <span className="text-xs text-blue-600 font-medium">prescribed for degree</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
              <span className="text-xs font-medium text-amber-800 block">Remaining Documents</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-amber-700">{remainingDocuments}</span>
                <span className="text-xs text-amber-600 font-medium">pending verification</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100">
            <span>
              Mandated under AICTE National Academic Depository & UGC Academic Bank of Credits guidelines.
            </span>
            <Link to="/student/documents" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
              Manage Documents Repository <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </Card>

      {/* 4. Important Notifications */}
      <Card className="p-6">
        <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="text-purple-600" size={20} />
              Important Notifications
            </CardTitle>
            <CardDescription>
              Relevant college announcements and student-specific updates
            </CardDescription>
          </div>
          <Link to="/student/notifications">
            <Button size="sm" variant="ghost" rightIcon={<ArrowRight size={13} />}>
              View All
            </Button>
          </Link>
        </CardHeader>

        <div className="divide-y divide-slate-100">
          {notifications.length > 0 ? (
            notifications.slice(0, 4).map((notif) => {
              const isCollegeAnnouncement = notif.title.toLowerCase().includes('announcement') || notif.title.toLowerCase().includes('placement') || notif.type === 'update'
              return (
                <div key={notif.id} className="py-3.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{notif.title}</span>
                      {isCollegeAnnouncement ? (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          College Announcement
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Student Update
                        </span>
                      )}
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar size={12} /> {notif.date}
                      </span>
                      {notif.actionUrl && (
                        <Link to={notif.actionUrl} className="font-semibold text-blue-600 hover:underline">
                          Take Action →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Bell size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">No notifications yet.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
