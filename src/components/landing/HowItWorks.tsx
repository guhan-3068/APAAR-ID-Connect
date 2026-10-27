import React from 'react'
import { 
  UploadCloud, 
  Cpu, 
  FileCheck2, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Institutional Ingestion & APAAR Seeding',
      subtitle: 'Seamless Record Ingestion',
      icon: <UploadCloud size={26} className="text-blue-600" />,
      accentGradient: 'from-blue-600 to-indigo-600',
      description:
        'Institutions connect via secure API or batch-upload enrolled student cohorts. Candidates provide authorized consent to seed or generate their 12-digit APAAR ID.',
      keyFeatures: [
        'Secure ERP connector & batch CSV processing',
        'DigiLocker & Aadhaar e-KYC consent flow',
        'Automatic deduplication against AICTE seat limits',
      ],
    },
    {
      step: '02',
      title: 'Multi-Point Automated Verification',
      subtitle: 'Real-Time Cross Validation',
      icon: <Cpu size={26} className="text-indigo-600" />,
      accentGradient: 'from-indigo-600 to-purple-600',
      description:
        'The platform performs cryptographic checks against National Academic Depository (NAD), DigiLocker repositories, and Academic Bank of Credits (ABC) in sub-seconds.',
      keyFeatures: [
        'Real-time cryptographic hash verification',
        'Academic credit ledger synchronization',
        'Automated discrepancy & anomaly detection',
      ],
    },
    {
      step: '03',
      title: 'AICTE Compliance & Credential Issuance',
      subtitle: 'Certified Academic Integrity',
      icon: <FileCheck2 size={26} className="text-purple-600" />,
      accentGradient: 'from-purple-600 to-pink-600',
      description:
        'Institutions receive tamper-evident verification badges. Real-time compliance dashboards satisfy AICTE audit guidelines and enable seamless credit transfers.',
      keyFeatures: [
        'Verifiable digital credential generation',
        'Instant AICTE compliance status reporting',
        'Portability for higher education & internships',
      ],
    },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200/80">
            Three-Step Architectural Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">APAAR CONNECT AI</span> Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A frictionless, end-to-end pipeline transitioning institutions from paper-intensive manual verifications to instant digital trust.
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-7 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
            >
              {/* Step Number Top Badge */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-3xl font-black bg-gradient-to-br from-slate-200 to-slate-400 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                  {item.step}
                </span>
                <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
              </div>

              {/* Title & Details */}
              <div className="space-y-3">
                <span className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">
                  {item.subtitle}
                </span>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {item.keyFeatures.map((kf, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{kf}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow Connector on desktop between cards */}
              {index < 2 && (
                <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ArrowRight size={20} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Banner callout */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/80 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white shadow-xs text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Ready to automate verification for your institution?
              </p>
              <p className="text-xs text-slate-500">
                AICTE colleges can complete onboarding and system integration in under 15 minutes.
              </p>
            </div>
          </div>
          <a
            href="#security"
            className="shrink-0 text-xs font-semibold text-blue-600 hover:text-purple-600 flex items-center gap-1.5 transition-colors"
          >
            <span>Learn About Security & Consent Protocols</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}
