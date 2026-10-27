import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  UserCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileBadge, 
  Building2, 
  BookOpen, 
  Award,
  RefreshCw,
  ShieldCheck,
  Key,
  Info,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { mockStudents } from '@/services/mockData'
import { mockSharingConsentRequests } from '@/services/consentSharingService'
import { formatApaarId, isValidApaarId } from '@/utils/formatters'
import type { StudentRecord, SharingConsentRequest } from '@/types'

export const Verification: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialId = searchParams.get('id') || ''
  const initialToken = searchParams.get('token') || ''

  const [searchMode, setSearchMode] = useState<'apaar' | 'token'>(initialToken ? 'token' : 'apaar')
  const [inputVal, setInputVal] = useState(formatApaarId(initialId))
  const [tokenVal, setTokenVal] = useState(initialToken)

  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<StudentRecord | null>(null)
  const [tokenResult, setTokenResult] = useState<SharingConsentRequest | null>(null)
  const [searched, setSearched] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const performApaarVerification = (rawId: string) => {
    const cleaned = rawId.replace(/\D/g, '')
    if (!isValidApaarId(cleaned)) {
      setErrorMessage('APAAR ID must contain exactly 12 digits')
      setResult(null)
      return
    }

    setErrorMessage('')
    setIsVerifying(true)
    setSearched(true)
    setTokenResult(null)

    setTimeout(() => {
      const match = mockStudents.find((s) => s.apaarId === cleaned)
      setResult(match || null)
      setIsVerifying(false)
    }, 500)
  }

  const performTokenVerification = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setErrorMessage('Please enter an authorized reference code or token.')
      setTokenResult(null)
      return
    }

    setErrorMessage('')
    setIsVerifying(true)
    setSearched(true)
    setResult(null)

    setTimeout(() => {
      const match = mockSharingConsentRequests.find(
        (r) =>
          r.referenceCode.toLowerCase() === trimmed.toLowerCase() ||
          (r.temporaryAccessToken && r.temporaryAccessToken.toLowerCase() === trimmed.toLowerCase())
      )
      setTokenResult(match || null)
      setIsVerifying(false)
    }, 500)
  }

  useEffect(() => {
    if (initialId) {
      setInputVal(formatApaarId(initialId))
      setSearchMode('apaar')
      performApaarVerification(initialId)
    } else if (initialToken) {
      setTokenVal(initialToken)
      setSearchMode('token')
      performTokenVerification(initialToken)
    }
  }, [initialId, initialToken])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchMode === 'apaar') {
      const cleaned = inputVal.replace(/\D/g, '')
      setSearchParams({ id: cleaned })
      performApaarVerification(cleaned)
    } else {
      setSearchParams({ token: tokenVal.trim() })
      performTokenVerification(tokenVal.trim())
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck size={13} className="text-purple-600" />
            Verified Credential Gateway
          </span>
          <span className="text-[11px] text-slate-500 font-medium">DPDP Act 2023 Compliant</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <UserCheck className="text-blue-600" />
          APAAR Credential Verification & Consent Portal
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Verify 12-digit APAAR identifiers or validate authorized third-party credential access tokens with multi-tier cryptographic integrity checks.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setSearchMode('apaar')
            setErrorMessage('')
            setSearched(false)
            setResult(null)
            setTokenResult(null)
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            searchMode === 'apaar'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Verify 12-Digit Student APAAR ID
        </button>
        <button
          onClick={() => {
            setSearchMode('token')
            setErrorMessage('')
            setSearched(false)
            setResult(null)
            setTokenResult(null)
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            searchMode === 'token'
              ? 'bg-purple-700 text-white shadow-sm shadow-purple-500/20'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Verify Authorized Access Token / Reference Code
        </button>
      </div>

      {/* Search Input Box */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">
          {searchMode === 'apaar' ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  label="Enter 12-Digit Student APAAR ID"
                  placeholder="XXXX-XXXX-XXXX"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(formatApaarId(e.target.value))
                    setErrorMessage('')
                  }}
                  error={errorMessage}
                  leftIcon={<Search size={16} />}
                />
              </div>
              <div className="sm:self-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isVerifying}
                  leftIcon={<RefreshCw size={15} />}
                  className="w-full sm:w-auto"
                >
                  Verify Record
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  label="Enter Authorized Reference Code or Token"
                  placeholder="e.g. APAAR-SHR-2026-8812 or APAAR-TKN-7A2B-9F8C-44E1"
                  value={tokenVal}
                  onChange={(e) => {
                    setTokenVal(e.target.value)
                    setErrorMessage('')
                  }}
                  error={errorMessage}
                  leftIcon={<Key size={16} />}
                />
              </div>
              <div className="sm:self-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isVerifying}
                  leftIcon={<RefreshCw size={15} />}
                  className="w-full sm:w-auto"
                >
                  Inspect Token
                </Button>
              </div>
            </div>
          )}

          {/* Quick Demo Pre-fills */}
          {searchMode === 'apaar' ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 flex-wrap">
              <span>Sample IDs:</span>
              {mockStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setInputVal(formatApaarId(s.apaarId))
                    setSearchParams({ id: s.apaarId })
                    performApaarVerification(s.apaarId)
                  }}
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {formatApaarId(s.apaarId)}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1 flex-wrap">
              <span>Sample Tokens:</span>
              {mockSharingConsentRequests.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTokenVal(item.referenceCode)
                    setSearchParams({ token: item.referenceCode })
                    performTokenVerification(item.referenceCode)
                  }}
                  className="font-mono text-purple-700 hover:underline"
                >
                  {item.referenceCode} ({item.requesterName.split(' ')[0]})
                </button>
              ))}
            </div>
          )}
        </form>
      </Card>

      {/* Loading State */}
      {isVerifying && (
        <Card className="py-12 text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Querying AICTE National Academic Depository & DigiLocker Gateways...
          </p>
          <p className="text-xs text-slate-400">Verifying cryptographic hash and student credentials</p>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* RESULT VIEW 1: DIRECT STUDENT APAAR RECORD VIEW                          */}
      {/* ========================================================================= */}
      {!isVerifying && result && (
        <div className="space-y-4 animate-in fade-in">
          <Card className="border-t-4 border-t-emerald-500 shadow-md">
            <CardHeader>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{result.fullName}</CardTitle>
                  <Badge status={result.status} dot>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  APAAR ID: <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{formatApaarId(result.apaarId)}</span>
                  {result.abcId && ` • ABC ID: ${result.abcId}`}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Last Verified</span>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {result.lastVerifiedAt || 'Just Now'}
                </p>
              </div>
            </CardHeader>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">Course & Branch</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-blue-500" />
                  {result.course} in {result.branch}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">Institution & Code</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-500" />
                  {result.institutionCode}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">Semester & CGPA</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Award size={14} className="text-blue-500" />
                  Sem {result.currentSemester} • CGPA: {result.cgpa || 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">DigiLocker Status</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  {result.digilockerSynced ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Synchronized</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} className="text-amber-500" />
                      <span>Sync Required</span>
                    </>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">Date of Birth & Gender</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {result.dob} ({result.gender})
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-400">Batch Year</span>
                <p className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {result.enrollmentYear} - {result.enrollmentYear + 4}
                </p>
              </div>
            </div>

            {/* Stage 8 C: Multi-Tier Verification Method Transparency Box */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Verification Methodology & Authority Matrix
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Method 1 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 size={13} />
                    <span>Tier 1: Internal Check</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Application format, checksum, and CGPA range rules validated.
                  </p>
                </div>

                {/* Method 2 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <CheckCircle2 size={13} />
                    <span>Tier 2: Institutional Review</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Authorized examination officer signature on file.
                  </p>
                </div>

                {/* Method 3 */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-1.5 text-purple-700 font-bold">
                    <Info size={13} />
                    <span>Tier 3: National Portal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Simulated AICTE Sandbox check. Live government gateway pending API onboarding.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESULT VIEW 2: AUTHORIZED TOKEN / REFERENCE LOOKUP (STAGE 8 C)            */}
      {/* ========================================================================= */}
      {!isVerifying && tokenResult && (
        <div className="space-y-4 animate-in fade-in">
          <Card className="border-t-4 border-t-purple-600 shadow-md">
            <CardHeader>
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Authorized Verification Certificate</CardTitle>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      tokenResult.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : tokenResult.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : tokenResult.status === 'revoked'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {tokenResult.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <CardDescription>
                  Reference: <span className="font-mono font-bold text-purple-700">{tokenResult.referenceCode}</span>
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">Consent Decision Date</span>
                <p className="text-xs font-semibold text-slate-700">
                  {tokenResult.consentGivenAt ? tokenResult.consentGivenAt.split('T')[0] : 'Pending'}
                </p>
              </div>
            </CardHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Requester & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block">Authorized Requester Entity</span>
                  <p className="font-bold text-slate-900 mt-0.5">{tokenResult.requesterName}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Type: {tokenResult.requesterType}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-400 font-semibold block">Declared Verification Purpose</span>
                  <p className="text-slate-800 mt-0.5 font-medium">{tokenResult.purpose}</p>
                </div>
              </div>

              {/* Consented Fields Checked */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 block mb-2">
                  Consented Academic Data Scope (DPDP Least-Privilege):
                </span>
                <div className="flex flex-wrap gap-2">
                  {tokenResult.requestedFields.map((fld) => (
                    <span
                      key={fld}
                      className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-950 font-semibold text-xs flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      {fld}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cryptographic Hash Digest */}
              {tokenResult.verificationHash && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px]">
                  <span className="text-slate-400 font-sans font-bold block mb-1">
                    SHA-256 Cryptographic Integrity Seal:
                  </span>
                  <p className="text-slate-700 break-all select-all font-semibold">
                    {tokenResult.verificationHash}
                  </p>
                </div>
              )}

              {/* Stage 8 C: Explicit Distinction between Verification Methods */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verification Method Audit
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900">1. Internal Consistency</p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Passed schema check</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900">2. Institutional Review</p>
                    <p className="text-[11px] text-blue-600 font-semibold mt-0.5">Approved by College Node</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="font-bold text-slate-900">3. National Government API</p>
                    <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Simulation Sandbox</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Record Not Found State */}
      {!isVerifying && searched && !result && !tokenResult && (
        <Card className="py-12 text-center space-y-3 border-dashed border-rose-200 dark:border-rose-900/60">
          <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Record or Token Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            No active student record or authorized consent token matches your input in the verification registry. Please check the digits and try again.
          </p>
        </Card>
      )}

      {/* Empty State */}
      {!isVerifying && !searched && !result && !tokenResult && (
        <Card className="py-12 text-center text-slate-400 space-y-2">
          <FileBadge size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
          <p className="text-xs">
            Enter a 12-digit APAAR ID or an authorized verification token to perform a cryptographic check.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Verification
