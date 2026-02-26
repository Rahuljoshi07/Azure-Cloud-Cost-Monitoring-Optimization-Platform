import { useState, useEffect } from 'react'
import { costAPI, alertAPI, recommendationAPI, reportAPI } from '../lib/api'
import {
  DollarSign, TrendingUp, TrendingDown, Server, AlertTriangle,
  Lightbulb, ArrowUpRight, ArrowDownRight, Activity, BarChart3, Clock
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CHART_COLORS = ['#0078d4', '#00bcf2', '#8661c5', '#e74856', '#00cc6a', '#ffb900', '#ff8c00', '#e3008c']

function formatCurrency(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${Number(value).toFixed(2)}`
}

function KpiCard({ title, value, change, icon: Icon, color, prefix = '$', loading }) {
  const isPositive = change > 0
  return (
    <div className={`kpi-card kpi-card-${color} animate-slide-up`}>
      {loading ? (
        <div className="space-y-3">
          <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-24 animate-pulse" />
          <div className="h-8 bg-surface-200 dark:bg-surface-700 rounded w-32 animate-pulse" />
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-20 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">{title}</span>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              color === 'blue' ? 'bg-azure-100 dark:bg-azure-900/30' :
              color === 'green' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
              color === 'red' ? 'bg-red-100 dark:bg-red-900/30' :
              color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
              'bg-cyan-100 dark:bg-cyan-900/30'
            }`}>
              <Icon className={`w-5 h-5 ${
                color === 'blue' ? 'text-azure-600 dark:text-azure-400' :
                color === 'green' ? 'text-emerald-600 dark:text-emerald-400' :
                color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                color === 'red' ? 'text-red-600 dark:text-red-400' :
                color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                'text-cyan-600 dark:text-cyan-400'
              }`} />
            </div>
          </div>
          <p className="text-2xl font-bold text-surface-900 dark:text-white">
            {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : value}
          </p>
          {change !== undefined && change !== null && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-red-500" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
              )}
              <span className={`text-xs font-semibold ${isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
                {Math.abs(change).toFixed(1)}%
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500">vs prev period</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 shadow-lg border border-surface-200 dark:border-surface-700">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
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

  useEffect(() => {
    loadData()
  }, [period])

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
      lower: f.lower_bound,
    })) || [])
  ] : []

  const totalSavings = recSummary?.summary?.total_estimated_savings || 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Cost Dashboard</h1>
          <p className="page-subtitle">Monitor and optimize your Azure cloud spending</p>
        </div>
        <div className="flex items-center gap-2">
          {['7', '14', '30', '60', '90'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? 'gradient-primary text-white shadow-sm'
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700 border border-surface-200 dark:border-surface-700'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Cost" value={overview?.summary?.total_cost || 0} change={overview?.summary?.change_percent} icon={DollarSign} color="blue" loading={loading} />
        <KpiCard title="Daily Avg" value={overview ? Math.round(overview.summary.total_cost / overview.summary.period_days) : 0} icon={Activity} color="cyan" loading={loading} />
        <KpiCard title="Resources" value={overview?.summary?.resource_count || 0} prefix="" icon={Server} color="purple" loading={loading} />
        <KpiCard title="Active Alerts" value={alertStats ? parseInt(alertStats.active) : 0} prefix="" icon={AlertTriangle} color="red" loading={loading} />
        <KpiCard title="Recommendations" value={recSummary?.summary?.total_count || 0} prefix="" icon={Lightbulb} color="amber" loading={loading} />
        <KpiCard title="Potential Savings" value={Math.round(totalSavings)} icon={TrendingDown} color="green" loading={loading} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Cost Trend - Takes 2 cols */}
        <div className="lg:col-span-2 chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Daily Cost Trend</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Last {period} days spending pattern</p>
            </div>
            <BarChart3 className="w-5 h-5 text-surface-400" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0078d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cost" name="Daily Cost" stroke="#0078d4" strokeWidth={2} fill="url(#costGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Service - Pie */}
        <div className="chart-container">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost by Service</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Top services by spending</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={serviceData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {serviceData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-surface-600 dark:text-surface-400">{value}</span>}
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Region */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost by Region</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Geographic distribution of costs</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regionData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-800" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" name="Cost" fill="#0078d4" radius={[0, 4, 4, 0]} barSize={20}>
                {regionData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Forecast */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost Forecast</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Predicted spending trend: <span className={`font-medium ${
                  forecast?.summary?.trend === 'increasing' ? 'text-red-500' : 'text-emerald-500'
                }`}>{forecast?.summary?.trend || 'calculating...'}</span>
              </p>
            </div>
            <Clock className="w-5 h-5 text-surface-400" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8661c5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8661c5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0078d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-800" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" interval={3} />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#0078d4" strokeWidth={2} fill="url(#actualGradient)" />
              <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#8661c5" strokeWidth={2} strokeDasharray="5 5" fill="url(#forecastGradient)" />
              <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="#8661c5" strokeWidth={0} fill="#8661c5" fillOpacity={0.05} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource Groups & Top Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Resource Group */}
        <div className="chart-container">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost by Resource Group</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Top resource groups by cost</p>
          </div>
          <div className="space-y-3">
            {overview?.by_resource_group?.slice(0, 6).map((rg, i) => {
              const maxCost = overview.by_resource_group[0]?.total_cost || 1
              const pct = (parseFloat(rg.total_cost) / parseFloat(maxCost)) * 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-surface-700 dark:text-surface-300 font-medium">{rg.resource_group}</span>
                    <span className="text-sm font-semibold text-surface-900 dark:text-white">{formatCurrency(rg.total_cost)}</span>
                  </div>
                  <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Alerts */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Recent Alerts</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                {alertStats?.active || 0} active alerts
              </p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-2">
            {alertStats && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{alertStats.critical}</p>
                  <p className="text-xs text-red-500 dark:text-red-400">Critical</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{alertStats.high}</p>
                  <p className="text-xs text-orange-500 dark:text-orange-400">High</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{alertStats.medium}</p>
                  <p className="text-xs text-amber-500 dark:text-amber-400">Medium</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{alertStats.low}</p>
                  <p className="text-xs text-green-500 dark:text-green-400">Low</p>
                </div>
              </div>
            )}
            <div className="p-4 rounded-lg bg-azure-50/50 dark:bg-azure-900/10 border border-azure-100 dark:border-azure-900/50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-azure-600 dark:text-azure-400" />
                <span className="text-sm font-semibold text-azure-700 dark:text-azure-300">Savings Opportunity</span>
              </div>
              <p className="text-sm text-azure-600 dark:text-azure-400">
                {recSummary?.summary?.total_count || 0} recommendations found with potential monthly savings of{' '}
                <span className="font-bold">{formatCurrency(totalSavings)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
