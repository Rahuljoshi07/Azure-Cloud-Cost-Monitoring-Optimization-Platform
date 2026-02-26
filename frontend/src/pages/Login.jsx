import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore } from '../store/useStore'
import { authAPI } from '../lib/api'
import { loginWithAzureAd } from '../lib/msalAuth'
import {
  Zap, Mail, Lock, Eye, EyeOff, User, ArrowRight, Sun, Moon,
  Shield, BarChart3, Bell, TrendingDown, Globe, CheckCircle2
} from 'lucide-react'

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

  const features = [
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards with trend analysis across all subscriptions', color: 'from-azure-500 to-blue-600' },
    { icon: TrendingDown, title: 'Cost Optimization', desc: 'AI-powered recommendations saving up to 40% on cloud spend', color: 'from-emerald-500 to-teal-500' },
    { icon: Bell, title: 'Smart Alerts', desc: 'Instant anomaly detection with customizable budget thresholds', color: 'from-amber-400 to-orange-500' },
    { icon: Globe, title: 'Multi-Region View', desc: 'Unified monitoring across all Azure regions and subscriptions', color: 'from-violet-500 to-purple-600' },
  ]

  const stats = [
    { value: '$2.4M+', label: 'Cost Tracked' },
    { value: '40%', label: 'Avg Savings' },
    { value: '500+', label: 'Resources' },
    { value: '99.9%', label: 'Uptime' },
  ]

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-950 relative overflow-hidden">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-2.5 rounded-xl bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-105"
      >
        {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-surface-500" />}
      </button>

      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-azure-600 via-blue-700 to-indigo-800" />

        {/* Animated Mesh Overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-300/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">AzureCost Monitor</h1>
              <p className="text-xs font-medium text-white/60 uppercase tracking-widest">Cloud Optimization Platform</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-8 max-w-lg">
            <div>
              <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
                Take control of your
                <span className="block mt-1 bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300 bg-clip-text text-transparent">
                  cloud spending
                </span>
              </h2>
              <p className="text-base text-white/70 mt-4 leading-relaxed max-w-md">
                Monitor, analyze, and optimize your Azure costs with intelligent insights and real-time tracking.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 hover:bg-white/[0.12] transition-all duration-300 group"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 pt-4">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-extrabold text-white tracking-tight">{s.value}</p>
                <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-azure-500/[0.06] rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/[0.06] rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-glow-blue">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold text-surface-900 dark:text-white">AzureCost</span>
          </div>

          <div className="glass-card p-8 shadow-card-elevated">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-surface-900 dark:text-white tracking-tight">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-1.5">
                {isLogin ? 'Sign in to your cloud monitoring dashboard' : 'Get started with cost monitoring'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                    <input
                      type="text" placeholder="John Doe"
                      className="input-field pl-11"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                  <input
                    type="email" placeholder="you@example.com"
                    className="input-field pl-11"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="input-field pl-11 pr-11"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-50 hover:shadow-glow-blue transition-all duration-300"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Account'}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            {/* Azure AD Sign-In */}
            {azureAdMode && isLogin && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-surface-700" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-4 bg-white dark:bg-surface-800 text-surface-400 font-medium">or continue with</span></div>
                </div>
                <button
                  type="button"
                  onClick={handleAzureAdLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#0078d4] hover:bg-[#006cbe] text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-glow-blue disabled:opacity-50"
                >
                  <Shield className="w-5 h-5" />
                  Sign in with Microsoft Azure AD
                </button>
              </>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm text-azure-500 hover:text-azure-600 dark:text-azure-400 dark:hover:text-azure-300 font-semibold transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-5 p-4 bg-gradient-to-r from-azure-50 to-indigo-50 dark:from-azure-900/20 dark:to-indigo-900/20 rounded-xl border border-azure-100 dark:border-azure-800/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-azure-500" />
                  <p className="text-xs text-azure-700 dark:text-azure-300 font-bold">Quick Demo Access</p>
                </div>
                <p className="text-xs text-azure-500/80 dark:text-azure-400/80 leading-relaxed">
                  demo@azureflow.com / password123
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
