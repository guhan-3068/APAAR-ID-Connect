import React, { useState } from 'react'
import { 
  Settings, 
  KeyRound, 
  CheckCircle2, 
  Lock, 
  Eye, 
  EyeOff, 
  Info
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

export const StudentSettings: React.FC = () => {
  // Notification Preferences State
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [smsAlerts, setSmsAlerts] = useState(true)
  const [creditAlerts, setCreditAlerts] = useState(true)

  // Consent Management State
  const [consentDigiLocker, setConsentDigiLocker] = useState(true)
  const [consentAbcShare, setConsentAbcShare] = useState(true)
  const [consentAicteAudit, setConsentAicteAudit] = useState(true)

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Save Settings State
  const [settingsSaved, setSettingsSaved] = useState(false)

  const handleSavePreferences = () => {
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 4000)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccess(null)
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError('Please enter your current security password.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setIsUpdatingPassword(true)

    // Simulate password update
    setTimeout(() => {
      setIsUpdatingPassword(false)
      setPasswordSuccess('Password simulated as updated in this demonstration session! (No credentials stored)')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(null), 5000)
    }, 700)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Synthetic Demonstration Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Demonstration Settings Portal:</strong> Notification delivery preferences and DPDP consent settings operate in client demonstration state.
          </span>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="text-blue-600" />
          Account & Security Settings
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Manage your notifications, DPDP consent preferences, and authentication security
        </p>
      </div>

      {settingsSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Your notification and consent preferences have been updated for this session.</span>
        </div>
      )}

      {/* 1. Notification Preferences */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Notification & Alert Preferences</CardTitle>
            <CardDescription>Choose how you receive verification updates and registrar reminders</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-1 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <div>
              <p className="font-bold text-slate-900">Email Notifications</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Receive verification approvals, marksheet seals, and official notices</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <div>
              <p className="font-bold text-slate-900">SMS Verification Alerts</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Instant OTP notifications and critical fraud prevention alerts on registered mobile</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <div>
              <p className="font-bold text-slate-900">Academic Bank of Credits (ABC) Sync Alerts</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Get notified when new credits are credited to your national ABC account ledger</p>
            </div>
            <input
              type="checkbox"
              checked={creditAlerts}
              onChange={(e) => setCreditAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSavePreferences}
            >
              Save Alert Preferences
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Consent & DPDP Act Privacy Management */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>DPDP Act Data Sharing & Depository Consent</CardTitle>
            <CardDescription>Manage authorized access to your academic records under Digital Personal Data Protection Act 2023</CardDescription>
          </div>
        </CardHeader>

        <div className="space-y-4 pt-1 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <div>
              <p className="font-bold text-slate-900">DigiLocker NAD Synchronization</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Authorizes automated cross-verification with your DigiLocker identity repository</p>
            </div>
            <input
              type="checkbox"
              checked={consentDigiLocker}
              onChange={(e) => setConsentDigiLocker(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <div>
              <p className="font-bold text-slate-900">Academic Bank of Credits (ABC) Credit Sharing</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Permits automated credit transfer between universities during inter-college migration</p>
            </div>
            <input
              type="checkbox"
              checked={consentAbcShare}
              onChange={(e) => setConsentAbcShare(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 cursor-pointer transition-colors">
            <div>
              <p className="font-bold text-slate-900">AICTE Sanctioned Seat Compliance Audit</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Allows institutional registrar to include your APAAR record in statutory AICTE accreditation audits</p>
            </div>
            <input
              type="checkbox"
              checked={consentAicteAudit}
              onChange={(e) => setConsentAicteAudit(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSavePreferences}
            >
              Update Consent Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Password Security */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your portal access credentials (client-side demonstration)</CardDescription>
          </div>
        </CardHeader>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <Info size={16} className="text-rose-600 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type={showPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<Lock size={15} />}
            placeholder="Enter current password"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="New Password (min 8 chars)"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock size={15} />}
              placeholder="Enter new password"
              required
            />

            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={15} />}
              placeholder="Re-enter new password"
              required
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPassword ? 'Hide Passwords' : 'Show Passwords'}</span>
            </button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdatingPassword}
              leftIcon={<KeyRound size={15} />}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
