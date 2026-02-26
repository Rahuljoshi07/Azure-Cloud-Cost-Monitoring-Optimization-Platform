import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore, useSidebarStore } from '../store/useStore'
import { Menu, Sun, Moon, Bell, ChevronDown, LogOut, User, Settings, Search, Command } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { darkMode, toggleTheme } = useThemeStore()
  const { toggleMobile } = useSidebarStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <header className="h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-2xl border-b border-surface-200/50 dark:border-navy-700/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobile} className="lg:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-navy-800 transition-colors">
          <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </button>

        <div className="hidden md:block">
          <p className="text-[11px] font-medium text-surface-400 dark:text-surface-500">{greeting},</p>
          <p className="text-sm font-bold text-surface-900 dark:text-white">{user?.full_name || 'User'}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-surface-100/80 dark:bg-navy-800/80 rounded-xl border border-surface-200/40 dark:border-navy-700/40 w-80 text-surface-400 cursor-pointer hover:border-brand-300/40 dark:hover:border-brand-700/40 transition-colors">
        <Search className="w-4 h-4" />
        <span className="text-sm">Search resources...</span>
        <div className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-surface-400 bg-white dark:bg-navy-700 px-1.5 py-0.5 rounded border border-surface-200 dark:border-navy-600">
          <Command className="w-3 h-3" />K
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-navy-800 transition-all duration-200"
        >
          {darkMode
            ? <Sun className="w-[18px] h-[18px] text-amber-400" />
            : <Moon className="w-[18px] h-[18px] text-surface-400" />
          }
        </button>

        <button className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-navy-800 transition-colors relative">
          <Bell className="w-[18px] h-[18px] text-surface-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-navy-900 animate-pulse-dot" />
        </button>

        <div className="w-px h-8 bg-surface-200 dark:bg-navy-700 mx-1.5" />

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-surface-100 dark:hover:bg-navy-800 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-surface-900 dark:text-white leading-tight">{user?.full_name}</p>
              <p className="text-[10px] text-surface-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-surface-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 card-elevated py-1.5 animate-enter z-50">
              <div className="px-4 py-3 border-b border-surface-100 dark:border-navy-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white text-sm font-bold shadow-neon-brand">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">{user?.full_name}</p>
                    <p className="text-xs text-surface-400">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="badge badge-brand capitalize">{user?.role}</span>
                </div>
              </div>

              <div className="py-1">
                <button onClick={() => { setProfileOpen(false); navigate('/settings') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { setProfileOpen(false); navigate('/settings') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-navy-800 transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>

              <div className="border-t border-surface-100 dark:border-navy-700 pt-1">
                <button
                  onClick={() => { logout(); window.location.href = '/login' }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
