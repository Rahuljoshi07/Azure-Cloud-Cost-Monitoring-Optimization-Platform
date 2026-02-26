import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore } from '../store/useStore'
import { authAPI } from '../lib/api'
import { loginWithAzureAd } from '../lib/msalAuth'
import { TrendingUp, Mail, Lock, Eye, EyeOff, User, ArrowRight, Sun, Moon, Shield, Bell } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ email: 'demo@azureflow.com', password: 'password123', full_name: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setAuth, azureAdMode } = useAuthStore()
  const { darkMode, toggleTheme } = useThemeStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = isLogin
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register(form)

      setAuth(res.data.user, res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleAzureAdLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await loginWithAzureAd()
      if (result) {
        setAuth(result.user, result.token)
        navigate('/')
      }
    } catch (err) {
      setError('Azure AD login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-azure-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-lg bg-white/80 dark:bg-surface-800/80 backdrop-blur shadow-card hover:shadow-card-hover transition-all z-10"
      >
        {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-surface-500" />}
      </button>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center p-12 relative">
        <div className="max-w-lg space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white">AzureCost Monitor</h1>
              <p className="text-surface-500 dark:text-surface-400">Cloud Cost Optimization Platform</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-azure-100 dark:bg-azure-900/30 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-azure-600 dark:text-azure-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">Real-time Cost Tracking</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Monitor cloud spending across all subscriptions with live dashboards and trend analysis.</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">Smart Recommendations</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">AI-powered optimization suggestions to reduce costs and improve resource utilization.</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white">Anomaly Detection</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Detect cost spikes and unusual spending patterns with budget alerts and notifications.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white">AzureCost Monitor</span>
          </div>

          <div className="glass-card p-8 shadow-glass dark:shadow-glass-dark">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                {isLogin ? 'Sign in to your cloud monitoring dashboard' : 'Get started with cost monitoring'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                    <input
                      type="text" placeholder="John Doe"
                      className="input-field pl-10"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="email" placeholder="you@example.com"
                    className="input-field pl-10"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="input-field pl-10 pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Account'}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-azure-500 hover:text-azure-600 dark:text-azure-400 dark:hover:text-azure-300 font-medium"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-4 p-3 bg-azure-50 dark:bg-azure-900/20 rounded-lg border border-azure-100 dark:border-azure-800">
                <p className="text-xs text-azure-600 dark:text-azure-400 font-medium">Demo Credentials</p>
                <p className="text-xs text-azure-500 dark:text-azure-500 mt-1">demo@azureflow.com / password123</p>
              </div>
            )}

            {/* Azure AD Sign-In */}
            {azureAdMode && isLogin && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white dark:bg-surface-800 text-surface-400">or</span></div>
                </div>
                <button
                  type="button"
                  onClick={handleAzureAdLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0078d4] hover:bg-[#006cbe] text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  <Shield className="w-5 h-5" />
                  Sign in with Microsoft Azure AD
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
