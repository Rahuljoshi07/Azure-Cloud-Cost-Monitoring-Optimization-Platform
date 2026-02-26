import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore, useThemeStore } from './store/useStore'
import { initMsal } from './lib/msalAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CostBreakdown from './pages/CostBreakdown'
import Resources from './pages/Resources'
import Recommendations from './pages/Recommendations'
import AlertsBudgets from './pages/AlertsBudgets'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { initTheme } = useThemeStore()
  const { setAzureAdMode } = useAuthStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initTheme()

    // Try to initialise MSAL (non-blocking — returns null when Azure AD is off)
    initMsal().then((instance) => {
      if (instance) {
        setAzureAdMode(true)
        console.log('[App] Azure AD enabled')
      }
      setReady(true)
    })
  }, [initTheme, setAzureAdMode])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-azure-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="costs" element={<CostBreakdown />} />
          <Route path="resources" element={<Resources />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="alerts" element={<AlertsBudgets />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}
