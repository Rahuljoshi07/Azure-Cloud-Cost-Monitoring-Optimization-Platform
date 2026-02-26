import { useState, useEffect } from 'react'
import { alertAPI, budgetAPI } from '../lib/api'
import {
  Bell, AlertTriangle, Shield, Wallet, Plus, Check, Eye, X,
  TrendingUp, Info, AlertCircle, CheckCircle2
} from 'lucide-react'

function formatCurrency(v) { return `$${Number(v).toLocaleString()}` }

function SeverityBadge({ severity }) {
  const styles = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low'
  }
  const icons = {
    critical: AlertCircle,
    high: AlertTriangle,
    medium: Info,
    low: CheckCircle2
  }
  const Icon = icons[severity] || Info
  return (
    <span className={`badge ${styles[severity] || styles.medium} gap-1`}>
      <Icon className="w-3 h-3" /> {severity}
    </span>
  )
}

function TypeBadge({ type }) {
  const colors = {
    budget: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    anomaly: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    recommendation: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    system: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
  }
  return <span className={`badge ${colors[type] || colors.system}`}>{type}</span>
}

/* --- Enhancement #4: Circular percentage indicator for budget cards --- */
function CircularProgress({ percent, isOver, isWarning, size = 48, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedPct = Math.min(percent, 100)
  const offset = circumference - (clampedPct / 100) * circumference
  const strokeColor = isOver
    ? 'stroke-red-500'
    : isWarning
      ? 'stroke-amber-500'
      : 'stroke-emerald-500'
  const glowColor = isOver
    ? 'drop-shadow(0 0 4px rgba(239,68,68,0.5))'
    : isWarning
      ? 'drop-shadow(0 0 4px rgba(245,158,11,0.5))'
      : 'drop-shadow(0 0 4px rgba(16,185,129,0.5))'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ filter: glowColor }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          className="stroke-surface-200 dark:stroke-surface-700"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={`${strokeColor} transition-all duration-1000`}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      <span className="absolute text-[10px] font-extrabold text-surface-700 dark:text-surface-200">
        {percent.toFixed(0)}%
      </span>
    </div>
  )
}

export default function AlertsBudgets() {
  const [tab, setTab] = useState('alerts')
  const [alerts, setAlerts] = useState([])
  const [alertStats, setAlertStats] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertFilter, setAlertFilter] = useState({ type: '', severity: '' })
  const [showNewBudget, setShowNewBudget] = useState(false)
  const [newBudget, setNewBudget] = useState({ name: '', amount: '', period: 'monthly' })

  useEffect(() => { loadData() }, [tab, alertFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'alerts') {
        const [alertRes, statsRes] = await Promise.all([
          alertAPI.getAll(alertFilter),
          alertAPI.getStats()
        ])
        setAlerts(alertRes.data.alerts)
        setAlertStats(statsRes.data)
      } else {
        const res = await budgetAPI.getAll()
        setBudgets(res.data)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try { await alertAPI.markRead(id); loadData() } catch {}
  }

  const handleResolve = async (id) => {
    try { await alertAPI.resolve(id); loadData() } catch {}
  }

  const handleMarkAllRead = async () => {
    try { await alertAPI.markAllRead(); loadData() } catch {}
  }

  const handleCreateBudget = async (e) => {
    e.preventDefault()
    try {
      await budgetAPI.create({ ...newBudget, amount: parseFloat(newBudget.amount) })
      setShowNewBudget(false)
      setNewBudget({ name: '', amount: '', period: 'monthly' })
      loadData()
    } catch (err) {
      console.error('Failed to create budget:', err)
    }
  }

  /* --- Enhancement #5: severity-based left-border color mapping --- */
  const severityBorderColor = (severity) => {
    const map = {
      critical: 'border-l-red-500',
      high: 'border-l-orange-500',
      medium: 'border-l-amber-500',
      low: 'border-l-emerald-500'
    }
    return map[severity] || 'border-l-azure-500'
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Alerts & Budgets</h1>
        <p className="page-subtitle">Manage cost alerts and budget thresholds</p>
      </div>

      {/* Enhancement #1: Polished tab bar */}
      <div className="flex gap-1 p-1.5 bg-surface-100 dark:bg-surface-800/80 rounded-xl w-fit backdrop-blur-sm border border-surface-200/50 dark:border-surface-700/50">
        {[
          { id: 'alerts', label: 'Alerts', icon: Bell },
          { id: 'budgets', label: 'Budgets', icon: Wallet }
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === id
                ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm ring-1 ring-surface-200/60 dark:ring-surface-600/60'
                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-200/40 dark:hover:bg-surface-700/40'
            }`}>
            <Icon className={`w-4 h-4 ${tab === id ? 'text-azure-600 dark:text-azure-400' : ''}`} /> {label}
          </button>
        ))}
      </div>

      {tab === 'alerts' && (
        <>
          {/* Enhancement #2 & #3: Alert Stats with colored icon badges and stagger animations */}
          {alertStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Critical', value: alertStats.critical, color: 'red', icon: AlertCircle,
                  iconBg: 'bg-red-100 dark:bg-red-900/30', iconText: 'text-red-600 dark:text-red-400' },
                { label: 'High', value: alertStats.high, color: 'orange', icon: AlertTriangle,
                  iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconText: 'text-orange-600 dark:text-orange-400' },
                { label: 'Medium', value: alertStats.medium, color: 'amber', icon: Info,
                  iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' },
                { label: 'Unread', value: alertStats.unread, color: 'azure', icon: Bell,
                  iconBg: 'bg-azure-100 dark:bg-azure-900/30', iconText: 'text-azure-600 dark:text-azure-400' }
              ].map((stat, i) => {
                const StatIcon = stat.icon
                return (
                  <div key={i}
                    className="glass-card p-4 animate-slide-up"
                    style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">{stat.label}</p>
                      {/* Enhancement #2: Colored icon badge */}
                      <div className={`${stat.iconBg} rounded-xl p-2`}>
                        <StatIcon className={`w-4 h-4 ${stat.iconText}`} />
                      </div>
                    </div>
                    {/* Enhancement #9: font-extrabold for large numbers */}
                    <p className={`text-2xl font-extrabold ${
                      stat.color === 'red' ? 'text-red-600 dark:text-red-400' :
                      stat.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                      stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                      'text-azure-600 dark:text-azure-400'
                    }`}>{stat.value}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Alert Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select value={alertFilter.type} onChange={(e) => setAlertFilter({ ...alertFilter, type: e.target.value })}
              className="input-field w-auto text-sm">
              <option value="">All Types</option>
              <option value="budget">Budget</option>
              <option value="anomaly">Anomaly</option>
              <option value="recommendation">Recommendation</option>
              <option value="system">System</option>
            </select>
            <select value={alertFilter.severity} onChange={(e) => setAlertFilter({ ...alertFilter, severity: e.target.value })}
              className="input-field w-auto text-sm">
              <option value="">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button onClick={handleMarkAllRead} className="btn-secondary text-sm">
              <Check className="w-4 h-4 inline-block mr-1" /> Mark All Read
            </button>
          </div>

          {/* Alert List */}
          <div className="space-y-3">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="glass-card p-5 animate-pulse"><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-3" /><div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" /></div>
              ))
            ) : alerts.map((alert, idx) => (
              /* Enhancement #5: border-l-4 colored by severity, with slide-up stagger */
              <div key={alert.id}
                className={`glass-card p-5 transition-all duration-200 border-l-4 animate-slide-up ${
                  !alert.is_read
                    ? severityBorderColor(alert.severity)
                    : 'border-l-surface-300 dark:border-l-surface-600'
                } ${alert.is_resolved ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h4 className="font-semibold text-surface-900 dark:text-white">{alert.title}</h4>
                      <SeverityBadge severity={alert.severity} />
                      <TypeBadge type={alert.type} />
                      {alert.is_resolved && <span className="badge badge-low">Resolved</span>}
                    </div>
                    <p className="text-sm text-surface-500 dark:text-surface-400">{alert.message}</p>
                    <p className="text-xs text-surface-400 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                      {alert.resource_name && <span> - {alert.resource_name}</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!alert.is_read && (
                      <button onClick={() => handleMarkRead(alert.id)}
                        className="p-2 rounded-lg bg-azure-50 dark:bg-azure-900/20 text-azure-600 dark:text-azure-400 hover:bg-azure-100 dark:hover:bg-azure-900/40 transition-colors"
                        title="Mark as read"><Eye className="w-4 h-4" /></button>
                    )}
                    {!alert.is_resolved && (
                      <button onClick={() => handleResolve(alert.id)}
                        className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        title="Resolve"><Check className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'budgets' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowNewBudget(!showNewBudget)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Budget
            </button>
          </div>

          {/* Enhancement #10: glass-card-elevated for new budget form */}
          {showNewBudget && (
            <div className="glass-card-elevated p-6 animate-slide-up border border-azure-200/40 dark:border-azure-700/30">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-azure-100 dark:bg-azure-900/30 rounded-xl p-2.5">
                  <Wallet className="w-5 h-5 text-azure-600 dark:text-azure-400" />
                </div>
                <h3 className="text-base font-semibold text-surface-900 dark:text-white">Create Budget</h3>
              </div>
              <form onSubmit={handleCreateBudget} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input type="text" placeholder="Budget name" className="input-field" required
                  value={newBudget.name} onChange={(e) => setNewBudget({ ...newBudget, name: e.target.value })} />
                <input type="number" placeholder="Amount ($)" className="input-field" required min="0" step="0.01"
                  value={newBudget.amount} onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })} />
                <div className="flex gap-2">
                  <select className="input-field" value={newBudget.period}
                    onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value })}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                  <button type="submit" className="btn-primary whitespace-nowrap">Create</button>
                </div>
              </form>
            </div>
          )}

          {/* Budget List - Enhancement #6 & #7: gradient header accent, better spacing, slide-up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget, idx) => {
              const pct = parseFloat(budget.usage_percent) || 0
              const isOver = pct >= 100
              const isWarning = pct >= 75
              const gradientAccent = isOver
                ? 'from-red-500 to-red-600'
                : isWarning
                  ? 'from-amber-500 to-orange-500'
                  : 'from-emerald-500 to-teal-500'
              const glowBar = isOver
                ? 'shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                : isWarning
                  ? 'shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'shadow-[0_0_8px_rgba(16,185,129,0.4)]'

              return (
                <div key={budget.id}
                  className="glass-card-hover overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'backwards' }}>
                  {/* Enhancement #6: Gradient header accent bar */}
                  <div className={`h-1 bg-gradient-to-r ${gradientAccent}`} />

                  <div className="p-5 pt-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-surface-900 dark:text-white">{budget.name}</h4>
                        <p className="text-xs text-surface-400 mt-1 capitalize">{budget.period} budget{budget.subscription_name && ` - ${budget.subscription_name}`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Enhancement #4: Circular percentage indicator */}
                        <CircularProgress percent={pct} isOver={isOver} isWarning={isWarning} />
                        <span className={`badge ${isOver ? 'badge-critical' : isWarning ? 'badge-medium' : 'badge-low'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Enhancement #4: Progress bar with glow effect */}
                    <div className="mb-4">
                      <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                          } ${glowBar}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">Spent</p>
                        {/* Enhancement #9: font-extrabold for currency numbers */}
                        <p className="text-sm font-extrabold text-surface-900 dark:text-white">{formatCurrency(budget.current_spend)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-surface-500 dark:text-surface-400 mb-0.5">Budget</p>
                        <p className="text-sm font-extrabold text-surface-900 dark:text-white">{formatCurrency(budget.amount)}</p>
                      </div>
                    </div>

                    {/* Enhancement #8: Better exceedance warning with gradient background */}
                    {isOver && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-red-50 via-red-50 to-orange-50 dark:from-red-900/25 dark:via-red-900/20 dark:to-orange-900/15 rounded-xl flex items-center gap-2.5 border border-red-200/60 dark:border-red-800/40">
                        <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-1.5 flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                          Budget exceeded by {formatCurrency(budget.current_spend - budget.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
