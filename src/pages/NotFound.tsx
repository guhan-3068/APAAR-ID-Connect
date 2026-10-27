import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, Home } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center py-10 px-6 space-y-4">
        <div className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">404</h1>
        <h2 className="text-base font-medium text-slate-700 dark:text-slate-300">
          Page Not Found
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested verification route or resource does not exist in the APAAR Connect portal.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" leftIcon={<Home size={16} />}>
              Return to Portal Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
