import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from './Button'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: Array<'student' | 'college_admin' | 'platform_admin'>
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Display clean loader while validating initial session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-500">
            Verifying cryptographic credentials and session...
          </p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to /login and preserve destination
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname,
          message: 'Please sign in to access this protected portal.',
        }}
        replace
      />
    )
  }

  // If role is not allowed for this route, display Access Denied
  if (role && !allowedRoles.includes(role)) {
    const portalNames: Record<string, string> = {
      student: 'Student Portal',
      college_admin: 'College Administrator Portal',
      platform_admin: 'AICTE Platform Admin Portal',
    }

    const correctHome =
      role === 'platform_admin'
        ? '/platform'
        : role === 'college_admin'
        ? '/admin'
        : '/student'

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 shadow-xl text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={30} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account is authenticated as{' '}
            <strong>{portalNames[role] || role}</strong>. You do not have authorization to
            view or modify records in this portal.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-mono">
            Account: {user.email} (Role: {user.role})
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <Link to={correctHome} className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                Go to My Portal ({portalNames[role] || 'Dashboard'})
              </Button>
            </Link>
            <Link to="/login" className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-slate-600"
                leftIcon={<ArrowLeft size={14} />}
              >
                Sign In As Another User
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
