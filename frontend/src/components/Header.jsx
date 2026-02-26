import { useState, useRef, useEffect } from 'react'
import { useAuthStore, useThemeStore, useSidebarStore } from '../store/useStore'
import { Menu, Sun, Moon, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { darkMode, toggleTheme } = useThemeStore()
  const { toggleMobile } = useSidebarStore()
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'

  return (
    <header className="h-16 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleMobile} className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:block">
          <p className="text-xs text-surface-500 dark:text-surface-400">Welcome back,</p>
          <p className="text-sm font-semibold text-surface-900 dark:text-white">{user?.full_name || 'User'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-surface-500" />}
        </button>

        {/* Notifications */}
        <button className="p-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200 relative">
          <Bell className="w-5 h-5 text-surface-500 dark:text-surface-400" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-surface-900"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 glass-card py-2 animate-fade-in shadow-lg z-50">
              <div className="px-4 py-2 border-b border-surface-100 dark:border-surface-800">
                <p className="text-sm font-semibold text-surface-900 dark:text-white">{user?.full_name}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400">{user?.email}</p>
                <span className="badge badge-low mt-1 capitalize">{user?.role}</span>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <User className="w-4 h-4" /> Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-surface-100 dark:border-surface-800 mt-1 pt-1">
                <button
                  onClick={() => { logout(); window.location.href = '/login'; }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
