import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Search, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { mockStudents } from '@/services/mockData'
import { formatApaarId } from '@/utils/formatters'
import type { VerificationStatus } from '@/types'

export const Students: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VerificationStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = mockStudents.filter((student) => {
    const matchesTab = activeTab === 'all' || student.status === activeTab
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.apaarId.includes(searchTerm.replace(/\D/g, '')) ||
      student.branch.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-blue-600" />
            Institutional Student Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete database of enrolled candidates with verified APAAR IDs, DigiLocker status, and academic progress.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/verification">
            <Button size="sm" variant="primary" leftIcon={<ShieldCheck size={16} />}>
              Verify New ID
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs w-full md:w-auto overflow-x-auto">
            {(['all', 'verified', 'pending', 'flagged'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all shrink-0 ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab}
                <span className="ml-1.5 text-[10px] text-slate-400">
                  ({tab === 'all' ? mockStudents.length : mockStudents.filter((s) => s.status === tab).length})
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <Input
              placeholder="Search by name, APAAR, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={15} />}
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 font-semibold">Student Name</th>
                <th className="py-3 px-3 font-semibold">APAAR ID</th>
                <th className="py-3 px-3 font-semibold">Course & Branch</th>
                <th className="py-3 px-3 font-semibold">DigiLocker</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {student.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {student.gender} • DOB: {student.dob}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatApaarId(student.apaarId)}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        {student.branch}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {student.course} • Sem {student.currentSemester} (CGPA: {student.cgpa})
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {student.digilockerSynced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <FileCheck size={14} /> Synced
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not Synced</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={student.status} dot>
                        {student.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link to={`/verification?id=${student.apaarId}`}>
                        <Button size="sm" variant="ghost" rightIcon={<ArrowRight size={13} />} className="text-blue-600">
                          Verify
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    <Filter className="mx-auto h-6 w-6 text-slate-300 mb-2" />
                    No students match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
