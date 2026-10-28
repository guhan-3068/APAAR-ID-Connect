import { useState, useEffect } from 'react'
import {
  Building2,
  Mail,
  MapPin,
  ShieldCheck,
  Info,
  BookOpen,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import { Button } from '@/components/common/Button'

const FieldRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 last:border-0">
    <span className="sm:w-48 text-xs font-semibold text-slate-500 shrink-0">{label}</span>
    <span className={`text-sm text-slate-900 ${mono ? 'font-mono text-blue-700' : 'font-medium'}`}>{value}</span>
  </div>
)

export const AdminSettings: React.FC = () => {
  const { adminProfile, departments: contextDepts, updateDepartments } = useAdmin()
  const [localDepts, setLocalDepts] = useState<string[]>([])
  const [newDeptName, setNewDeptName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (contextDepts && contextDepts.length > 0) {
      setLocalDepts(contextDepts)
    }
  }, [contextDepts])

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newDeptName.trim()
    if (!trimmed) return
    if (localDepts.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setSaveStatus({ type: 'error', message: `Department "${trimmed}" is already added.` })
      return
    }
    setLocalDepts([...localDepts, trimmed])
    setNewDeptName('')
    setSaveStatus(null)
  }

  const handleRemoveDept = (deptToRemove: string) => {
    setLocalDepts(localDepts.filter((d) => d !== deptToRemove))
    setSaveStatus(null)
  }

  const handleResetToStandard = () => {
    const standardDepts = [
      'Computer Science and Engineering',
      'Information Technology',
      'Artificial Intelligence and Data Science',
      'Electronics and Communication Engineering',
      'Electrical and Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering',
    ]
    setLocalDepts(standardDepts)
    setSaveStatus(null)
  }

  const handleSaveDepartments = async () => {
    if (localDepts.length === 0) {
      setSaveStatus({ type: 'error', message: 'You must configure at least one department.' })
      return
    }
    setIsSaving(true)
    setSaveStatus(null)
    try {
      await updateDepartments(localDepts)
      setSaveStatus({ type: 'success', message: 'Configured departments successfully saved to database.' })
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err?.message || 'Failed to save departments.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Institutional Information */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-3">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <strong>Institutional Settings.</strong> Official administrative information for {adminProfile.institutionName || 'your college'}. Sourced directly from verified college records.
        </div>
      </div>

      {/* Configured Academic Departments Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50">
              <BookOpen size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Configured Academic Departments</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {localDepts.length} {localDepts.length === 1 ? 'Dept' : 'Depts'}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official departments offered by this institution. Students choose from this list.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetToStandard}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            title="Load default AICTE technical departments"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Standard AICTE</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {saveStatus && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                saveStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {saveStatus.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Add Department input */}
          <form onSubmit={handleAddDept} className="flex gap-2">
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="e.g. Biomedical Engineering or Data Science"
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              leftIcon={<Plus size={14} />}
              disabled={!newDeptName.trim()}
            >
              Add
            </Button>
          </form>

          {/* Departments list chips */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600">
              Active Departments for {adminProfile.institutionName}:
            </label>
            {localDepts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                <p className="font-semibold">⚠️ No departments currently configured.</p>
                <p className="text-[11px] text-amber-700">
                  Students registering under your college will not have any department options. Click &quot;Standard AICTE&quot; above to load recommended departments or add your own.
                </p>
                <button
                  type="button"
                  onClick={handleResetToStandard}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load Recommended AICTE Departments
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {localDepts.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 text-xs font-medium transition-colors"
                  >
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDept(dept)}
                      className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                      title={`Remove ${dept}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<Save size={14} />}
              onClick={handleSaveDepartments}
              disabled={localDepts.length === 0}
            >
              Save Department Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Institutional Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50">
            <Building2 size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Institutional Profile</h2>
            <p className="text-[11px] text-slate-400">AICTE-registered institution details</p>
          </div>
        </div>
        <div className="px-6 py-2">
          <FieldRow label="Institution Name" value={adminProfile.institutionName} />
          <FieldRow label="AICTE Code" value={adminProfile.institutionCode} mono />
          <FieldRow label="Institution Type" value={adminProfile.type || 'Affiliated'} />
          <FieldRow label="City / District" value={adminProfile.city || 'District'} />
          <FieldRow label="State" value={adminProfile.state || 'State'} />
        </div>
      </div>

      {/* Nodal Officer / Admin Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50">
            <ShieldCheck size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Nodal Officer / Administrator Profile</h2>
            <p className="text-[11px] text-slate-400">Office of the Registrar</p>
          </div>
        </div>
        <div className="px-6 py-2">
          <FieldRow label="Name" value={adminProfile.name} />
          <FieldRow label="Designation" value={adminProfile.role} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100">
            <span className="sm:w-48 text-xs font-semibold text-slate-500">Official Email</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
              <Mail size={14} className="text-slate-400" />
              {adminProfile.email}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100">
            <span className="sm:w-48 text-xs font-semibold text-slate-500">Institution Code</span>
            <span className="flex items-center gap-1.5 text-sm font-mono text-slate-700">
              {adminProfile.institutionCode}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3">
            <span className="sm:w-48 text-xs font-semibold text-slate-500">Address</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
              <MapPin size={14} className="text-slate-400" />
              {adminProfile.city || 'City'}, {adminProfile.state || 'State'}
            </span>
          </div>
        </div>
      </div>

      {/* Platform Settings Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50">
            <Info size={18} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Platform & Integration Notes</h2>
            <p className="text-[11px] text-slate-400">Backend requirements for production deployment</p>
          </div>
        </div>
        <div className="p-6">
          <ul className="space-y-3 text-xs text-slate-600">
            {[
              { icon: '🔐', text: 'All admin accounts must use institution-issued email addresses and multi-factor authentication in production.' },
              { icon: '📋', text: 'AICTE portal integration requires an approved API key from the AICTE National Academic Depository (NAD) system.' },
              { icon: '🔗', text: 'DigiLocker ABC (Academic Bank of Credits) integration requires a separate authorization from the National e-Governance Division (NeGD).' },
              { icon: '📁', text: 'Document uploads in production must use server-side validation, virus scanning, and cryptographic hash verification before storage.' },
              { icon: '📊', text: 'Audit logs must be stored in a tamper-evident, server-side system. Browser-session logs are for demonstration only.' },
              { icon: '⚖️', text: 'Student APAAR IDs are sensitive PII under the Digital Personal Data Protection Act, 2023 (DPDPA). Access controls must be enforced at the API layer.' },
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3">
                <span className="text-base shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
