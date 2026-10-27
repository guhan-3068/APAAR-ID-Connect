import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  RefreshCw,
  Filter,
  X,
  Building2,
  Activity,
} from 'lucide-react'
import { notificationService } from '@/services/appDataService'
import { usePlatformContext } from '@/context/PlatformContext'

type PlatformNotif = {
  id: string
  title: string
  message: string
  date: string
  type: 'critical' | 'warning' | 'info' | 'success'
  read: boolean
  actionUrl?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC PLATFORM NOTIFICATIONS (infrastructure / regulatory events)
// ─────────────────────────────────────────────────────────────────────────────
const initialPlatformNotifs: PlatformNotif[] = [
  {
    id: 'PN-001',
    title: 'Institution Suspended: ERIT (West Bengal)',
    message:
      'Eastern Regional Institute of Technology (AICTE-1-2389012) has been suspended due to repeated ABC credit ledger non-compliance. Manual review required before reinstatement.',
    date: '23 Oct 2026',
    type: 'critical',
    read: false,
    actionUrl: '/platform/institutions',
  },
  {
    id: 'PN-002',
    title: 'Security Alert: High-Volume Query Pattern Detected',
    message:
      'Rate-limiting triggered on an external employer lookup IP subnet (91.203.xxx.xxx). Automated mitigation applied. Monitoring continues.',
    date: '23 Oct 2026',
    type: 'critical',
    read: false,
    actionUrl: '/platform/audit',
  },
  {
    id: 'PN-003',
    title: 'UIDAI Gateway Latency Spike',
    message:
      'UIDAI Aadhaar Demographic Verification Node is degraded (latency 890ms vs. baseline 185ms). Gateway failover is active. Monitoring continued.',
    date: '23 Oct 2026',
    type: 'warning',
    read: false,
    actionUrl: '/platform/monitoring',
  },
  {
    id: 'PN-004',
    title: 'New Institution Onboarding Request: Gujarat Apex Institute',
    message:
      'Gujarat Apex Institute of Engineering (AICTE-1-1192834) submitted onboarding documents for review. Pending approval.',
    date: '22 Oct 2026',
    type: 'info',
    read: false,
    actionUrl: '/platform/institutions',
  },
  {
    id: 'PN-005',
    title: 'National Batch Verification Completed',
    message:
      'Scheduled 24h DigiLocker hash verification cycle for NIET Bengaluru (4,250 students) completed with 99.2% match accuracy.',
    date: '22 Oct 2026',
    type: 'success',
    read: true,
  },
  {
    id: 'PN-006',
    title: 'Compliance Threshold Policy Updated',
    message:
      'Minimum institutional APAAR coverage threshold updated to 85% for Autonomous college AICTE grant eligibility. Change takes effect from next reporting cycle.',
    date: '22 Oct 2026',
    type: 'info',
    read: true,
  },
  {
    id: 'PN-007',
    title: 'Tamil Nadu College of Advanced Technology — Under Review',
    message:
      'TNCAT (AICTE-1-9081234) compliance score dropped to 78%. Placed under review. Registrar notified. 30-day remediation window started.',
    date: '21 Oct 2026',
    type: 'warning',
    read: true,
    actionUrl: '/platform/institutions',
  },
  {
    id: 'PN-008',
    title: 'Kerala Technological Science Academy — 98% Compliance',
    message:
      'KTSA achieved 98% APAAR verification compliance — highest among all registered institutions. No outstanding data quality issues.',
    date: '20 Oct 2026',
    type: 'success',
    read: true,
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// TYPE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const typeConfig = {
  critical: {
    label: 'Critical',
    cls: 'bg-rose-50 text-rose-700 border border-rose-200',
    dot: 'bg-rose-500',
    icon: <ShieldAlert size={16} className="text-rose-600" />,
  },
  warning: {
    label: 'Warning',
    cls: 'bg-amber-50 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    icon: <AlertTriangle size={16} className="text-amber-600" />,
  },
  info: {
    label: 'Information',
    cls: 'bg-blue-50 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    icon: <Info size={16} className="text-blue-600" />,
  },
  success: {
    label: 'Success',
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 size={16} className="text-emerald-600" />,
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export const PlatformNotifications: React.FC = () => {
  const { toast } = usePlatformContext()

  const [notifications, setNotifications] = useState<PlatformNotif[]>(initialPlatformNotifs)
  const [typeFilter, setTypeFilter] = useState<'all' | PlatformNotif['type']>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)

  // Poll for newly dispatched admin notifications from the data service every 3s
  useEffect(() => {
    const sync = () => {
      const serviceNotifs = notificationService.getAdminNotifications()
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const newItems: PlatformNotif[] = serviceNotifs
          .filter((n) => !existingIds.has(n.id))
          .map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: n.date,
            type: n.type === 'security' ? 'critical' : n.type === 'reminder' ? 'warning' : n.type === 'verification' ? 'success' : 'info',
            read: n.read,
          }))
        return newItems.length > 0 ? [...newItems, ...prev] : prev
      })
    }
    const interval = setInterval(sync, 3000)
    return () => clearInterval(interval)
  }, [toast])

  const filtered = notifications.filter((n) => {
    const matchType = typeFilter === 'all' || n.type === typeFilter
    const matchRead = !showUnreadOnly || !n.read
    return matchType && matchRead
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const markRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))

  const handleRefresh = () => {
    setJustRefreshed(true)
    setTimeout(() => setJustRefreshed(false), 1000)
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bell size={18} className="text-indigo-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Platform Notification Centre
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Security alerts, gateway events, institution status changes, and compliance updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <RefreshCw size={13} className={justRefreshed ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Demonstration Banner */}
      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-2 text-xs text-indigo-900">
        <Activity size={14} className="text-indigo-600 shrink-0" />
        <span>
          <strong>Demonstration Notifications:</strong> Platform events, security alerts, and
          institutional updates are synthetic and generated from mock data. In production, these
          would be dispatched by the backend event bus.
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-slate-400" />
        <select
          id="platform-notif-type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="all">All Types</option>
          {(Object.keys(typeConfig) as PlatformNotif['type'][]).map((k) => (
            <option key={k} value={k}>
              {typeConfig[k].label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          Unread only
        </label>
        <span className="text-[11px] text-slate-400 ml-auto">
          {filtered.length} of {notifications.length} notifications
        </span>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Bell size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No notifications match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing the filter or showing all types.</p>
          </div>
        ) : (
          filtered.map((n) => {
            const cfg = typeConfig[n.type]
            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border p-4 flex items-start gap-3.5 transition-all ${
                  !n.read ? 'border-l-4 shadow-xs' : 'border-slate-200'
                } ${
                  !n.read && n.type === 'critical'
                    ? 'border-l-rose-500'
                    : !n.read && n.type === 'warning'
                    ? 'border-l-amber-500'
                    : !n.read && n.type === 'info'
                    ? 'border-l-blue-500'
                    : !n.read && n.type === 'success'
                    ? 'border-l-emerald-500'
                    : ''
                }`}
              >
                {/* Icon */}
                <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      <span
                        className={`mt-0.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400">{n.date}</span>
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{n.message}</p>
                  {n.actionUrl && (
                    <Link
                      to={n.actionUrl}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      <Building2 size={11} /> Take Action
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PlatformNotifications
