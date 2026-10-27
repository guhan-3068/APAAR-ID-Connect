import React from 'react'
import { 
  GraduationCap, 
  BookOpen, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Vision & National Context */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/80">
              <BookOpen size={14} className="text-blue-600" />
              <span>National Education Policy (NEP 2020) Mandate</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              About the <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">APAAR ID</span> Ecosystem
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              <p>
                The <strong>Automated Permanent Academic Account Registry (APAAR)</strong> is a transformative digital initiative under the Government of India's <em>National Education Policy (NEP 2020)</em> and the Ministry of Education. Often referred to as "EduLocker" or "One Nation, One Student ID", APAAR assigns every enrolled learner a unique, lifelong 12-digit digital identifier.
              </p>
              <p>
                <strong>APAAR CONNECT AI</strong> was conceptualized for the <strong>Smart India Hackathon (SIH)</strong> to solve the critical operational bottleneck faced by AICTE-approved colleges: manually verifying academic credentials, cross-referencing Academic Bank of Credits (ABC), and combating duplicate or fraudulent enrollments.
              </p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                <span>Lifelong Academic ID Portability</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                <span>Direct Academic Bank of Credits Sync</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-600 shrink-0" />
                <span>AICTE Seat Matrix Harmonization</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-600 shrink-0" />
                <span>Zero-Paper Verification Gateways</span>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-4">
              <Link to="/verification">
                <Button
                  variant="primary"
                  rightIcon={<ArrowRight size={15} />}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-md shadow-blue-500/20"
                >
                  Test Verification Prototype
                </Button>
              </Link>
              <a
                href="https://www.aicte-india.org"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
              >
                AICTE Official Website ↗
              </a>
            </div>
          </div>

          {/* Right Column: Mission Card */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-purple-50/60 p-7 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-white text-blue-600 shadow-xs flex items-center justify-center">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Our Mission at SIH
                  </h3>
                  <p className="text-xs text-slate-500">
                    Smart India Hackathon Problem Statement
                  </p>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-700 italic border-l-2 border-blue-600 pl-4 py-1 leading-relaxed">
                "To build a high-performance, privacy-respecting, and AI-assisted data management and verification platform tailored specifically to the operational scale of AICTE-approved technical institutions."
              </blockquote>

              <div className="space-y-3 pt-2 border-t border-slate-200/60 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Beneficiaries:</span>
                  <span className="font-semibold text-slate-800">10,000+ AICTE Institutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Focus Frameworks:</span>
                  <span className="font-semibold text-slate-800">APAAR • ABC • DigiLocker</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Verification Integrity:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck size={14} /> 100% Audit Ready
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
                <Sparkles size={16} className="text-purple-600 shrink-0" />
                <span>
                  Designed for real-world deployment across State Technical Universities and AICTE autonomous colleges.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
