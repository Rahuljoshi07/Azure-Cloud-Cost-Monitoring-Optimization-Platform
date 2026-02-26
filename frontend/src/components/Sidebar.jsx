import { NavLink, useLocation } from 'react-router-dom'
import { useSidebarStore } from '../store/useStore'
import {
  LayoutDashboard, BarChart3, Server, Lightbulb,
  Bell, FileText, Settings, X, ChevronLeft, Zap
} from 'lucide-react'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/costs', icon: BarChart3, label: 'Cost Analysis' },
  { path: '/resources', icon: Server, label: 'Resources' },
  { path: '/recommendations', icon: Lightbulb, label: 'Optimize' },
  { path: '/alerts', icon: Bell, label: 'Alerts & Budgets' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebarStore()
  const location = useLocation()

  return (
    <>
      {mobileOverlay()}

      <aside className={`
        fixed top-0 left-0 h-screen z-50 flex flex-col
        bg-white dark:bg-surface-900 border-r border-surface-200/80 dark:border-surface-800/80
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-[260px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-surface-100 dark:border-surface-800 ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          {isCollapsed ? (
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-blue">
              <Zap className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-glow-blue flex-shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-surface-900 dark:text-white tracking-tight">AzureCost</h1>
                <p className="text-[10px] font-medium text-surface-400 dark:text-surface-500 uppercase tracking-widest">Monitor</p>
              </div>
            </div>
          )}
          <button onClick={closeMobile} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div className="space-y-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={closeMobile}
                  title={isCollapsed ? label : undefined}
                  className={`sidebar-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-azure-500' : ''}`} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Collapse Toggle */}
        <div className={`hidden lg:flex items-center border-t border-surface-100 dark:border-surface-800 ${isCollapsed ? 'justify-center p-2' : 'px-3 py-3'}`}>
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-all"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          {!isCollapsed && <span className="text-[11px] text-surface-400 ml-2">Collapse</span>}
        </div>
      </aside>
    </>
  )

  function mobileOverlay() {
    if (!isMobileOpen) return null
    return <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={closeMobile} />
  }
}
