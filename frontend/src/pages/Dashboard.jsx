import { useState, useEffect } from 'react'
import { costAPI, alertAPI, recommendationAPI, reportAPI } from '../lib/api'
import {
  DollarSign, TrendingUp, TrendingDown, Server, AlertTriangle,
  Lightbulb, ArrowUpRight, ArrowDownRight, Activity, BarChart3, Clock,
  Hexagon, Target, Shield
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']

function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${Number(value).toFixed(2)}`
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

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [alertStats, setAlertStats] = useState(null)
  const [recSummary, setRecSummary] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [period, setPeriod] = useState('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [period])

  const loadData = async () => {
    setLoading(true)
    try {
      const [costRes, alertRes, recRes, forecastRes] = await Promise.all([
        costAPI.getOverview({ period }),
        alertAPI.getStats(),
        recommendationAPI.getAll(),
        reportAPI.getForecast({ days: 30 })
      ])
      setOverview(costRes.data)
      setAlertStats(alertRes.data)
      setRecSummary(recRes.data)
      setForecast(forecastRes.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const dailyData = overview?.daily_trend?.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: parseFloat(d.daily_cost)
  })) || []

  const serviceData = overview?.by_service?.slice(0, 8).map(s => ({
    name: s.service_name?.replace('Azure ', '') || 'Other',
    value: parseFloat(s.total_cost)
  })) || []

  const regionData = overview?.by_region?.map(r => ({
    name: r.region,
    cost: parseFloat(r.total_cost)
  })) || []

  const forecastData = forecast ? [
    ...(forecast.historical?.slice(-14).map(h => ({
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: parseFloat(h.daily_cost),
    })) || []),
    ...(forecast.forecast?.slice(0, 14).map(f => ({
      date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: f.predicted_cost,
      upper: f.upper_bound,
    })) || [])
  ] : []

  const totalSavings = recSummary?.summary?.total_estimated_savings || 0

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
              <p className="page-subtitle">Monitor and optimize your Azure cloud spending</p>
            </div>
          </div>
        </div>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard title="Total Cost" value={overview?.summary?.total_cost || 0} change={overview?.summary?.change_percent} icon={DollarSign} color="brand" loading={loading} index={0} />
        <MetricCard title="Daily Avg" value={overview ? Math.round(overview.summary.total_cost / overview.summary.period_days) : 0} icon={Activity} color="cyan" loading={loading} index={1} />
        <MetricCard title="Resources" value={overview?.summary?.resource_count || 0} prefix="" icon={Server} color="purple" loading={loading} index={2} />
        <MetricCard title="Alerts" value={alertStats ? parseInt(alertStats.active) : 0} prefix="" icon={AlertTriangle} color="rose" loading={loading} index={3} />
        <MetricCard title="Tips" value={recSummary?.summary?.total_count || 0} prefix="" icon={Lightbulb} color="amber" loading={loading} index={4} />
        <MetricCard title="Savings" value={Math.round(totalSavings)} icon={TrendingDown} color="emerald" loading={loading} index={5} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Daily Cost Trend</h3>
              <p className="chart-subheading">Last {period} days spending pattern</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-brand-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="costG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cost" name="Daily Cost" stroke="#6366f1" strokeWidth={2.5} fill="url(#costG)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="mb-6">
            <h3 className="chart-heading">Cost by Service</h3>
            <p className="chart-subheading">Top services by spending</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={serviceData} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                {serviceData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => <span className="text-[11px] font-medium text-surface-600 dark:text-surface-400">{v}</span>} iconSize={8} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Cost by Region</h3>
              <p className="chart-subheading">Geographic distribution</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="cost" name="Cost" radius={[0, 6, 6, 0]} barSize={22}>
                {regionData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Cost Forecast</h3>
              <p className="chart-subheading">
                Trend: <span className={`font-bold ${forecast?.summary?.trend === 'increasing' ? 'text-red-500' : 'text-emerald-500'}`}>{forecast?.summary?.trend || '...'}</span>
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-cyan-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="fG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-700" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#aG)" dot={false} />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#a855f7" strokeWidth={2} strokeDasharray="6 4" fill="url(#fG)" dot={false} />
              <Area type="monotone" dataKey="upper" name="Upper" stroke="transparent" fill="#a855f7" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Groups & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {overview?.by_resource_group?.slice(0, 6).map((rg, i) => {
              const maxCost = overview.by_resource_group[0]?.total_cost || 1
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

        <div className="chart-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Alert Overview</h3>
              <p className="chart-subheading">{alertStats?.active || 0} active alerts</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-500" />
            </div>
          </div>

          {alertStats && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Critical', value: alertStats.critical, bg: 'bg-red-50 dark:bg-red-900/15', border: 'border-red-100 dark:border-red-900/40', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' },
                { label: 'High', value: alertStats.high, bg: 'bg-orange-50 dark:bg-orange-900/15', border: 'border-orange-100 dark:border-orange-900/40', text: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' },
                { label: 'Medium', value: alertStats.medium, bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-100 dark:border-amber-900/40', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
                { label: 'Low', value: alertStats.low, bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-100 dark:border-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
              ].map((item, i) => (
                <div key={i} className={`p-3.5 rounded-xl ${item.bg} border ${item.border} transition-all duration-200 hover:scale-[1.02]`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-surface-500">{item.label}</p>
                  </div>
                  <p className={`text-2xl font-extrabold ${item.text}`}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 rounded-xl gradient-brand-subtle border border-brand-200/40 dark:border-brand-800/30">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-neon-brand">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-brand-700 dark:text-brand-300">Savings Opportunity</span>
            </div>
            <p className="text-sm text-brand-600/80 dark:text-brand-400/80 leading-relaxed">
              {recSummary?.summary?.total_count || 0} recommendations with potential monthly savings of{' '}
              <span className="font-extrabold text-brand-700 dark:text-brand-300">{formatCurrency(totalSavings)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
