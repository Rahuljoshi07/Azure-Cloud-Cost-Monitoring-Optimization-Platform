import { useState, useEffect } from 'react'
import { costAPI } from '../lib/api'
import { DollarSign, Filter, Tag, Globe, Layers } from 'lucide-react'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#0078d4', '#00bcf2', '#8661c5', '#e74856', '#00cc6a', '#ffb900', '#ff8c00', '#e3008c', '#4a90d9', '#50e6ff']

function formatCurrency(v) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
  return `$${Number(v).toFixed(2)}`
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title">Cost Breakdown</h1>
          <p className="page-subtitle">Detailed analysis of your cloud spending</p>
        </div>
        <div className="flex items-center gap-2">
          {['7', '14', '30', '60', '90'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === p ? 'gradient-primary text-white shadow-sm' : 'btn-secondary text-xs'
              }`}>
              {p}d
            </button>
          ))}
        </div>
      </div>

      {/* Cost by Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="chart-container">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-azure-500" />
            <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost by Subscription</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-800" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="currentColor" className="text-surface-400" />
              <YAxis tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" tickFormatter={formatCurrency} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px' }} />
              <Bar dataKey="cost" name="Cost" radius={[6, 6, 0, 0]} barSize={50}>
                {subData.map((_, i) => (<Cell key={i} fill={COLORS[i]} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost by Tag */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-purple-500" />
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost by Tag</h3>
            </div>
            <select value={tagKey} onChange={(e) => setTagKey(e.target.value)}
              className="input-field w-auto text-xs py-1.5 px-3">
              <option value="environment">Environment</option>
              <option value="department">Department</option>
              <option value="project">Project</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={tagData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} dataKey="value">
                {tagData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend formatter={(v) => <span className="text-xs">{v}</span>} iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost by Service - Full Width */}
      <div className="chart-container">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-cyan-500" />
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Cost by Service</h3>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={serviceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-surface-200 dark:text-surface-800" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" tickFormatter={formatCurrency} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="currentColor" className="text-surface-400" width={140} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '8px' }} />
            <Bar dataKey="cost" name="Total Cost" fill="#0078d4" radius={[0, 6, 6, 0]} barSize={18}>
              {serviceData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Expensive Resources Table */}
      <div className="table-container">
        <div className="p-5 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-red-500" />
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">Top Expensive Resources</h3>
        </div>
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
                  <td className="font-medium text-surface-400">{i + 1}</td>
                  <td className="font-semibold text-surface-900 dark:text-white">{r.name}</td>
                  <td>
                    <span className="text-xs px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                      {r.type?.split('/').pop()}
                    </span>
                  </td>
                  <td className="text-surface-600 dark:text-surface-400">{r.resource_group || '-'}</td>
                  <td className="text-surface-600 dark:text-surface-400">{r.location}</td>
                  <td className="font-semibold text-surface-900 dark:text-white">{formatCurrency(r.total_cost)}</td>
                  <td className="text-surface-600 dark:text-surface-400">{formatCurrency(r.avg_daily_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
