import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  UserCheck, 
  Clock, 
  Award, 
  ArrowUpRight, 
  Building2, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { mockInstitution, mockStudents } from '@/services/mockData'
import { formatApaarId } from '@/utils/formatters'

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Institution Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {mockInstitution.name}
                </h1>
                <Badge status="verified" variant="subtle">AICTE Approved</Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Permanent AICTE ID: <span className="font-mono font-medium">{mockInstitution.aicteCode}</span> • {mockInstitution.district}, {mockInstitution.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/verification">
              <Button size="sm" variant="primary" leftIcon={<UserCheck size={16} />}>
                Verify APAAR
              </Button>
            </Link>
            <Link to="/students">
              <Button size="sm" variant="outline" leftIcon={<FileSpreadsheet size={16} />}>
                Export Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled"
          value={mockInstitution.totalStudentsEnrolled.toLocaleString()}
          change="+4.2%"
          trend="up"
          description="Active AICTE approved seats"
          icon={<Users size={20} />}
          color="blue"
        />
        <StatCard
          title="APAAR Verified"
          value={mockInstitution.verifiedApaarCount.toLocaleString()}
          change="+8.6%"
          trend="up"
          description="DigiLocker ABC synced"
          icon={<UserCheck size={20} />}
          color="emerald"
        />
        <StatCard
          title="Pending Verification"
          value={mockInstitution.pendingVerificationCount}
          change="-2.1%"
          trend="down"
          description="Awaiting student consent/OTP"
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatCard
          title="AICTE Compliance"
          value="92.2%"
          change="+1.5%"
          trend="up"
          description="Institutional benchmark target: 90%"
          icon={<Award size={20} />}
          color="purple"
        />
      </div>

      {/* Two-Column Grid: Recent Verifications & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Verifications Table (Span 2) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle>Recent APAAR Verifications</CardTitle>
                <CardDescription>Latest student records processed through the AICTE gateway</CardDescription>
              </div>
              <Link to="/students">
                <Button size="sm" variant="ghost" rightIcon={<ArrowUpRight size={14} />}>
                  View All
                </Button>
              </Link>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-y border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Student Name</th>
                    <th className="py-2.5 px-3 font-semibold">APAAR ID</th>
                    <th className="py-2.5 px-3 font-semibold">Branch</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {mockStudents.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {std.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {std.course} • Sem {std.currentSemester}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatApaarId(std.apaarId)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {std.branch}
                      </td>
                      <td className="py-3 px-3">
                        <Badge status={std.status} dot>
                          {std.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link to={`/verification?id=${std.apaarId}`}>
                          <Button size="sm" variant="ghost" className="text-blue-600 dark:text-blue-400 py-1 px-2">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* System & Sync Status Card */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Government Depository Sync</CardTitle>
                <CardDescription>Live connection with national registries</CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">DigiLocker Services</p>
                    <p className="text-[10px] text-slate-400">Identity & Marks Sheet Repo</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Active</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Academic Bank of Credits</p>
                    <p className="text-[10px] text-slate-400">Credit transfer & verification</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Synced</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">AICTE Approval Portal</p>
                    <p className="text-[10px] text-slate-400">Seat matrix & enrollment check</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600">Verified</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
