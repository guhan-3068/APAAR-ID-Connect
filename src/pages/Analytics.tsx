import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { StatCard } from '@/components/common/StatCard'

export const Analytics: React.FC = () => {
  const departmentBreakdown = [
    { name: 'Computer Science & Engineering', total: 720, verified: 702, pct: 97.5 },
    { name: 'Artificial Intelligence & Data Science', total: 480, verified: 461, pct: 96.0 },
    { name: 'Electronics & Communication', total: 600, verified: 540, pct: 90.0 },
    { name: 'Mechanical Engineering', total: 540, verified: 486, pct: 90.0 },
    { name: 'Civil Engineering', total: 500, verified: 429, pct: 85.8 },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-blue-600" />
          AICTE Compliance & APAAR Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Institutional metrics tracking compliance with AICTE guidelines, DigiLocker seedings, and credit transfers.
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Overall Seeding Ratio"
          value="92.2%"
          change="+3.4%"
          trend="up"
          description="APAAR generation vs Total sanctioned seats"
          icon={<TrendingUp size={20} />}
          color="emerald"
        />
        <StatCard
          title="DigiLocker Linked"
          value="2,618"
          change="+12.0%"
          trend="up"
          description="Students with verified digital credentials"
          icon={<ShieldCheck size={20} />}
          color="blue"
        />
        <StatCard
          title="Audit Anomalies"
          value="4"
          change="-2"
          trend="down"
          description="Duplicate or mismatched records pending review"
          icon={<AlertCircle size={20} />}
          color="rose"
        />
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Department-Wise Verification Progress</CardTitle>
            <CardDescription>Progress towards 100% APAAR adoption per academic discipline</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-2">
          {departmentBreakdown.map((dept) => (
            <div key={dept.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <GraduationCap size={15} className="text-blue-500" />
                  {dept.name}
                </span>
                <span className="text-slate-500 font-mono">
                  {dept.verified} / {dept.total} ({dept.pct}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                  style={{ width: `${dept.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations & Next Steps */}
      <Card className="border-l-4 border-l-blue-600">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-slate-900 dark:text-white">
              AICTE Compliance Milestone Achieved
            </h4>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Institution has surpassed the 90% threshold for mandatory APAAR generation. Automatic eligibility for AICTE Prime Minister's Special Scholarship Scheme (PMSSS) and National Academic Credit transfers is active.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
