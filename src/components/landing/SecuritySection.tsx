import React from 'react'
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  FileKey, 
  CheckCircle2, 
  UserCheck, 
  EyeOff,
  Server
} from 'lucide-react'
import { Card } from '@/components/common/Card'

export const SecuritySection: React.FC = () => {
  const securityPillars = [
    {
      icon: <Lock className="text-blue-600" size={22} />,
      title: '256-Bit AES & TLS 1.3 Encryption',
      description:
        'All student identity metrics and academic credentials remain encrypted both at rest and in transit across zero-trust network boundaries.',
    },
    {
      icon: <FileKey className="text-purple-600" size={22} />,
      title: 'DPDP Act 2023 Compliance',
      description:
        'Built strictly according to India’s Digital Personal Data Protection Act, ensuring strict purpose limitation and data minimization.',
    },
    {
      icon: <UserCheck className="text-indigo-600" size={22} />,
      title: 'Consent-Driven Architecture',
      description:
        'Student APAAR seeding and third-party credit transfers require explicit, revocable student authorization via OTP or DigiLocker consent.',
    },
    {
      icon: <Key className="text-blue-600" size={22} />,
      title: 'Granular Role-Based Access (RBAC)',
      description:
        'Strict privilege isolation ensuring only authorized registrars, nodal verification officers, and AICTE evaluators access specified subsets.',
    },
    {
      icon: <EyeOff className="text-purple-600" size={22} />,
      title: 'Zero Plaintext Aadhaar Storage',
      description:
        'Only virtual IDs (VIDs) and cryptographic hash signatures are retained. Personally identifiable physical numbers are never stored in databases.',
    },
    {
      icon: <Server className="text-indigo-600" size={22} />,
      title: 'Tamper-Evident Audit Trails',
      description:
        'Immutable cryptographic logging of every verification request, verification timestamp, and registrar review action for inspection audits.',
    },
  ]

  return (
    <section id="security" className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/80">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Enterprise Security & Data Privacy</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Protecting Student Data with <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sovereign Cryptographic Trust</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Engineered from day one with the principle of security-by-design, ensuring AICTE institutions maintain bulletproof compliance.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((pillar, i) => (
            <Card
              key={i}
              hoverEffect
              className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-3"
            >
              <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {pillar.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Compliance Guarantee Banner */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base font-bold text-slate-900">
              Institutional Privacy & Audit Certifications
            </h4>
            <p className="text-xs text-slate-500 max-w-xl">
              Platform aligns with MEITY guidelines for government academic repositories, AICTE cybersecurity mandates, and ISO/IEC 27001 data protection principles.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-700 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>DPDP Act Ready</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>AES-256 Validated</span>
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>DigiLocker Certified</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
