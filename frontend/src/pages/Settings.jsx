import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useStore'
import { Settings as SettingsIcon, RefreshCw, Cloud, Database, Shield, Clock } from 'lucide-react'
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Platform configuration and Azure sync status</p>
      </div>

      {/* System Status */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-azure-500" /> System Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-surface-400" />
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Database</span>
            </div>
            <p className={`text-sm font-semibold ${health?.database === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {health?.database || 'checking...'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-4 h-4 text-surface-400" />
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Azure Mode</span>
            </div>
            <p className={`text-sm font-semibold ${health?.azure_mode === 'live' ? 'text-azure-600 dark:text-azure-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {health?.azure_mode?.toUpperCase() || 'checking...'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-surface-400" />
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Azure AD</span>
            </div>
            <p className={`text-sm font-semibold ${health?.azure_ad === 'enabled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-500'}`}>
              {health?.azure_ad?.toUpperCase() || 'checking...'}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-surface-400" />
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Sync Schedule</span>
            </div>
            <p className="text-sm font-semibold text-surface-900 dark:text-white">
              {syncStatus?.sync_schedule || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Data Sync */}
      {user?.role === 'admin' && (
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-azure-500" /> Azure Data Sync
          </h3>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">
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
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Run Full Sync Now'}
          </button>

          {syncResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              syncResult.success
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              {syncResult.success ? (
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Sync completed successfully</p>
                  {syncResult.data?.report?.steps && (
                    <pre className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 whitespace-pre-wrap">
                      {JSON.stringify(syncResult.data.report.steps, null, 2)}
                    </pre>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">{syncResult.error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* User Info */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-azure-500" /> Account
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Name', value: user?.full_name },
            { label: 'Email', value: user?.email },
            { label: 'Role', value: user?.role },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
              <span className="text-sm font-medium text-surface-900 dark:text-white capitalize">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
