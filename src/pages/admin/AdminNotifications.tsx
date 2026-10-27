import React, { useState } from 'react'
import { Bell, CheckCircle2, X, Filter } from 'lucide-react'
import { useAdmin } from '@/context/AdminContext'
import type { AdminNotification } from '@/context/AdminContext'

type NotifType = AdminNotification['type']

const typeConfig: Record<NotifType, { label: string; cls: string; dot: string }> = {
  verification: { label: 'Verification', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  update: { label: 'Update', cls: 'bg-blue-50 text-blue-700 border border-blue-200', dot: 'bg-blue-500' },
  security: { label: 'Security Alert', cls: 'bg-rose-50 text-rose-700 border border-rose-200', dot: 'bg-rose-500' },
  reminder: { label: 'Reminder', cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
}

export const AdminNotifications: React.FC = () => {
  const {
    notifications,
    markNotificationRead: markRead,
    markAllNotificationsRead: markAllRead,
    unreadNotificationsCount: unreadCount,
  } = useAdmin()
  const [typeFilter, setTypeFilter] = useState<'all' | NotifType>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  const filtered = notifications.filter((n) => {
    const matchesType = typeFilter === 'all' || n.type === typeFilter
    const matchesRead = !showUnreadOnly || !n.read
    return matchesType && matchesRead
  })

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bell size={18} className="text-blue-600" /> Notification Centre
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
          >
            <CheckCircle2 size={14} /> Mark all as read
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-slate-400" />
        <select
          id="notif-type-filter"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="all">All Types</option>
          {Object.entries(typeConfig).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
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
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
            No notifications match the current filters.
          </div>
        ) : (
          filtered.map((n) => {
            const cfg = typeConfig[n.type]
            return (
              <div
                key={n.id}
                className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3 transition-all ${!n.read ? 'border-l-4 border-l-blue-500 shadow-xs' : ''}`}
              >
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.read ? 'bg-slate-200' : cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      <span className={`mt-0.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400">{n.date}</span>
                      {!n.read && (
                        <button
                          onClick={() => markRead(n.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{n.message}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
