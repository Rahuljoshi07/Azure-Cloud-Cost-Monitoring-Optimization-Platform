import { NavLink, useLocation } from 'react-router-dom'
import { useSidebarStore } from '../store/useStore'
import {
  LayoutDashboard, DollarSign, Server, Lightbulb,
  Bell, FileText, ChevronLeft, ChevronRight, X, TrendingUp, Settings
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/costs', icon: DollarSign, label: 'Cost Breakdown' },
  { path: '/resources', icon: Server, label: 'Resources' },
  { path: '/recommendations', icon: Lightbulb, label: 'Recommendations' },
  { path: '/alerts', icon: Bell, label: 'Alerts & Budgets' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarStore()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800
        transition-all duration-300 flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-surface-200 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-base font-bold text-surface-900 dark:text-white leading-tight">AzureCost</h1>
                <p className="text-[10px] text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Monitor</p>
              </div>
            )}
          </div>
          <button onClick={closeMobile} className="lg:hidden p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={closeMobile}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-azure-50 dark:bg-azure-900/30 text-azure-600 dark:text-azure-400 shadow-sm'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-100'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
              title={isCollapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="animate-fade-in">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:flex p-3 border-t border-surface-200 dark:border-surface-800">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  )
}
