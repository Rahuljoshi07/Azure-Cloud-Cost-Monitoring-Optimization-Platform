import { useState, useEffect } from 'react'
import { reportAPI } from '../lib/api'
import {
  FileText, Download, Plus, Calendar, TrendingUp, TrendingDown,
  BarChart3, AlertTriangle, Clock
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

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">Generate reports, forecast costs, and detect anomalies</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
        {[
          { id: 'overview', label: 'Forecast', icon: TrendingUp },
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
          { id: 'generate', label: 'Generate', icon: Plus },
          { id: 'history', label: 'History', icon: Clock }
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Forecast Tab */}
      {tab === 'overview' && forecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1">30-Day Forecast</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{formatCurrency(forecast.summary?.total_forecasted_cost || 0)}</p>
              <p className="text-xs text-surface-400 mt-1">Predicted total</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1">Daily Average</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{formatCurrency(forecast.summary?.avg_daily_forecast || 0)}</p>
              <p className="text-xs text-surface-400 mt-1">Predicted daily cost</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase mb-1">Trend</p>
              <div className="flex items-center gap-2">
                {forecast.summary?.trend === 'increasing' ? (
                  <TrendingUp className="w-6 h-6 text-red-500" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-emerald-500" />
                )}
                <p className={`text-2xl font-bold capitalize ${
                  forecast.summary?.trend === 'increasing' ? 'text-red-500' : 'text-emerald-500'
                }`}>{forecast.summary?.trend}</p>
              </div>
              <p className="text-xs text-surface-400 mt-1">${Math.abs(forecast.summary?.trend_rate || 0).toFixed(2)}/day</p>
            </div>
          </div>

          <div className="chart-container">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4">Cost Forecast (14-day prediction)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="fActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078d4" stopOpacity={0.3} /><stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8661c5" stopOpacity={0.3} /><stop offset="95%" stopColor="#8661c5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-800" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" interval={2} />
                <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" tickFormatter={formatCurrency} />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px' }} />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#0078d4" strokeWidth={2} fill="url(#fActual)" />
                <Area type="monotone" dataKey="predicted" name="Predicted" stroke="#8661c5" strokeWidth={2} strokeDasharray="6 4" fill="url(#fPredicted)" />
                <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="transparent" fill="#8661c5" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {tab === 'anomalies' && anomalies && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Total</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{anomalies.summary?.total || 0}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Critical</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{anomalies.summary?.by_severity?.critical || 0}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">High</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{anomalies.summary?.by_severity?.high || 0}</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">Unresolved</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{anomalies.summary?.unresolved || 0}</p>
            </div>
          </div>

          <div className="table-container">
            <div className="p-5 border-b border-surface-200 dark:border-surface-700">
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Detected Anomalies</h3>
            </div>
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Date</th><th>Resource</th><th>Expected</th><th>Actual</th><th>Deviation</th><th>Severity</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {anomalies.anomalies?.map((a) => (
                    <tr key={a.id}>
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
        <div className="max-w-lg">
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4">Generate New Report</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Report Type</label>
                <select className="input-field" value={reportForm.type}
                  onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}>
                  <option value="monthly">Monthly Cost Report</option>
                  <option value="cost_summary">Cost Summary</option>
                  <option value="optimization">Optimization Report</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Start Date</label>
                  <input type="date" className="input-field" required
                    value={reportForm.period_start} onChange={(e) => setReportForm({ ...reportForm, period_start: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">End Date</label>
                  <input type="date" className="input-field" required
                    value={reportForm.period_end} onChange={(e) => setReportForm({ ...reportForm, period_end: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2">
                {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><FileText className="w-4 h-4" /> Generate Report</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="table-container">
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
                    <td><span className="badge bg-azure-100 dark:bg-azure-900/30 text-azure-700 dark:text-azure-400 capitalize">{r.type.replace('_', ' ')}</span></td>
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
