import { useState, useEffect } from 'react'
import { resourceAPI } from '../lib/api'
import { Server, Search, Filter, ChevronLeft, ChevronRight, Monitor, Database, HardDrive, Cloud, Globe, Box } from 'lucide-react'

const typeIcons = {
  'Microsoft.Compute/virtualMachines': Monitor,
  'Microsoft.Sql/servers/databases': Database,
  'Microsoft.Storage/storageAccounts': HardDrive,
  'Microsoft.Web/sites': Globe,
  'Microsoft.ContainerService/managedClusters': Box,
  'Microsoft.DocumentDB/databaseAccounts': Database,
  'Microsoft.Network/virtualNetworks': Cloud,
}

function formatCurrency(v) {
  return `$${Number(v).toFixed(2)}`
}

function getStatusColor(status) {
  switch (status) {
    case 'running': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    case 'stopped': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    case 'deallocated': return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
    default: return 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400'
  }
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadResources() }, [pagination.page, statusFilter])

  const loadResources = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, limit: 15 }
      if (statusFilter) params.status = statusFilter
      const res = await resourceAPI.getAll(params)
      setResources(res.data.resources)
      setPagination(res.data.pagination)
    } catch (err) {
      console.error('Failed to load resources:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = search
    ? resources.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()))
    : resources

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Resources</h1>
        <p className="page-subtitle">Manage and monitor your Azure cloud resources</p>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: pagination.total, color: 'blue', icon: Server, iconBg: 'bg-azure-100 dark:bg-azure-900/30', iconColor: 'text-azure-600 dark:text-azure-400' },
          { label: 'Running', value: resources.filter(r => r.status === 'running').length, color: 'green', icon: Monitor, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Stopped', value: resources.filter(r => r.status === 'stopped').length, color: 'red', icon: Cloud, iconBg: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
          { label: 'Deallocated', value: resources.filter(r => r.status === 'deallocated').length, color: 'purple', icon: HardDrive, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
        ].map((item, i) => (
          <div key={i} className={`kpi-card kpi-card-${item.color} animate-slide-up stagger-${i + 1}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">{item.label}</p>
                <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{item.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card p-4 animate-slide-up stagger-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input type="text" placeholder="Search resources..." className="input-field pl-10"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
              className="input-field pl-10 w-full sm:w-auto pr-8 appearance-none cursor-pointer">
              <option value="">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="deallocated">Deallocated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resource Table */}
      <div className="table-container animate-slide-up stagger-3">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Type</th>
                <th>Resource Group</th>
                <th>Location</th>
                <th>Status</th>
                <th>Monthly Cost</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="skeleton w-8 h-8 rounded-lg" />
                        <div className="space-y-1.5">
                          <div className="skeleton h-3.5 w-32 rounded" />
                          <div className="skeleton h-2.5 w-20 rounded" />
                        </div>
                      </div>
                    </td>
                    <td><div className="skeleton h-6 w-24 rounded-md" /></td>
                    <td><div className="skeleton h-3.5 w-28 rounded" /></td>
                    <td><div className="skeleton h-3.5 w-20 rounded" /></td>
                    <td><div className="skeleton h-6 w-20 rounded-full" /></td>
                    <td><div className="skeleton h-3.5 w-16 rounded" /></td>
                    <td>
                      <div className="flex gap-1">
                        <div className="skeleton h-5 w-16 rounded" />
                        <div className="skeleton h-5 w-14 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.map((r) => {
                const IconComp = typeIcons[r.type] || Server
                return (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-azure-50 dark:bg-azure-900/30 flex items-center justify-center">
                          <IconComp className="w-4 h-4 text-azure-600 dark:text-azure-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-surface-900 dark:text-white text-sm">{r.name}</p>
                          <p className="text-xs text-surface-400">{r.subscription_name}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400">
                        {r.type?.split('/').pop()}
                      </span>
                    </td>
                    <td className="text-sm">{r.resource_group_name || '-'}</td>
                    <td className="text-sm">{r.location}</td>
                    <td>
                      <span className={`badge ${getStatusColor(r.status)}`}>
                        <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${r.status === 'running' ? 'bg-emerald-500' : r.status === 'stopped' ? 'bg-red-500' : 'bg-surface-400'}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="font-semibold text-surface-900 dark:text-white">{formatCurrency(r.monthly_cost)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {r.tags && Object.entries(typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="text-[10px] font-semibold px-2 py-1 rounded bg-azure-50 dark:bg-azure-900/20 text-azure-600 dark:text-azure-400">
                            {k}: {v}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-surface-200 dark:border-surface-700">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Showing {((pagination.page - 1) * 15) + 1} to {Math.min(pagination.page * 15, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-ghost disabled:opacity-50 p-2 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 px-3 py-1.5 min-w-[4rem] text-center">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="btn-ghost disabled:opacity-50 p-2 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
