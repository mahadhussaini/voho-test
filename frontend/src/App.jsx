import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { getSubdomain } from './lib/api'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import TenantSelectPage from './pages/TenantSelectPage'
import DashboardPage from './pages/DashboardPage'
import CallsPage from './pages/CallsPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function TenantRoute({ children }) {
  const subdomain = getSubdomain()
  const { isAuthenticated } = useAuthStore()

  // If user is authenticated and has a tenant, allow access
  if (isAuthenticated() && subdomain) {
    return children
  }

  // If user is authenticated but no tenant subdomain, redirect to tenant selection
  if (isAuthenticated() && !subdomain) {
    return <Navigate to="/select-tenant" replace />
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public routes */}
        <Route path="/select-tenant" element={
          isAuthenticated() ? <TenantSelectPage /> : <Navigate to="/login" replace />
        } />

        <Route path="/signup" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <SignupPage />
        } />

        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />

        {/* Protected routes - require authentication and tenant */}
        <Route path="/" element={
          <TenantRoute>
            <Layout />
          </TenantRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calls" element={<CallsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

