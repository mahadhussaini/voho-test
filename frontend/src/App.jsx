import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CallsPage from './pages/CallsPage'
import SettingsPage from './pages/SettingsPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/signup" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <SignupPage />
        } />
        <Route path="/login" element={
          isAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
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

