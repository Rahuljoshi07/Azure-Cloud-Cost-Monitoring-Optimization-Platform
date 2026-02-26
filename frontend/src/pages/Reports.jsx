import { useState, useEffect } from 'react'
import { reportAPI } from '../lib/api'
import {
  FileText, Download, Plus, Calendar, TrendingUp, TrendingDown,
  BarChart3, AlertTriangle, Clock, DollarSign, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function formatCurrency(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
  return `$${Number(v).toFixed(2)}`
}

export default function Reports() {
  const [tab, setTab] = useState('overview')
  const [reports, setReports] = useState([])
  const [forecast, setForecast] = useState(null)
  const [anomalies, setAnomalies] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportForm, setReportForm] = useState({
    type: 'monthly', period_start: '', period_end: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reportsRes, forecastRes, anomalyRes] = await Promise.all([
        reportAPI.getAll(),
        reportAPI.getForecast({ days: 30 }),
        reportAPI.getAnomalies({ period: 30 })
      ])
      setReports(reportsRes.data)
      setForecast(forecastRes.data)
      setAnomalies(anomalyRes.data)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await reportAPI.generate(reportForm)
      loadData()
      setTab('history')
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGenerating(false)
    }
  }

  const forecastData = forecast ? [
    ...(forecast.historical?.slice(-14).map(h => ({
      date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: parseFloat(h.daily_cost),
    })) || []),
    ...(forecast.forecast?.slice(0, 14).map(f => ({
      date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      predicted: f.predicted_cost, upper: f.upper_bound, lower: f.lower_bound,
    })) || [])
  ] : []

  const severityBorderColor = (severity) => {
    switch (severity) {
      case 'critical': return 'border-l-4 border-l-red-500'
      case 'high': return 'border-l-4 border-l-orange-500'
      case 'medium': return 'border-l-4 border-l-amber-500'
      case 'low': return 'border-l-4 border-l-emerald-500'
      default: return 'border-l-4 border-l-navy-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Generate reports, forecast costs, and detect anomalies</p>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { id: 'overview', label: 'Forecast', icon: TrendingUp },
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
          { id: 'generate', label: 'Generate', icon: Plus },
          { id: 'history', label: 'History', icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`tab-item${tab === id ? ' active' : ''}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Forecast Tab */}
      {tab === 'overview' && forecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="metric-card metric-card-brand animate-enter" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">30-Day Forecast</p>
                <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <DollarSign className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <p className="num-xl text-surface-900 dark:text-white">{formatCurrency(forecast.summary?.total_forecasted_cost || 0)}</p>
              <p className="text-xs text-surface-400 mt-1.5">Predicted total</p>
            </div>
            <div className="metric-card metric-card-purple animate-enter" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Daily Average</p>
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="num-xl text-surface-900 dark:text-white">{formatCurrency(forecast.summary?.avg_daily_forecast || 0)}</p>
              <p className="text-xs text-surface-400 mt-1.5">Predicted daily cost</p>
            </div>
            <div className="metric-card metric-card-emerald animate-enter" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Trend</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  forecast.summary?.trend === 'increasing'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-emerald-100 dark:bg-emerald-900/30'
                }`}>
                  {forecast.summary?.trend === 'increasing' ? (
                    <TrendingUp className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />
                  ) : (
                    <TrendingDown className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className={`num-xl capitalize ${
                  forecast.summary?.trend === 'increasing' ? 'text-red-500' : 'text-emerald-500'
                }`}>{forecast.summary?.trend}</p>
              </div>
              <p className="text-xs text-surface-400 mt-1.5">${Math.abs(forecast.summary?.trend_rate || 0).toFixed(2)}/day</p>
            </div>
          </div>

          <div className="chart-card animate-enter" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="chart-heading">Cost Forecast</h3>
                <p className="chart-subheading">14-day historical vs. 14-day prediction</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="fActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-navy-800" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCurrency}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(v)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                    padding: '10px 14px',
                  }}
                />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#fActual)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#a855f7" strokeWidth={2.5} strokeDasharray="6 4" fill="url(#fPredicted)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="transparent" fill="#a855f7" fillOpacity={0.05} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {tab === 'anomalies' && anomalies && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="metric-card metric-card-brand animate-enter" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Total</p>
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <p className="num-xl text-surface-900 dark:text-white">{anomalies.summary?.total || 0}</p>
            </div>
            <div className="metric-card metric-card-rose animate-enter" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Critical</p>
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="num-xl text-red-600 dark:text-red-400">{anomalies.summary?.by_severity?.critical || 0}</p>
            </div>
            <div className="metric-card metric-card-amber animate-enter" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">High</p>
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="num-xl text-orange-600 dark:text-orange-400">{anomalies.summary?.by_severity?.high || 0}</p>
            </div>
            <div className="metric-card metric-card-amber animate-enter" style={{ animationDelay: '180ms' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">Unresolved</p>
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="num-xl text-amber-600 dark:text-amber-400">{anomalies.summary?.unresolved || 0}</p>
            </div>
          </div>

          <div className="data-table animate-enter" style={{ animationDelay: '240ms' }}>
            <div className="p-5 border-b border-surface-200 dark:border-navy-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
                  <AlertTriangle className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="chart-heading">Detected Anomalies</h3>
                  <p className="chart-subheading">Cost anomalies detected in the last 30 days</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Date</th><th>Resource</th><th>Expected</th><th>Actual</th><th>Deviation</th><th>Severity</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {anomalies.anomalies?.map((a) => (
                    <tr key={a.id} className={severityBorderColor(a.severity)}>
                      <td className="text-sm">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="font-medium text-surface-900 dark:text-white text-sm">{a.resource_name || 'Unknown'}</td>
                      <td className="text-sm">{formatCurrency(a.expected_cost)}</td>
                      <td className="text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(a.actual_cost)}</td>
                      <td><span className="badge badge-critical">+{parseFloat(a.deviation_percentage).toFixed(0)}%</span></td>
                      <td><span className={`badge ${
                        a.severity === 'critical' ? 'badge-critical' : a.severity === 'high' ? 'badge-high' : 'badge-medium'
                      }`}>{a.severity}</span></td>
                      <td><span className={`badge ${a.is_resolved ? 'badge-low' : 'badge-medium'}`}>{a.is_resolved ? 'Resolved' : 'Active'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Generate Tab */}
      {tab === 'generate' && (
        <div className="max-w-lg animate-enter">
          <div className="card-elevated card-glass p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h3 className="chart-heading">Generate New Report</h3>
                <p className="chart-subheading">Create a cost or optimization report</p>
              </div>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Report Type</label>
                <select className="input" value={reportForm.type}
                  onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}>
                  <option value="monthly">Monthly Cost Report</option>
                  <option value="cost_summary">Cost Summary</option>
                  <option value="optimization">Optimization Report</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Start Date</label>
                  <input type="date" className="input" required
                    value={reportForm.period_start} onChange={(e) => setReportForm({ ...reportForm, period_start: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">End Date</label>
                  <input type="date" className="input" required
                    value={reportForm.period_end} onChange={(e) => setReportForm({ ...reportForm, period_end: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={generating} className="btn-brand w-full flex items-center justify-center gap-2 shadow-neon-brand">
                {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FileText className="w-4 h-4" /> Generate Report</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="data-table animate-enter">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr><th>Report Name</th><th>Type</th><th>Period</th><th>Generated By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-surface-400">No reports generated yet. Go to the "Generate" tab to create one.</td></tr>
                ) : reports.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-surface-900 dark:text-white">{r.name}</td>
                    <td><span className="badge badge-brand capitalize">{r.type.replace('_', ' ')}</span></td>
                    <td className="text-sm text-surface-500">{new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()}</td>
                    <td className="text-sm">{r.generated_by_name || 'System'}</td>
                    <td className="text-sm text-surface-400">{new Date(r.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
