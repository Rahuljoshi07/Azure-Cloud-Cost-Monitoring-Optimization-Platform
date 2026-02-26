import { useState, useEffect } from 'react'
import { costAPI } from '../lib/api'
import { DollarSign, Filter, Tag, Globe, Layers, PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const CHART_COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']

function formatCurrency(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
  return `$${Number(v).toFixed(2)}`
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-glass p-3 shadow-elevated border border-surface-200/80 dark:border-navy-700/80 backdrop-blur-xl">
      <p className="text-[10px] font-bold text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wider">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <p className="text-sm font-semibold text-surface-900 dark:text-white">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        </div>
      ))}
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon, color, loading, index = 0 }) {
  const colorMap = {
    brand: { bg: 'bg-brand-100 dark:bg-brand-900/30', text: 'text-brand-600 dark:text-brand-400', card: 'metric-card-brand' },
    emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', card: 'metric-card-emerald' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', card: 'metric-card-amber' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', card: 'metric-card-purple' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400', card: 'metric-card-cyan' },
    rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400', card: 'metric-card-rose' },
  }
  const c = colorMap[color] || colorMap.brand

  return (
    <div className={`metric-card ${c.card} animate-enter stagger-${index + 1}`}>
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-32" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-4">
            <span className="text-[11px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-widest">{title}</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} transition-transform duration-300 group-hover:scale-110`}>
              <Icon className={`w-5 h-5 ${c.text}`} />
            </div>
          </div>
          <p className="num-lg text-surface-900 dark:text-white">{value}</p>
        </>
      )}
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Resource Name</th>
            <th>Type</th>
            <th>Resource Group</th>
            <th>Region</th>
            <th>Total Cost</th>
            <th>Avg Daily</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              <td><div className="skeleton h-4 w-6" /></td>
              <td><div className="skeleton h-4 w-40" /></td>
              <td><div className="skeleton h-6 w-24 rounded-md" /></td>
              <td><div className="skeleton h-4 w-28" /></td>
              <td><div className="skeleton h-4 w-20" /></td>
              <td><div className="skeleton h-4 w-16" /></td>
              <td><div className="skeleton h-4 w-14" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CostBreakdown() {
  const [overview, setOverview] = useState(null)
  const [bySubscription, setBySubscription] = useState([])
  const [topResources, setTopResources] = useState([])
  const [byTags, setByTags] = useState([])
  const [period, setPeriod] = useState('30')
  const [tagKey, setTagKey] = useState('environment')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [period, tagKey])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewRes, subRes, topRes, tagRes] = await Promise.all([
        costAPI.getOverview({ period }),
        costAPI.getBySubscription({ period }),
        costAPI.getTopResources({ period, limit: '15' }),
        costAPI.getByTags({ period, tag_key: tagKey })
      ])
      setOverview(overviewRes.data)
      setBySubscription(subRes.data)
      setTopResources(topRes.data)
      setByTags(tagRes.data)
    } catch (err) {
      console.error('Failed to load cost data:', err)
    } finally {
      setLoading(false)
    }
  }

  const subData = bySubscription.map(s => ({
    name: s.display_name.replace(' Subscription', ''),
    cost: parseFloat(s.total_cost)
  }))

  const tagData = byTags.map(t => ({
    name: t.tag_value || 'untagged',
    value: parseFloat(t.total_cost)
  }))

  const serviceData = overview?.by_service?.map(s => ({
    name: s.service_name?.replace('Azure ', '') || 'Other',
    cost: parseFloat(s.total_cost),
    records: parseInt(s.record_count)
  })) || []

  const totalCost = overview?.summary?.total_cost || 0
  const subscriptionCount = bySubscription.length
  const serviceCount = serviceData.length
  const resourceCount = topResources.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-neon-brand">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="page-title">Cost Breakdown</h1>
              <p className="page-subtitle">Detailed analysis of your cloud spending</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-navy-800 rounded-xl border border-surface-200 dark:border-navy-700 shadow-sm">
          {['7', '14', '30', '60', '90'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                period === p
                  ? 'gradient-brand text-white shadow-sm'
                  : 'text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-navy-700'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Cost" value={formatCurrency(totalCost)} icon={DollarSign} color="brand" loading={loading} index={0} />
        <SummaryCard title="Subscriptions" value={subscriptionCount} icon={Layers} color="purple" loading={loading} index={1} />
        <SummaryCard title="Services" value={serviceCount} icon={Globe} color="cyan" loading={loading} index={2} />
        <SummaryCard title="Top Resources" value={resourceCount} icon={TrendingUp} color="amber" loading={loading} index={3} />
      </div>

      {/* Cost by Subscription & Cost by Tag */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Subscription */}
        <div className="chart-card animate-enter stagger-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Cost by Subscription</h3>
              <p className="chart-subheading">Spending distribution across subscriptions</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-brand-500" />
            </div>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton h-8 flex-1 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subData}>
                <defs>
                  {CHART_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`subGradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-800" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cost" name="Cost" radius={[6, 6, 0, 0]} barSize={50}>
                  {subData.map((_, i) => (
                    <Cell key={i} fill={`url(#subGradient-${i % CHART_COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cost by Tag */}
        <div className="chart-card animate-enter stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="chart-heading">Cost by Tag</h3>
              <p className="chart-subheading">Spending grouped by tag values</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tagKey}
                onChange={(e) => setTagKey(e.target.value)}
                className="input w-auto text-xs py-1.5 px-3"
              >
                <option value="environment">Environment</option>
                <option value="department">Department</option>
                <option value="project">Project</option>
                <option value="owner">Owner</option>
              </select>
              <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                <Tag className="w-4 h-4 text-violet-500" />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="skeleton w-48 h-48 rounded-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tagData}
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  innerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {tagData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => <span className="text-[11px] font-medium text-surface-600 dark:text-surface-400">{value}</span>}
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cost by Service - Full Width */}
      <div className="chart-card animate-enter stagger-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="chart-heading">Cost by Service</h3>
            <p className="chart-subheading">Breakdown of spending across Azure services</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyan-500" />
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton h-4 w-28" />
                <div className="skeleton h-5 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={serviceData} layout="vertical">
              <defs>
                {CHART_COLORS.map((color, i) => (
                  <linearGradient key={i} id={`serviceGradient-${i}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={color} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-100 dark:text-navy-800" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" name="Total Cost" radius={[0, 6, 6, 0]} barSize={18}>
                {serviceData.map((_, i) => (
                  <Cell key={i} fill={`url(#serviceGradient-${i % CHART_COLORS.length})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Expensive Resources Table */}
      <div className="data-table animate-enter stagger-4">
        <div className="p-5 border-b border-surface-200 dark:border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h3 className="chart-heading">Top Expensive Resources</h3>
              <p className="chart-subheading">Highest cost resources in the selected period</p>
            </div>
          </div>
          {!loading && topResources.length > 0 && (
            <span className="text-xs font-semibold text-surface-400 dark:text-surface-500 bg-surface-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg">
              {topResources.length} resources
            </span>
          )}
        </div>
        {loading ? (
          <SkeletonTable />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Resource Name</th>
                  <th>Type</th>
                  <th>Resource Group</th>
                  <th>Region</th>
                  <th>Total Cost</th>
                  <th>Avg Daily</th>
                </tr>
              </thead>
              <tbody>
                {topResources.map((r, i) => (
                  <tr key={i}>
                    <td>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-surface-100 dark:bg-navy-800 text-[11px] font-bold text-surface-500 dark:text-surface-400">
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-surface-900 dark:text-white">{r.name}</span>
                    </td>
                    <td>
                      <span className="badge bg-surface-100 dark:bg-navy-800 text-surface-600 dark:text-surface-400">
                        {r.type?.split('/').pop()}
                      </span>
                    </td>
                    <td className="text-surface-600 dark:text-surface-400">{r.resource_group || '-'}</td>
                    <td className="text-surface-600 dark:text-surface-400">{r.location}</td>
                    <td>
                      <span className="font-bold text-surface-900 dark:text-white">{formatCurrency(r.total_cost)}</span>
                    </td>
                    <td className="text-surface-500 dark:text-surface-400">{formatCurrency(r.avg_daily_cost)}</td>
                  </tr>
                ))}
                {topResources.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-surface-400 dark:text-surface-500">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-surface-300 dark:text-surface-600" />
                        <p className="text-sm font-medium">No resource data available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
