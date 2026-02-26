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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: pagination.total, color: 'azure' },
          { label: 'Running', value: resources.filter(r => r.status === 'running').length, color: 'emerald' },
          { label: 'Stopped', value: resources.filter(r => r.status === 'stopped').length, color: 'red' },
          { label: 'Deallocated', value: resources.filter(r => r.status === 'deallocated').length, color: 'surface' },
        ].map((item, i) => (
          <div key={i} className="glass-card p-4">
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase">{item.label}</p>
            <p className="text-2xl font-bold text-surface-900 dark:text-white mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input type="text" placeholder="Search resources..." className="input-field pl-10"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
          className="input-field w-auto">
          <option value="">All Status</option>
          <option value="running">Running</option>
          <option value="stopped">Stopped</option>
          <option value="deallocated">Deallocated</option>
        </select>
      </div>

      {/* Resource Table */}
      <div className="table-container">
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
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j}><div className="h-4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse w-20" /></td>
                    ))}
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
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${r.status === 'running' ? 'bg-emerald-500' : r.status === 'stopped' ? 'bg-red-500' : 'bg-surface-400'}`} />
                        {r.status}
                      </span>
                    </td>
                    <td className="font-semibold text-surface-900 dark:text-white">{formatCurrency(r.monthly_cost)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {r.tags && Object.entries(typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-azure-50 dark:bg-azure-900/20 text-azure-600 dark:text-azure-400">
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="btn-ghost disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {pagination.page} / {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="btn-ghost disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
