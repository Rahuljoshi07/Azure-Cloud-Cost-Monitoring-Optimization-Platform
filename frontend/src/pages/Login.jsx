import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, useThemeStore } from '../store/useStore'
import { authAPI } from '../lib/api'
import { loginWithAzureAd } from '../lib/msalAuth'
import {
  Hexagon, Mail, Lock, Eye, EyeOff, User, ArrowRight, Sun, Moon,
  Shield, BarChart3, Bell, TrendingDown, Globe, CheckCircle2, Sparkles
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
    { icon: BarChart3, title: 'Real-time Analytics', desc: 'Live dashboards across all subscriptions' },
    { icon: TrendingDown, title: 'Cost Optimization', desc: 'Save up to 40% on cloud spend' },
    { icon: Bell, title: 'Smart Alerts', desc: 'Anomaly detection with thresholds' },
    { icon: Globe, title: 'Multi-Region', desc: 'Monitor all Azure regions' },
  ]

  return (
    <div className="min-h-screen flex bg-[#f0f2f7] dark:bg-[#0a0a1a] relative overflow-hidden">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-20 p-2.5 rounded-xl bg-white/80 dark:bg-navy-800/80 backdrop-blur-xl shadow-medium hover:shadow-elevated transition-all duration-300 hover:scale-105"
      >
        {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-surface-500" />}
      </button>

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-navy-900" />

        {/* Decorative orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-80 h-80 bg-brand-500/15 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-400/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '5s' }} />
        </div>

        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.15]" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
              <Hexagon className="w-6 h-6 text-brand-300" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">CloudFlow</h1>
              <p className="text-[10px] font-semibold text-brand-300/50 uppercase tracking-[0.2em]">Cost Intelligence</p>
            </div>
          </div>

          {/* Hero */}
          <div className="space-y-10 max-w-md">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/10 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
                <span className="text-xs font-semibold text-brand-200">AI-Powered Cloud Analytics</span>
              </div>
              <h2 className="text-4xl xl:text-[2.75rem] font-black text-white leading-[1.15] tracking-tight">
                Intelligent cloud
                <span className="block bg-gradient-to-r from-brand-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  cost management
                </span>
              </h2>
              <p className="text-[15px] text-white/50 mt-5 leading-relaxed">
                Monitor, analyze, and optimize your Azure costs with real-time insights and AI-powered recommendations.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((f, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all duration-300">
                  <f.icon className="w-5 h-5 text-brand-300 mb-3" />
                  <h3 className="text-sm font-bold text-white mb-1">{f.title}</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8">
            {[
              { value: '$2.4M+', label: 'Tracked' },
              { value: '40%', label: 'Savings' },
              { value: '500+', label: 'Resources' },
              { value: '99.9%', label: 'Uptime' },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 h-72 bg-brand-500/[0.05] rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-purple-500/[0.05] rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-[420px] space-y-8 relative z-10 animate-enter">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-neon-brand">
              <Hexagon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-surface-900 dark:text-white">CloudFlow</span>
          </div>

          <div className="card p-8 shadow-elevated">
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
                    <input type="text" placeholder="John Doe" className="input pl-11"
                      value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required={!isLogin} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                  <input type="email" placeholder="you@example.com" className="input pl-11"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-surface-400" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="input pl-11 pr-11"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors">
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full btn-brand py-3.5 flex items-center justify-center gap-2 text-base disabled:opacity-50 hover:shadow-neon-brand transition-all duration-300">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{isLogin ? 'Sign In' : 'Create Account'}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </form>

            {azureAdMode && isLogin && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-200 dark:border-navy-700" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-4 bg-white dark:bg-navy-800 text-surface-400 font-medium">or continue with</span></div>
                </div>
                <button type="button" onClick={handleAzureAdLogin} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-neon-brand disabled:opacity-50">
                  <Shield className="w-5 h-5" />
                  Sign in with Microsoft Azure AD
                </button>
              </>
            )}

            <div className="mt-6 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setError('') }}
                className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-semibold transition-colors">
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-5 p-4 gradient-brand-subtle rounded-xl border border-brand-200/40 dark:border-brand-800/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-500" />
                  <p className="text-xs text-brand-700 dark:text-brand-300 font-bold">Quick Demo Access</p>
                </div>
                <p className="text-xs text-brand-600/70 dark:text-brand-400/70 leading-relaxed">
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
