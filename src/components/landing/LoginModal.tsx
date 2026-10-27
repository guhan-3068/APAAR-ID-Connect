import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Lock, Building2, User, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [role, setRole] = useState<'admin' | 'officer' | 'student'>('admin')
  const [instCode, setInstCode] = useState('AICTE-1-4928172')
  const [email, setEmail] = useState('registrar@niet.edu.in')
  const [password, setPassword] = useState('••••••••••••')

  if (!isOpen) return null

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
    navigate('/dashboard')
  }

  const fillDemoCredentials = () => {
    setInstCode('AICTE-1-4928172')
    setEmail('registrar@niet.edu.in')
    setPassword('demopassword')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
            <Lock size={22} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Institutional Portal Login
          </h3>
          <p className="text-xs text-slate-500">
            Sign in to access AICTE student records and APAAR verification
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs mb-5">
          <button
            type="button"
            onClick={() => {
              setRole('admin')
              setEmail('registrar@niet.edu.in')
            }}
            className={`py-1.5 font-medium rounded-md transition-all ${
              role === 'admin'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registrar
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('officer')
              setEmail('officer@aicte.gov.in')
            }}
            className={`py-1.5 font-medium rounded-md transition-all ${
              role === 'officer'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AICTE Officer
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('student')
              setEmail('student@niet.edu.in')
            }}
            className={`py-1.5 font-medium rounded-md transition-all ${
              role === 'student'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="AICTE Institution Code"
            value={instCode}
            onChange={(e) => setInstCode(e.target.value)}
            leftIcon={<Building2 size={16} />}
            placeholder="e.g. AICTE-1-4928172"
            required
          />

          <Input
            label="Authorized Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<User size={16} />}
            placeholder="name@institution.edu.in"
            required
          />

          <Input
            label="Password / Security Token"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<KeyRound size={16} />}
            placeholder="Enter password"
            required
          />

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span>Remember institution</span>
            </label>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="text-blue-600 hover:underline font-medium"
            >
              Demo Quick-Fill
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md shadow-blue-500/20 py-2.5 text-sm"
            rightIcon={<ArrowRight size={16} />}
          >
            Authenticate & Open Dashboard
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Protected with 256-bit SSL & AICTE verification layer</span>
        </div>
      </div>
    </div>
  )
}
