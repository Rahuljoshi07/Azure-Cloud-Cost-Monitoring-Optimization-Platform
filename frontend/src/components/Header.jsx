import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore, useSidebarStore } from '../store/useStore'
import { Menu, Sun, Moon, Bell, ChevronDown, LogOut, User, Settings, Search, Sparkles } from 'lucide-react'

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
    <header className="h-16 bg-white/70 dark:bg-surface-900/70 backdrop-blur-2xl border-b border-surface-200/60 dark:border-surface-800/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobile} className="lg:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <Menu className="w-5 h-5 text-surface-600 dark:text-surface-400" />
        </button>

        <div className="hidden md:block">
          <p className="text-xs font-medium text-surface-400 dark:text-surface-500">{greeting},</p>
          <p className="text-sm font-bold text-surface-900 dark:text-white">{user?.full_name || 'User'}</p>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-1.5">
        {/* Search Button */}
        <button className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
          <Search className="w-[18px] h-[18px]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
        >
          {darkMode
            ? <Sun className="w-[18px] h-[18px] text-amber-400" />
            : <Moon className="w-[18px] h-[18px] text-surface-400" />
          }
        </button>

        {/* Notifications */}
        <button className="p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative">
          <Bell className="w-[18px] h-[18px] text-surface-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-surface-900" />
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-surface-200 dark:bg-surface-700 mx-1.5" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-surface-900 dark:text-white leading-tight">{user?.full_name}</p>
              <p className="text-[10px] text-surface-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-surface-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 glass-card py-1.5 animate-slide-up shadow-card-elevated z-50">
              <div className="px-4 py-3 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">{user?.full_name}</p>
                    <p className="text-xs text-surface-400">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="badge badge-low capitalize">{user?.role}</span>
                  <span className="flex items-center gap-1 text-[10px] text-azure-500 font-medium">
                    <Sparkles className="w-3 h-3" /> Pro
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button onClick={() => { setProfileOpen(false); navigate('/settings') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { setProfileOpen(false); navigate('/settings') }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </button>
              </div>

              <div className="border-t border-surface-100 dark:border-surface-800 pt-1">
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
