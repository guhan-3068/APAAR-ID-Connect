import React from 'react'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { mockAdminProfile } from '@/services/adminMockData'

const FieldRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 last:border-0">
    <span className="sm:w-48 text-xs font-semibold text-slate-500 shrink-0">{label}</span>
    <span className={`text-sm text-slate-900 ${mono ? 'font-mono text-blue-700' : 'font-medium'}`}>{value}</span>
  </div>
)

export const AdminSettings: React.FC = () => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Synthetic Data Disclaimer */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <strong>Demonstration Mode.</strong> All institutional data below is synthetic and intended for hackathon demonstration only. In production, institutional profile data would be sourced from the verified AICTE institution registry.
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
          <FieldRow label="Institution Name" value={mockAdminProfile.institutionName} />
          <FieldRow label="AICTE Code" value={mockAdminProfile.institutionCode} mono />
          <FieldRow label="Institution Type" value={mockAdminProfile.type} />
          <FieldRow label="City / District" value={mockAdminProfile.city} />
          <FieldRow label="State" value={mockAdminProfile.state} />
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
          <FieldRow label="Name" value={mockAdminProfile.name} />
          <FieldRow label="Designation" value={mockAdminProfile.role} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100">
            <span className="sm:w-48 text-xs font-semibold text-slate-500">Official Email</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
              <Mail size={14} className="text-slate-400" />
              {mockAdminProfile.email}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100">
            <span className="sm:w-48 text-xs font-semibold text-slate-500">Phone</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
              <Phone size={14} className="text-slate-400" />
              +91-80-23456789 (Demonstration)
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3">
            <span className="sm:w-48 text-xs font-semibold text-slate-500">Address</span>
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
              <MapPin size={14} className="text-slate-400" />
              {mockAdminProfile.city}, {mockAdminProfile.state}
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
