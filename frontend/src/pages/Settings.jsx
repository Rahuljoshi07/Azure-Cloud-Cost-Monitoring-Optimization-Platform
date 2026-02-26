import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useStore'
import { Settings as SettingsIcon, RefreshCw, Cloud, Database, Shield, Clock, User, CheckCircle, XCircle, DollarSign, Server, Activity, Lightbulb, Layers, AlertTriangle, BarChart3, Zap } from 'lucide-react'
import api from '../lib/api'

const AZURE_SERVICES = [
  {
    name: 'Azure Cost Management API',
    icon: DollarSign,
    color: 'brand',
    desc: 'Fetches cost and billing data, usage metrics and spending details',
    statusKey: null,
    defaultStatus: 'Connected',
  },
  {
    name: 'Azure Resource Graph',
    icon: Server,
    color: 'cyan',
    desc: 'Queries Azure resources, identifies unused or underutilized resources',
    statusKey: null,
    defaultStatus: 'Connected',
  },
  {
    name: 'Azure Monitor',
    icon: Activity,
    color: 'purple',
    desc: 'Collects performance metrics, detects anomalies and usage patterns',
    statusKey: null,
    defaultStatus: 'Connected',
  },
  {
    name: 'Azure Active Directory',
    icon: Shield,
    color: 'amber',
    desc: 'Handles authentication and user identity, secures platform access',
    statusKey: 'azure_ad',
    defaultStatus: null,
  },
  {
    name: 'Azure Advisor',
    icon: Lightbulb,
    color: 'emerald',
    desc: 'Provides optimization recommendations across cost, security, reliability',
    statusKey: null,
    defaultStatus: 'Connected',
  },
  {
    name: 'Azure Subscriptions',
    icon: Layers,
    color: 'rose',
    desc: 'Manages multi-subscription monitoring with budget tracking',
    statusKey: null,
    defaultStatus: 'Connected',
  },
]

const SYNC_PIPELINE = [
  { name: 'Cost Data Refresh', icon: DollarSign },
  { name: 'Metrics Collection', icon: BarChart3 },
  { name: 'Budget Recalculation', icon: Activity },
  { name: 'Anomaly Detection', icon: AlertTriangle },
  { name: 'Alert Processing', icon: Zap },
]

const COLOR_MAP = {
  brand: {
    iconBg: 'bg-brand-100 dark:bg-brand-900/30',
    iconText: 'text-brand-600 dark:text-brand-400',
    badge: 'badge-brand',
    shadow: 'shadow-neon-brand',
  },
  cyan: {
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconText: 'text-cyan-600 dark:text-cyan-400',
    badge: 'badge-low',
    shadow: 'shadow-neon-cyan',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconText: 'text-purple-600 dark:text-purple-400',
    badge: 'badge-high',
    shadow: 'shadow-neon-brand',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    badge: 'badge-medium',
    shadow: 'shadow-neon-amber',
  },
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    badge: 'badge-low',
    shadow: 'shadow-neon-emerald',
  },
  rose: {
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconText: 'text-rose-600 dark:text-rose-400',
    badge: 'badge-critical',
    shadow: 'shadow-neon-rose',
  },
}

export default function Settings() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('services')
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
    if (!status) return 'dot'
    if (status === expected) return 'dot dot-active'
    return 'dot dot-warning'
  }

  const getServiceStatus = (service) => {
    if (service.statusKey && health) {
      const val = health[service.statusKey]
      if (val === 'enabled' || val === 'connected') return 'Connected'
      if (val === 'disabled') return 'Disabled'
      return val || 'Checking...'
    }
    return service.defaultStatus || 'Connected'
  }

  const getServiceDotClass = (service) => {
    const status = getServiceStatus(service)
    if (status === 'Connected' || status === 'enabled') return 'dot dot-active'
    if (status === 'Disabled') return 'dot dot-error'
    if (status === 'Checking...') return 'dot dot-warning'
    return 'dot dot-active'
  }

  const tabs = [
    { id: 'services', label: 'Azure Services', icon: Cloud },
    { id: 'sync', label: 'Data Sync', icon: RefreshCw },
    { id: 'account', label: 'Account', icon: User },
  ]

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="page-header flex items-start gap-4 animate-enter">
        <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shadow-neon-brand flex-shrink-0">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle">Azure cloud services dashboard, data sync, and account management</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar animate-enter stagger-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Azure Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-8">
          {/* Azure Cloud Services Grid */}
          <div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 flex items-center gap-3 animate-enter stagger-1">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shadow-neon-brand">
                <Cloud className="w-4.5 h-4.5 text-white" />
              </div>
              Azure Cloud Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AZURE_SERVICES.map((service, idx) => {
                const Icon = service.icon
                const colors = COLOR_MAP[service.color]
                const status = getServiceStatus(service)
                const isActive = status === 'Connected' || status === 'enabled'
                const staggerClass = `stagger-${Math.min(idx + 1, 6)}`

                return (
                  <div
                    key={service.name}
                    className={`card card-glass card-hover p-5 animate-enter ${staggerClass} relative`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${colors.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${colors.iconText}`} />
                      </div>
                      <div className={getServiceDotClass(service)} />
                    </div>
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-1.5">
                      {service.name}
                    </h4>
                    <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed mb-3">
                      {service.desc}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`badge text-xs ${isActive ? 'badge-low' : 'badge-critical'}`}>
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                      <span className="text-xs text-surface-400 dark:text-surface-500">
                        {status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* System Status Section */}
          <div className="animate-enter stagger-3">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-brand-subtle flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              System Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="metric-card metric-card-emerald">
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
              <div className="metric-card metric-card-brand">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                      <Cloud className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    </div>
                    <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Azure Mode</span>
                  </div>
                  <div className={health?.azure_mode === 'live' ? 'dot dot-active' : 'dot dot-warning'} />
                </div>
                <p className={`text-sm font-semibold mt-1 ${health?.azure_mode === 'live' ? 'text-brand-600 dark:text-brand-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {health?.azure_mode?.toUpperCase() || 'checking...'}
                </p>
              </div>
              <div className="metric-card metric-card-purple">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Azure AD</span>
                  </div>
                  <div className={health?.azure_ad === 'enabled' ? 'dot dot-active' : 'dot'} />
                </div>
                <p className={`text-sm font-semibold mt-1 ${health?.azure_ad === 'enabled' ? 'text-emerald-600 dark:text-emerald-400' : 'text-surface-500'}`}>
                  {health?.azure_ad?.toUpperCase() || 'checking...'}
                </p>
              </div>
              <div className="metric-card metric-card-amber">
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
        </div>
      )}

      {/* Data Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="card card-glass p-6 animate-enter stagger-1">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shadow-neon-brand">
                <RefreshCw className="w-4.5 h-4.5 text-white" />
              </div>
              Azure Data Sync
            </h3>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">
              Trigger a manual sync to pull the latest cost data, resources, metrics, and recommendations from Azure.
            </p>
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mb-5">
              Demo mode is active. Sync generates fresh cost data, runs anomaly detection, and checks budget thresholds.
            </p>

            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn-brand flex items-center gap-2 disabled:opacity-50 shadow-neon-brand"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Run Full Sync Now'}
            </button>

            {syncResult && (
              <div className={`mt-5 card-elevated card-glass p-5 ${
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

          {/* Sync Pipeline */}
          <div className="animate-enter stagger-2">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gradient-brand-subtle flex items-center justify-center">
                <Zap className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
              </div>
              Sync Pipeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SYNC_PIPELINE.map((step, idx) => {
                const Icon = step.icon
                const staggerClass = `stagger-${Math.min(idx + 1, 6)}`
                return (
                  <div
                    key={step.name}
                    className={`card card-glass p-4 text-center animate-enter ${staggerClass} relative`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <p className="text-xs font-semibold text-surface-900 dark:text-white leading-tight">
                      {step.name}
                    </p>
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 mt-1 block">
                      Step {idx + 1}
                    </span>
                    {idx < SYNC_PIPELINE.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 text-surface-300 dark:text-navy-600 z-10">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="card card-glass p-6 animate-enter stagger-1">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center shadow-neon-brand">
              <User className="w-4.5 h-4.5 text-white" />
            </div>
            Account
          </h3>
          <div className="flex items-center gap-4 mb-6 pb-5 border-b border-surface-100 dark:border-navy-800">
            <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center text-white text-xl font-bold shadow-neon-brand">
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
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-surface-100 dark:border-navy-800 last:border-b-0">
                <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
                <span className="text-sm font-medium text-surface-900 dark:text-white capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
