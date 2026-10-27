import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bell, 
  CheckCheck, 
  FileCheck2, 
  AlertCircle, 
  Layers, 
  ShieldAlert, 
  Calendar, 
  ArrowRight,
  Info,
  Check
} from 'lucide-react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useStudent } from '@/context/StudentContext'
import type { NotificationItem } from '@/types'

export const StudentNotifications: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount: unreadCount,
    markNotificationRead: handleMarkAsRead,
    markAllNotificationsRead: handleMarkAllAsRead,
  } = useStudent()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read
    return true
  })

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'verification':
        return <FileCheck2 size={18} className="text-emerald-600" />
      case 'reminder':
        return <AlertCircle size={18} className="text-amber-600" />
      case 'update':
        return <Layers size={18} className="text-blue-600" />
      case 'security':
        return <ShieldAlert size={18} className="text-purple-600" />
      default:
        return <Bell size={18} className="text-slate-600" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Synthetic Demonstration Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between text-xs text-purple-900">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-purple-600 shrink-0" />
          <span>
            <strong>Demonstration Notifications:</strong> Synthetic alert events generated to simulate real-time registrar updates, DigiLocker syncs, and verification deadlines.
          </span>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="text-blue-600" />
            Notification Centre
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates, missing document reminders, and ABC credit sync notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAllAsRead}
              leftIcon={<CheckCheck size={15} />}
            >
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            filter === 'unread'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={`p-4 transition-all duration-200 border ${
                !notif.read
                  ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {notif.title}
                      </h3>
                      {!notif.read && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-4 pt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {notif.date}
                      </span>
                      {notif.actionUrl && (
                        <Link
                          to={notif.actionUrl}
                          className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Take Action</span>
                          <ArrowRight size={11} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!notif.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="text-slate-400 hover:text-blue-600 p-1.5"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-12 text-center text-slate-400 text-xs">
            <Bell size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No notifications to display</p>
            <p className="text-slate-400 mt-0.5">
              {filter === 'unread' ? 'You have read all your notifications.' : 'Your notification inbox is currently clear.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
