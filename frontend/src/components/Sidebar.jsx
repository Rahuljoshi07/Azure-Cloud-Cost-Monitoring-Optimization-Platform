import { NavLink, useLocation } from 'react-router-dom'
import { useSidebarStore } from '../store/useStore'
import {
  LayoutDashboard, BarChart3, Server, Lightbulb,
  Bell, FileText, Settings, X, ChevronLeft, Hexagon
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
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade" onClick={closeMobile} />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen z-50 flex flex-col
        bg-sidebar-glow shadow-sidebar
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[68px]' : 'w-[250px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-white/[0.06] ${isCollapsed ? 'justify-center px-2' : 'px-5'}`}>
          {isCollapsed ? (
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-neon-brand">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-neon-brand flex-shrink-0">
                <Hexagon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-white tracking-tight">CloudFlow</h1>
                <p className="text-[10px] font-medium text-brand-300/60 uppercase tracking-[0.15em]">cost intel</p>
              </div>
            </div>
          )}
          <button onClick={closeMobile} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-white/10 text-surface-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section Label */}
        {!isCollapsed && (
          <div className="px-5 pt-5 pb-2">
            <p className="text-[10px] font-bold text-surface-500/60 uppercase tracking-[0.2em]">Navigation</p>
          </div>
        )}

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 pt-4' : 'px-3'}`}>
          <div className="space-y-1">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
              return (
                <NavLink
                  key={path}
                  to={path}
                  onClick={closeMobile}
                  title={isCollapsed ? label : undefined}
                  className={`nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-brand-400' : ''}`} />
                  {!isCollapsed && <span className="truncate">{label}</span>}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Bottom Status */}
        {!isCollapsed && (
          <div className="mx-3 mb-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-neon-emerald" />
              <span className="text-[11px] font-semibold text-emerald-400">System Online</span>
            </div>
            <p className="text-[10px] text-surface-500 leading-relaxed">All services operational</p>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className={`hidden lg:flex items-center border-t border-white/[0.06] ${isCollapsed ? 'justify-center p-2' : 'px-3 py-3'}`}>
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-xl hover:bg-white/[0.06] text-surface-500 hover:text-surface-300 transition-all"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          {!isCollapsed && <span className="text-[11px] text-surface-500 ml-2">Collapse</span>}
        </div>
      </aside>
    </>
  )
}
