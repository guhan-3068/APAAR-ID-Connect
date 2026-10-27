import React from 'react'
import { Link } from 'react-router-dom'
import { 
  ShieldCheck, 
  ExternalLink, 
  Heart, 
  ArrowUpRight 
} from 'lucide-react'

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const platformLinks = [
    { label: 'Platform Overview', href: '#home' },
    { label: 'Key Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Security & Privacy', href: '#security' },
    { label: 'About APAAR Ecosystem', href: '#about' },
  ]

  const institutionalLinks = [
    { label: 'Platform Apex Administrator', path: '/platform' },
    { label: 'College Administrator Portal', path: '/admin' },
    { label: 'Student Portal Dashboard', path: '/student' },
    { label: 'AI Quality & Anomaly Suite', path: '/platform/quality' },
    { label: 'Live Verification Gateway', path: '/verification' },
    { label: 'Sign In (Login)', path: '/login' },
    { label: 'Register Account', path: '/register' },
  ]

  const nationalFrameworks = [
    { label: 'AICTE Official Portal', url: 'https://www.aicte-india.org' },
    { label: 'Academic Bank of Credits (ABC)', url: 'https://www.abc.gov.in' },
    { label: 'DigiLocker National Depository', url: 'https://www.digilocker.gov.in' },
    { label: 'National Education Policy 2020', url: 'https://www.education.gov.in' },
    { label: 'Smart India Hackathon', url: 'https://www.sih.gov.in' },
  ]

  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info & Mission (Col span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
                <ShieldCheck size={22} className="stroke-[2.2]" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                APAAR <span className="text-blue-400">CONNECT AI</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              An intelligent, privacy-first student data management and verification platform engineered for AICTE-approved institutions under the Smart India Hackathon initiative.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>• Aligned with NEP 2020 One Nation, One Student ID mandate</p>
              <p>• DPDP Act 2023 compliant data governance architecture</p>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional Management Routes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Institutional Portal
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {institutionalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="hover:text-blue-400 transition-colors flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* National Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              National Frameworks
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {nationalFrameworks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    <span>{link.label}</span>
                    <ExternalLink size={11} className="text-slate-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Disclaimer Callout Box */}
        <div className="mt-12 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Disclaimer & Demonstration Notice:</strong> APAAR CONNECT AI is an academic prototype developed for the Smart India Hackathon. All verification records, metrics, and student profiles displayed in this demonstration are simulated for testing, prototype validation, and proof-of-concept purposes.
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} APAAR CONNECT AI. Smart India Hackathon Project.</p>

          <p className="flex items-center gap-1">
            <span>Built with</span>
            <Heart size={14} className="text-rose-500 fill-rose-500 inline" />
            <span>for AICTE-Approved Institutions</span>
          </p>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Security Whitepaper</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
