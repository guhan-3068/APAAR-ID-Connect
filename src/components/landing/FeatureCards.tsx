import React from 'react'
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  FileSpreadsheet, 
  Cpu, 
  Layers, 
  ArrowRight 
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Link } from 'react-router-dom'

export const FeatureCards: React.FC = () => {
  const features = [
    {
      id: 'student-records',
      title: 'Student Record Management',
      category: 'Core Registry',
      icon: <Users className="text-blue-600" size={24} />,
      accentColor: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      description:
        'Centralize student academic lifecycles with batch ingestion, AICTE sanctioned seat matrix validation, and automated branch/semester tracking.',
      highlights: [
        'Batch CSV & Excel Enrollment Ingestion',
        'Direct AICTE Sanctioned Intake Mapping',
        'Automated Academic Progression Tracking',
      ],
      linkText: 'Explore Registry',
      linkUrl: '/students',
    },
    {
      id: 'academic-verification',
      title: 'Academic Verification Engine',
      category: 'Real-Time Verification',
      icon: <UserCheck className="text-purple-600" size={24} />,
      accentColor: 'from-purple-600 to-indigo-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
      description:
        'Instantaneous verification of 12-digit APAAR IDs against National Academic Depository (NAD), DigiLocker repositories, and Academic Bank of Credits.',
      highlights: [
        'Sub-second 12-digit APAAR ID validation',
        'Academic Bank of Credits (ABC) ledger sync',
        'Cryptographic hash verification of marks cards',
      ],
      linkText: 'Test Verification Engine',
      linkUrl: '/verification',
    },
    {
      id: 'data-security',
      title: 'Data Security & Fraud Shield',
      category: 'Security & Privacy',
      icon: <ShieldAlert className="text-indigo-600" size={24} />,
      accentColor: 'from-indigo-600 to-blue-600',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      description:
        'Enterprise-grade security adhering to the DPDP Act with end-to-end 256-bit AES encryption, granular role-based permissions, and audit trails.',
      highlights: [
        'DPDP Act 2023 compliant data governance',
        'Multi-factor role-based institutional access (RBAC)',
        'Automated flag detection for duplicate enrollments',
      ],
      linkText: 'View Security Architecture',
      linkUrl: '#security',
    },
    {
      id: 'aicte-compliance',
      title: 'AICTE Compliance Analytics',
      category: 'Governance & Audits',
      icon: <FileSpreadsheet className="text-blue-600" size={24} />,
      accentColor: 'from-blue-600 to-purple-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      description:
        'Automated real-time compliance reporting for institutional accreditation, NIRF data collation, and PMSSS scholarship verification.',
      highlights: [
        'Real-time institutional seeding ratio calculator',
        'Exportable AICTE-formatted compliance dossiers',
        'Department-level verification milestone tracking',
      ],
      linkText: 'View Analytics Suite',
      linkUrl: '/analytics',
    },
    {
      id: 'digilocker-sync',
      title: 'DigiLocker & ABC Repository Sync',
      category: 'National Integration',
      icon: <Layers className="text-purple-600" size={24} />,
      accentColor: 'from-purple-600 to-pink-600',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80',
      description:
        'Bridge institution ERPs directly with national digital repositories, allowing students to seamlessly transfer credits between universities.',
      highlights: [
        'Two-way API sync with DigiLocker document vault',
        'NEP 2020 multiple entry/exit credit portability',
        'Zero-paper credentials validation',
      ],
      linkText: 'Read Architecture',
      linkUrl: '#how-it-works',
    },
    {
      id: 'ai-anomaly-detection',
      title: 'AI-Powered Anomaly Detection',
      category: 'Intelligent Verification',
      icon: <Cpu className="text-indigo-600" size={24} />,
      accentColor: 'from-indigo-600 to-purple-600',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      description:
        'Machine learning algorithms scan records across institutions to flag phantom admissions, duplicate APAAR requests, and data mismatches.',
      highlights: [
        'Cross-institutional duplicate detection algorithm',
        'Phonetic and typo-tolerant student name matching',
        'Preventative flagging before official accreditation audits',
      ],
      linkText: 'Examine AI Engine',
      linkUrl: '/dashboard',
    },
  ]

  return (
    <section id="features" className="py-20 bg-slate-50/60 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold">
            Institutional Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Comprehensive <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Academic Data Governance</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Eliminating procedural hurdles for college administrators while establishing a single, unforgeable source of truth for student credentials.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item) => (
            <Card
              key={item.id}
              hoverEffect
              className="group relative flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-7 shadow-xs hover:shadow-xl hover:border-blue-200 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* Icon & Category Badge */}
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                    {item.category}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Highlights List */}
                <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  {item.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Link */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                {item.linkUrl.startsWith('#') ? (
                  <a
                    href={item.linkUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-purple-600 transition-colors"
                  >
                    <span>{item.linkText}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link
                    to={item.linkUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-purple-600 transition-colors"
                  >
                    <span>{item.linkText}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
