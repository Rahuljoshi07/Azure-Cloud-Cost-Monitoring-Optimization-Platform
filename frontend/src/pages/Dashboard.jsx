import { useState, useEffect, useRef, useCallback } from 'react'
import { dashboardAPI, syncAPI } from '../lib/api'
import { useSyncStore } from '../store/useStore'
import {
  DollarSign, TrendingUp, TrendingDown, Server, AlertTriangle,
  Lightbulb, ArrowUpRight, ArrowDownRight, Activity, BarChart3, Clock,
  Hexagon, Target, Shield, RefreshCw, Wallet, Zap, Globe,
  CheckCircle2, XCircle, AlertCircle, Info, ChevronRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Treemap,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6', '#ef4444', '#22c55e', '#eab308']

function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${Number(value).toFixed(2)}`
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never'
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function MetricCard({ title, value, change, icon: Icon, color, prefix = '$', loading, index = 0 }) {
  const isPositive = change > 0
  const colorMap = {
    brand: { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-600 dark:text-brand-400', glow: 'shadow-neon-brand' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-neon-emerald' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', glow: 'shadow-neon-amber' },
    rose: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', glow: 'shadow-neon-rose' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', glow: '' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', glow: 'shadow-neon-cyan' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', glow: '' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400', glow: '' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <div className={`metric-card metric-card-${color} animate-enter stagger-${index + 1}`}>
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-3 w-20" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <span className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest">{title}</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.glow}`}>
              <Icon className={`w-5 h-5 ${c.text}`} />
            </div>
          </div>
          <p className="num-xl text-surface-900 dark:text-white">
            {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : value}
          </p>
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-1.5 mt-3">
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg ${isPositive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 text-red-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />}
                <span className={`text-xs font-bold ${isPositive ? 'text-red-500' : 'text-emerald-500'}`}>{Math.abs(change).toFixed(1)}%</span>
              </div>
              <span className="text-[10px] text-surface-400 font-medium">vs prev</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card p-3 shadow-elevated border border-surface-200/60 dark:border-navy-700/60 backdrop-blur-xl">
      <p className="text-[10px] font-bold text-surface-400 mb-1.5 uppercase tracking-wider">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <p className="text-sm font-semibold text-surface-900 dark:text-white">{entry.name}: {formatCurrency(entry.value)}</p>
        </div>
      ))}
    </div>
  )
}

function BudgetGauge({ name, amount, spent }) {
  const pct = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0
  const remaining = Math.max(amount - spent, 0)
  const overBudget = spent > amount
  const strokeColor = overBudget ? '#ef4444' : pct > 80 ? '#f59e0b' : '#10b981'
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center p-4 rounded-xl bg-surface-50 dark:bg-navy-800/50 border border-surface-200/40 dark:border-navy-700/40">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-100 dark:text-navy-700" />
          <circle cx="48" cy="48" r="40" fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold text-surface-900 dark:text-white">{Math.round(pct)}%</span>
        </div>
      </div>
      <p className="text-sm font-bold text-surface-700 dark:text-surface-300 text-center">{name}</p>
      <p className="text-xs text-surface-400 mt-1">{formatCurrency(spent)} / {formatCurrency(amount)}</p>
      <p className={`text-[10px] font-semibold mt-1 ${overBudget ? 'text-red-500' : 'text-emerald-500'}`}>
        {overBudget ? `Over by ${formatCurrency(spent - amount)}` : `${formatCurrency(remaining)} remaining`}
      </p>
    </div>
  )
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    low: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${styles[severity] || styles.low}`}>
      {severity}
    </span>
  )
}

const TreemapContent = ({ x, y, width, height, name, value, index }) => {
  if (width < 40 || height < 30) return null
  const shortName = (name || '').replace('Microsoft.', '').replace('microsoft.', '')
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6}
        fill={COLORS[index % COLORS.length]} fillOpacity={0.85} stroke="#fff" strokeWidth={2} />
      {width > 60 && height > 40 && (
        <>
          <text x={x + 8} y={y + 18} fill="#fff" fontSize={11} fontWeight="bold">{shortName.slice(0, Math.floor(width / 7))}</text>
          <text x={x + 8} y={y + 34} fill="rgba(255,255,255,0.7)" fontSize={10}>{value}</text>
        </>
      )}
    </g>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)
  const { lastSynced, isSyncing, setSyncing, setSynced, setSyncError } = useSyncStore()
  const refreshInterval = useRef(null)
  const isFirstLoad = useRef(true)

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await dashboardAPI.getSummary({ period })
      setData(res.data)
      if (isFirstLoad.current) {
        isFirstLoad.current = false
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [period])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    refreshInterval.current = setInterval(() => {
      loadData(true)
    }, 60000)
    return () => clearInterval(refreshInterval.current)
  }, [loadData])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await syncAPI.trigger()
      setSynced(res.data.synced_at || new Date().toISOString())
      await loadData(true)
    } catch (err) {
      setSyncError(err.message)
    }
  }

  // Derived data
  const dailyData = data?.daily_trend?.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: parseFloat(d.daily_cost)
  })) || []

  const serviceData = data?.by_service?.slice(0, 8).map(s => ({
    name: s.service_name?.replace('Azure ', '') || 'Other',
    value: parseFloat(s.total_cost)
  })) || []

  const regionData = data?.by_region?.map(r => ({
    name: r.region,
    cost: parseFloat(r.total_cost)
  })) || []

  const subscriptionData = data?.by_subscription?.map(s => ({
    name: s.display_name?.replace('Azure subscription ', 'Sub ') || s.subscription_id?.slice(0, 8),
    cost: parseFloat(s.total_cost)
  })) || []

  const resourceTypeData = data?.resource_types?.map((rt, i) => ({
    name: rt.type?.replace('Microsoft.', '') || 'Other',
    size: parseInt(rt.count),
    index: i
  })) || []

  const forecastData = data?.forecast ? [
    ...(data.forecast.historical?.slice(-14).map(h => ({
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: parseFloat(h.daily_cost),
    })) || []),
    ...(data.forecast.predictions?.slice(0, 14).map(f => ({
      date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: f.predicted_cost,
      upper: f.upper_bound,
    })) || [])
  ] : []

  const totalSavings = parseFloat(data?.recommendations?.summary?.total_estimated_savings || 0)
  const forecastTotal = data?.forecast?.summary?.total_forecasted_cost || 0
  const budgetUsageAvg = data?.budgets?.length > 0
    ? Math.round(data.budgets.reduce((sum, b) => sum + (b.amount > 0 ? (parseFloat(b.spent) / parseFloat(b.amount)) * 100 : 0), 0) / data.budgets.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-neon-brand">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-title">Cost Dashboard</h1>
              <p className="page-subtitle">Enterprise Azure cloud cost intelligence</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Sync Button */}
          <button onClick={handleSync} disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-navy-800 border border-surface-200/40 dark:border-navy-700/40 shadow-soft hover:shadow-medium transition-all text-sm font-semibold text-surface-600 dark:text-surface-300 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <span className="text-[10px] text-surface-400 font-medium hidden sm:block">
            {lastSynced ? `Synced ${timeAgo(lastSynced)}` : data?.fetched_at ? `Updated ${timeAgo(data.fetched_at)}` : ''}
          </span>
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-navy-800 rounded-xl border border-surface-200/40 dark:border-navy-700/40 shadow-soft">
            {['7', '14', '30', '60', '90'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  period === p
                    ? 'gradient-brand text-white shadow-sm'
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-navy-700'
                }`}>
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: KPI Cards (8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        <MetricCard title="Total Cost" value={data?.summary?.total_cost || 0} change={data?.summary?.change_percent} icon={DollarSign} color="brand" loading={loading} index={0} />
        <MetricCard title="Daily Avg" value={data ? Math.round(data.summary.total_cost / data.summary.period_days) : 0} icon={Activity} color="cyan" loading={loading} index={1} />
        <MetricCard title="Monthly Forecast" value={Math.round(forecastTotal)} icon={TrendingUp} color="purple" loading={loading} index={2} />
        <MetricCard title="Resources" value={data?.summary?.resource_count || 0} prefix="" icon={Server} color="teal" loading={loading} index={3} />
        <MetricCard title="Active Alerts" value={data?.alerts?.stats ? parseInt(data.alerts.stats.active) : 0} prefix="" icon={AlertTriangle} color="rose" loading={loading} index={4} />
        <MetricCard title="Recommendations" value={data?.recommendations?.summary?.active_count || 0} prefix="" icon={Lightbulb} color="amber" loading={loading} index={5} />
        <MetricCard title="Savings Potential" value={Math.round(totalSavings)} icon={TrendingDown} color="emerald" loading={loading} index={6} />
        <MetricCard title="Budget Usage" value={budgetUsageAvg} prefix="" icon={Wallet} color="orange" loading={loading} index={7} suffix="%" />
      </div>

      {/* Row 2: Primary Charts (2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Cost Trend & Forecast</h3>
              <p className="chart-subheading">
                Historical spending + 14-day prediction &middot; Trend:{' '}
                <span className={`font-bold ${data?.forecast?.summary?.trend === 'increasing' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {data?.forecast?.summary?.trend || '...'}
                </span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-brand-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={forecastData.length > 0 ? forecastData : dailyData}>
              <defs>
                <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip content={<ChartTooltip />} />
              {forecastData.length > 0 ? (
                <>
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#costFill)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                  <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 4" fill="url(#forecastFill)" dot={false} />
                  <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="transparent" fill="#a855f7" fillOpacity={0.05} />
                </>
              ) : (
                <Area type="monotone" dataKey="cost" name="Daily Cost" stroke="#6366f1" strokeWidth={2.5} fill="url(#costFill)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="mb-6">
            <h3 className="chart-heading">Cost by Service</h3>
            <p className="chart-subheading">Top services by spending</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                {serviceData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => <span className="text-[11px] font-medium text-surface-600 dark:text-surface-400">{v}</span>} iconSize={8} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Secondary Charts (3 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Region */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Cost by Region</h3>
              <p className="chart-subheading">Geographic distribution</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={regionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="cost" name="Cost" radius={[0, 6, 6, 0]} barSize={20}>
                {regionData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Subscription */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">By Subscription</h3>
              <p className="chart-subheading">Cost per Azure subscription</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-cyan-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={subscriptionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="cost" name="Cost" radius={[6, 6, 0, 0]} barSize={32}>
                {subscriptionData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Distribution Treemap */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Resource Types</h3>
              <p className="chart-subheading">Distribution by type</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Server className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <Treemap data={resourceTypeData} dataKey="size" nameKey="name" content={<TreemapContent />} animationDuration={300} />
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Tables (1/2 + 1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expensive Resources */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Top Expensive Resources</h3>
              <p className="chart-subheading">Highest cost resources in period</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="space-y-3">
            {data?.top_resources?.slice(0, 8).map((r, i) => {
              const maxCost = data.top_resources[0]?.total_cost || 1
              const pct = (parseFloat(r.total_cost) / parseFloat(maxCost)) * 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-surface-700 dark:text-surface-300 font-medium truncate">{r.name}</span>
                      <span className="text-[10px] text-surface-400 font-medium hidden sm:block">{r.type?.replace('Microsoft.', '')}</span>
                    </div>
                    <span className="text-sm font-bold text-surface-900 dark:text-white flex-shrink-0 ml-2">{formatCurrency(r.total_cost)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-100 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              )
            })}
            {(!data?.top_resources || data.top_resources.length === 0) && !loading && (
              <p className="text-sm text-surface-400 text-center py-8">No resource data available</p>
            )}
          </div>
        </div>

        {/* Recent Alerts Feed */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Alert Feed</h3>
              <p className="chart-subheading">{data?.alerts?.stats?.active || 0} active alerts</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {data?.alerts?.stats && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'Critical', value: data.alerts.stats.critical, bg: 'bg-red-50 dark:bg-red-900/15', border: 'border-red-100 dark:border-red-900/40', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
                { label: 'High', value: data.alerts.stats.high, bg: 'bg-orange-50 dark:bg-orange-900/15', border: 'border-orange-100 dark:border-orange-900/40', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
                { label: 'Medium', value: data.alerts.stats.medium, bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-100 dark:border-amber-900/40', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
                { label: 'Low', value: data.alerts.stats.low, bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-100 dark:border-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i} className={`p-2.5 rounded-xl ${item.bg} border ${item.border}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    <p className="text-[9px] font-bold uppercase tracking-wider text-surface-500">{item.label}</p>
                  </div>
                  <p className={`text-xl font-extrabold ${item.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {data?.alerts?.recent?.map((alert, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-surface-50 dark:bg-navy-800/50 border border-surface-200/40 dark:border-navy-700/40 hover:bg-surface-100 dark:hover:bg-navy-700/50 transition-colors">
                <div className="mt-0.5">
                  {alert.severity === 'critical' ? <XCircle className="w-4 h-4 text-red-500" /> :
                   alert.severity === 'high' ? <AlertCircle className="w-4 h-4 text-orange-500" /> :
                   alert.severity === 'medium' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                   <Info className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-surface-800 dark:text-surface-200 truncate">{alert.title}</span>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="text-[11px] text-surface-400">{timeAgo(alert.created_at)}</p>
                </div>
              </div>
            ))}
            {(!data?.alerts?.recent || data.alerts.recent.length === 0) && !loading && (
              <p className="text-sm text-surface-400 text-center py-8">No recent alerts</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 5: Resource Groups + Budget & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Gauges */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Budget Status</h3>
              <p className="chart-subheading">Monthly budget tracking</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {data?.budgets?.map((b, i) => (
              <BudgetGauge key={i} name={b.name} amount={parseFloat(b.amount)} spent={parseFloat(b.spent)} />
            ))}
            {(!data?.budgets || data.budgets.length === 0) && !loading && (
              <div className="col-span-full text-sm text-surface-400 text-center py-8">No budgets configured</div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Savings Recommendations</h3>
              <p className="chart-subheading">
                {data?.recommendations?.summary?.active_count || 0} active &middot; Potential savings:{' '}
                <span className="font-bold text-emerald-500">{formatCurrency(totalSavings)}</span>/mo
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-3">
            {data?.recommendations?.top?.map((rec, i) => (
              <div key={i} className="p-4 rounded-xl bg-surface-50 dark:bg-navy-800/50 border border-surface-200/40 dark:border-navy-700/40 hover:bg-surface-100 dark:hover:bg-navy-700/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                        rec.impact === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        rec.impact === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}>{rec.impact}</span>
                      <span className="text-[10px] text-surface-400 font-medium">{rec.category}</span>
                    </div>
                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-200">{rec.title}</p>
                    {rec.resource_name && (
                      <p className="text-[11px] text-surface-400 mt-0.5">{rec.resource_name}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold text-emerald-500">{formatCurrency(rec.estimated_savings)}</p>
                    <p className="text-[10px] text-surface-400">per month</p>
                  </div>
                </div>
              </div>
            ))}
            {(!data?.recommendations?.top || data.recommendations.top.length === 0) && !loading && (
              <p className="text-sm text-surface-400 text-center py-8">No active recommendations</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 6: Resource Groups + Month-over-Month */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Groups */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Resource Groups</h3>
              <p className="chart-subheading">Top groups by cost</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
              <Server className="w-4 h-4 text-cyan-500" />
            </div>
          </div>
          <div className="space-y-4">
            {data?.by_resource_group?.slice(0, 6).map((rg, i) => {
              const maxCost = data.by_resource_group[0]?.total_cost || 1
              const pct = (parseFloat(rg.total_cost) / parseFloat(maxCost)) * 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-surface-700 dark:text-surface-300 font-medium">{rg.resource_group}</span>
                    </div>
                    <span className="text-sm font-bold text-surface-900 dark:text-white">{formatCurrency(rg.total_cost)}</span>
                  </div>
                  <div className="h-2 bg-surface-100 dark:bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out animate-progress"
                      style={{ '--progress-width': `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Month-over-Month */}
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Month-over-Month</h3>
              <p className="chart-subheading">Cost comparison by month</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-brand-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={[...(data?.month_comparison || [])].reverse().map(m => ({
              month: m.month,
              cost: parseFloat(m.total_cost)
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="cost" name="Monthly Cost" radius={[6, 6, 0, 0]} barSize={40}>
                {(data?.month_comparison || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
