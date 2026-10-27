import React, { useState } from 'react'
import {
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { usePlatformContext } from '@/context/PlatformContext'

export const PlatformMonitoring: React.FC = () => {
  const { monitoringServices, institutions } = usePlatformContext()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now')

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All Core Nodes Operational
            </span>
            <span className="text-[11px] text-slate-500 font-medium">99.98% 30-Day Platform SLA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Platform Infrastructure & Gateway Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status of federated national gateways, API throughput, response latencies, and service health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Synced: {lastRefreshed}</span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Core Microservice Health Cards */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Server size={14} /> National Integration Nodes & Microservices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {monitoringServices.map((service) => (
            <div
              key={service.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{service.serviceName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{service.endpoint}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    service.status === 'healthy'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : service.status === 'degraded'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      service.status === 'healthy' ? 'bg-emerald-500' : service.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                  {service.status.toUpperCase()}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Latency</span>
                  <span className="text-xs font-extrabold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
                    <Zap size={11} className="text-amber-500" /> {service.latencyMs} ms
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Uptime</span>
                  <span className="text-xs font-extrabold text-emerald-700 block mt-0.5">
                    {service.uptimePercent}%
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>Last Incident: {service.lastIncident ?? 'None'}</span>
                <span className="font-semibold text-slate-500">AICTE Core V2</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latency and System Load Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Request Volume & Latency Trend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Real-time Gateway Latency Trends (24h)</h3>
              <p className="text-[11px] text-slate-500">Hourly response times across UIDAI, DigiLocker & ABC</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
              Avg: 48.2 ms
            </span>
          </div>

          <div className="mt-6 h-44 flex items-end justify-between gap-2 pt-2">
            {[
              { time: '00:00', ms: 42, height: '35%' },
              { time: '03:00', ms: 38, height: '30%' },
              { time: '06:00', ms: 40, height: '32%' },
              { time: '09:00', ms: 78, height: '65%' },
              { time: '12:00', ms: 92, height: '80%' },
              { time: '15:00', ms: 84, height: '72%' },
              { time: '18:00', ms: 65, height: '55%' },
              { time: '21:00', ms: 52, height: '45%' },
            ].map((pt) => (
              <div key={pt.time} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[36px] bg-slate-100 hover:bg-purple-100 rounded-t-lg relative flex items-end justify-center transition-all">
                  <div
                    style={{ height: pt.height }}
                    className="w-full bg-gradient-to-t from-purple-700 to-indigo-500 rounded-t-lg transition-all"
                  />
                  <span className="absolute -top-7 hidden group-hover:flex bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                    {pt.ms} ms
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{pt.time}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-600" /> Peak Traffic: 12:00 - 15:00 IST
            </span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={13} /> Zero gateway timeouts in trailing 72 hours
            </span>
          </div>
        </div>

        {/* Error & Warning Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Error & Warning Triage</h3>
                <p className="text-[11px] text-slate-500">System warnings flagged across nodes</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                1 Warning
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-amber-600" />
                    UIDAI e-KYC Timeout Spike
                  </span>
                  <span className="text-[10px] font-mono text-amber-700">14:22 IST</span>
                </div>
                <p className="text-[11px] text-amber-800 mt-1">
                  12 e-KYC handshakes exceeded 500ms threshold during peak server load. Fallback cached tokens engaged.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    DigiLocker Doc Sync
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Resolved</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Batch verification sync completed successfully across 1,840 pending certificates.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Automated alerts dispatched to AICTE Nodal DevOps Team.
          </div>
        </div>
      </div>

      {/* Institution-Level Performance Indicators */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Institutional Verification Performance & Quality Index</h3>
            <p className="text-[11px] text-slate-500">
              Throughput and record quality ranking of onboarded institutions
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">Live AICTE Metrics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {institutions.slice(0, 3).map((inst) => {
            const completionRate = Math.round((inst.verifiedCount / (inst.totalEnrolled || 1)) * 100)
            return (
              <div key={inst.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{inst.name}</h4>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 shrink-0">
                    {inst.naacAccreditation}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{inst.aicteCode}</p>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                    <span className="text-slate-500">Verification Throughput</span>
                    <span className="font-bold text-slate-900">{completionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${completionRate}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                  <span>Enrolled: {inst.totalEnrolled.toLocaleString()}</span>
                  <span>Verified: {inst.verifiedCount.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PlatformMonitoring
