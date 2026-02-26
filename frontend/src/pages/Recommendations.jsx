import { useState, useEffect } from 'react'
import { recommendationAPI } from '../lib/api'
import {
  Lightbulb, TrendingDown, ArrowDown, ArrowUp, Minus,
  Check, X, Server, Database, HardDrive, Zap, DollarSign
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = { high: '#e74856', medium: '#ffb900', low: '#00cc6a' }
const CATEGORY_COLORS = ['#0078d4', '#8661c5', '#00cc6a', '#e74856']

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
    case 'resize': return <ArrowDown className="w-4 h-4 text-azure-500" />
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
        <div className="kpi-card kpi-card-green animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">Potential Savings</span>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary?.total_estimated_savings || 0)}</p>
          <p className="text-xs text-surface-400 mt-1">per month</p>
        </div>
        <div className="kpi-card kpi-card-blue animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-azure-500" />
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">Total Recommendations</span>
          </div>
          <p className="text-3xl font-bold text-surface-900 dark:text-white">{summary?.total_count || 0}</p>
        </div>
        <div className="kpi-card kpi-card-red animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-red-500" />
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">High Impact</span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary?.by_impact?.high || 0}</p>
        </div>
        <div className="kpi-card kpi-card-amber animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase">Medium Impact</span>
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{summary?.by_impact?.medium || 0}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4">By Impact Level</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={impactData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                {impactData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4">Savings by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
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
          className="input-field w-auto text-sm">
          <option value="">All Impacts</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filter.category} onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="input-field w-auto text-sm">
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
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="h-4 bg-surface-200 dark:bg-surface-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded w-2/3" />
            </div>
          ))
        ) : recommendations.map((rec) => (
          <div key={rec.id} className="glass-card-hover p-5 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ActionIcon action={rec.action} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="font-semibold text-surface-900 dark:text-white">{rec.title}</h4>
                    <ImpactBadge impact={rec.impact} />
                    <span className="badge bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">{rec.category}</span>
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
                      <span className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{rec.current_value}</span>
                      <ArrowDown className="w-3 h-3 text-surface-400 rotate-[-90deg]" />
                      <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">{rec.recommended_value}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                {rec.estimated_savings > 0 && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(rec.estimated_savings)}</p>
                    <p className="text-xs text-surface-400">savings/mo</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => handleStatusUpdate(rec.id, 'implemented')}
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    title="Mark as implemented">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleStatusUpdate(rec.id, 'dismissed')}
                    className="p-2 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
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
