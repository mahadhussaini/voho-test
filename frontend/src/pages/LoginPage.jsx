import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth, tenant } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { getSubdomain } from '@/lib/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [subdomain, setSubdomain] = useState('')
  const [tenantInfo, setTenantInfo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get subdomain and load tenant branding
    const currentSubdomain = getSubdomain()
    setSubdomain(currentSubdomain)
    
    if (currentSubdomain) {
      tenant.getBranding()
        .then(data => setTenantInfo(data))
        .catch(() => setError('Tenant not found'))
    } else {
      // For development, allow setting subdomain
      const devSubdomain = localStorage.getItem('dev-subdomain')
      if (devSubdomain) {
        setSubdomain(devSubdomain)
      }
    }
  }, [])

  const handleSubdomainChange = (e) => {
    const sub = e.target.value
    setSubdomain(sub)
    localStorage.setItem('dev-subdomain', sub)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!subdomain) {
      setError('Please enter a subdomain')
      setLoading(false)
      return
    }

    try {
      const response = await auth.login(formData)
      setAuth(response.token, response.user, response.tenant)

      // Save subdomain for development
      localStorage.setItem('dev-subdomain', response.tenant.subdomain)

      navigate('/dashboard')
    } catch (err) {
      console.error('Login error:', err.message)

      // Provide user-friendly error messages
      if (err.message.includes('Service not found')) {
        setError('Backend service is not available. Please try again in a few moments.')
      } else if (err.message.includes('Server error')) {
        setError('Server is experiencing issues. Please try again later.')
      } else if (err.message.includes('temporarily unavailable')) {
        setError('Service is temporarily unavailable. Please try again.')
      } else if (err.message.includes('Request timed out')) {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            {tenantInfo ? `Welcome to ${tenantInfo.name}` : 'Login'}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain" className="text-sm font-medium">Subdomain</Label>
              <Input
                id="subdomain"
                placeholder="acme"
                value={subdomain}
                onChange={handleSubdomainChange}
                required
                className="h-10 sm:h-11"
              />
              <p className="text-xs text-muted-foreground">
                Your company subdomain (for development)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-10 sm:h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-10 sm:h-11"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center text-sm">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

