import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'

export default function SignupPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    subdomain: '',
    tenantName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await auth.signup(formData)
      setAuth(response.token, response.user, response.tenant)
      
      // Save subdomain for development
      localStorage.setItem('dev-subdomain', response.tenant.subdomain)
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 pb-4 sm:pb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">Create Account</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Start your multi-tenant SaaS journey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantName" className="text-sm font-medium">Company Name</Label>
              <Input
                id="tenantName"
                placeholder="Acme Corporation"
                value={formData.tenantName}
                onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                required
                className="h-10 sm:h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain" className="text-sm font-medium">Subdomain</Label>
              <div className="flex items-center gap-1 sm:gap-2">
                <Input
                  id="subdomain"
                  placeholder="acme"
                  value={formData.subdomain}
                  onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                  required
                  className="h-10 sm:h-11"
                />
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">.yourapp.com</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@acme.com"
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
                minLength={6}
                className="h-10 sm:h-11"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

