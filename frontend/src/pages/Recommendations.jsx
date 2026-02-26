import { useState, useEffect } from 'react'
import { recommendationAPI } from '../lib/api'
import {
  Lightbulb, TrendingDown, ArrowDown, ArrowUp, Minus,
  Check, X, Server, Database, HardDrive, Zap, DollarSign,
  PieChart as PieChartIcon, ArrowRight, BarChart3
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = { high: '#e74856', medium: '#ffb900', low: '#00cc6a' }
const CATEGORY_COLORS = ['#6366f1', '#06b6d4', '#a855f7', '#f43f5e']

const IMPACT_BORDER_COLORS = {
  high: '#e74856',
  medium: '#ffb900',
  low: '#00cc6a'
}

function formatCurrency(v) {
  return `$${Number(v).toFixed(0)}`
}

function ImpactBadge({ impact }) {
  const styles = {
    high: 'badge-critical',
    medium: 'badge-medium',
    low: 'badge-low'
  }
  return <span className={`badge ${styles[impact] || styles.medium}`}>{impact}</span>
}

function ActionIcon({ action }) {
  switch (action) {
    case 'resize': return <ArrowDown className="w-4 h-4 text-brand-500" />
    case 'stop': return <X className="w-4 h-4 text-red-500" />
    case 'delete': return <X className="w-4 h-4 text-red-600" />
    default: return <Lightbulb className="w-4 h-4 text-amber-500" />
  }
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([])
  const [summary, setSummary] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [filter, setFilter] = useState({ impact: '', category: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [recRes, sumRes] = await Promise.all([
        recommendationAPI.getAll(filter),
        recommendationAPI.getSummary()
      ])
      setRecommendations(recRes.data.recommendations)
      setSummary(recRes.data.summary)
      setCategoryData(sumRes.data.map(c => ({
        name: c.category, value: parseFloat(c.total_savings), count: parseInt(c.count)
      })))
    } catch (err) {
      console.error('Failed to load recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await recommendationAPI.updateStatus(id, status)
      loadData()
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }

  const impactData = summary ? [
    { name: 'High', value: summary.by_impact.high, fill: COLORS.high },
    { name: 'Medium', value: summary.by_impact.medium, fill: COLORS.medium },
    { name: 'Low', value: summary.by_impact.low, fill: COLORS.low },
  ] : []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Optimization Recommendations</h1>
        <p className="page-subtitle">Actionable insights to reduce your cloud costs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card metric-card-emerald animate-enter stagger-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Potential Savings</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary?.total_estimated_savings || 0)}</p>
          <p className="text-xs text-surface-400 mt-1">per month</p>
        </div>
        <div className="metric-card metric-card-brand animate-enter stagger-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Total Recommendations</span>
          </div>
          <p className="text-3xl font-bold text-surface-900 dark:text-white">{summary?.total_count || 0}</p>
        </div>
        <div className="metric-card metric-card-rose animate-enter stagger-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">High Impact</span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary?.by_impact?.high || 0}</p>
        </div>
        <div className="metric-card metric-card-amber animate-enter stagger-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide">Medium Impact</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{summary?.by_impact?.medium || 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-card animate-enter stagger-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <PieChartIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="chart-heading">By Impact Level</h3>
              <p className="chart-subheading">Distribution of recommendation severity</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={impactData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {impactData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card animate-enter stagger-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="chart-heading">Savings by Category</h3>
              <p className="chart-subheading">Potential savings across resource categories</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                {categoryData.map((_, i) => (<Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filter.impact} onChange={(e) => setFilter({ ...filter, impact: e.target.value })}
          className="input w-auto text-sm">
          <option value="">All Impacts</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="input w-auto text-sm">
          <option value="">All Categories</option>
          <option value="cost">Cost</option>
          <option value="performance">Performance</option>
          <option value="security">Security</option>
          <option value="reliability">Reliability</option>
        </select>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="card-glass p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 rounded w-1/3 mb-3" />
                  <div className="skeleton h-3 rounded w-2/3 mb-2" />
                  <div className="skeleton h-3 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : recommendations.map((rec) => (
          <div
            key={rec.id}
            className="card-glass card-hover p-5 animate-enter"
            style={{ borderLeft: `3px solid ${IMPACT_BORDER_COLORS[rec.impact] || IMPACT_BORDER_COLORS.medium}` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ActionIcon action={rec.action} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-surface-900 dark:text-white">{rec.title}</h4>
                    <ImpactBadge impact={rec.impact} />
                    <span className="badge bg-surface-100 dark:bg-navy-800 text-surface-600 dark:text-surface-400">{rec.category}</span>
                  </div>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mb-2">{rec.description}</p>
                  {rec.resource_name && (
                    <p className="text-xs text-surface-400">
                      Resource: <span className="font-medium text-surface-600 dark:text-surface-300">{rec.resource_name}</span>
                      {rec.resource_location && <span> ({rec.resource_location})</span>}
                    </p>
                  )}
                  {rec.current_value && (
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">{rec.current_value}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-surface-400" />
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-medium">{rec.recommended_value}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                {rec.estimated_savings > 0 && (
                  <div className="text-right">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg font-bold shadow-neon-emerald">
                      {formatCurrency(rec.estimated_savings)}
                    </span>
                    <p className="text-xs text-surface-400 mt-1">savings/mo</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleStatusUpdate(rec.id, 'implemented')}
                    className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    title="Mark as implemented">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleStatusUpdate(rec.id, 'dismissed')}
                    className="p-2.5 rounded-xl bg-surface-100 dark:bg-navy-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-navy-700 transition-colors"
                    title="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
