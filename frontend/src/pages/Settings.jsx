import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useStore'
import { Settings as SettingsIcon, RefreshCw, Cloud, Database, Shield, Clock, User, CheckCircle, XCircle } from 'lucide-react'
import api from '../lib/api'

export default function Settings() {
  const { user } = useAuthStore()
  const [syncStatus, setSyncStatus] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [health, setHealth] = useState(null)

  useEffect(() => { loadStatus() }, [])

  const loadStatus = async () => {
    try {
      const [statusRes, healthRes] = await Promise.all([
        api.get('/sync/status'),
        api.get('/health'),
      ])
      setSyncStatus(statusRes.data)
      setHealth(healthRes.data)
    } catch (err) {
      console.error('Failed to load status:', err)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await api.post('/sync')
      setSyncResult({ success: true, data: res.data })
    } catch (err) {
      setSyncResult({ success: false, error: err.response?.data?.error || err.message })
    } finally {
      setSyncing(false)
    }
  }

  const getStatusDotClass = (status, expected) => {
    if (!status) return 'status-dot'
    if (status === expected) return 'status-dot status-dot-active'
    return 'status-dot status-dot-warning'
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div className="page-header flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-blue flex-shrink-0">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Platform configuration and Azure sync status</p>
        </div>
      </div>

      {/* System Status */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '0ms' }}>
        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <Cloud className="w-4.5 h-4.5 text-white" />
          </div>
          System Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Database</span>
              </div>
              <div className={getStatusDotClass(health?.database, 'connected')} />
            </div>
            <p className={`text-sm font-semibold mt-1 capitalize ${health?.database === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {health?.database || 'checking...'}
            </p>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-azure-100 dark:bg-azure-900/30 flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-azure-600 dark:text-azure-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Azure Mode</span>
              </div>
              <div className={health?.azure_mode === 'live' ? 'status-dot status-dot-active' : 'status-dot status-dot-warning'} />
            </div>
            <p className={`text-sm font-semibold mt-1 ${health?.azure_mode === 'live' ? 'text-azure-600 dark:text-azure-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {health?.azure_mode?.toUpperCase() || 'checking...'}
            </p>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Azure AD</span>
              </div>
              <div className={health?.azure_ad === 'enabled' ? 'status-dot status-dot-active' : 'status-dot'} />
            </div>
            <p className={`text-sm font-semibold mt-1 ${health?.azure_ad === 'enabled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-500'}`}>
              {health?.azure_ad?.toUpperCase() || 'checking...'}
            </p>
          </div>
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Sync Schedule</span>
              </div>
            </div>
            <p className="text-sm font-semibold mt-1 text-surface-900 dark:text-white">
              {syncStatus?.sync_schedule || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-surface-200 dark:border-surface-800" />

      {/* Data Sync */}
      {user?.role === 'admin' && (
        <>
          <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
                <RefreshCw className="w-4.5 h-4.5 text-white" />
              </div>
              Azure Data Sync
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-5">
              Trigger a manual sync to pull the latest cost data, resources, metrics, and recommendations from Azure.
              {syncStatus?.azure_live === false && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-medium">
                  Azure is in MOCK mode. Set AZURE_USE_MOCK=false in backend .env and provide Azure credentials to enable live sync.
                </span>
              )}
            </p>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 shadow-glow-blue"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Run Full Sync Now'}
            </button>

            {syncResult && (
              <div className={`mt-5 glass-card-elevated p-5 ${
                syncResult.success
                  ? 'border-l-4 border-l-emerald-500'
                  : 'border-l-4 border-l-red-500'
              }`}>
                {syncResult.success ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Sync completed successfully</p>
                    </div>
                    {syncResult.data?.report?.steps && (
                      <pre className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3">
                        {JSON.stringify(syncResult.data.report.steps, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{syncResult.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-surface-200 dark:border-surface-800" />
        </>
      )}

      {/* User Info */}
      <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-white" />
          </div>
          Account
        </h3>
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-surface-100 dark:border-surface-800">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-glow-blue">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold text-surface-900 dark:text-white">{user?.full_name || 'User'}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-surface-500 dark:text-surface-400">{user?.email}</span>
              <span className={`badge text-xs ${
                user?.role === 'admin' ? 'badge-critical' : user?.role === 'manager' ? 'badge-medium' : 'badge-low'
              }`}>{user?.role}</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Full Name', value: user?.full_name },
            { label: 'Email Address', value: user?.email },
            { label: 'Account Role', value: user?.role },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5 border-b border-surface-100 dark:border-surface-800 last:border-b-0">
              <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
              <span className="text-sm font-medium text-surface-900 dark:text-white capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
