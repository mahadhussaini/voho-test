import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { tenant } from '@/lib/api'
import { ArrowRight, Building } from 'lucide-react'

export default function TenantSelectPage() {
  const navigate = useNavigate()
  const [subdomain, setSubdomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!subdomain.trim()) {
      setError('Please enter a tenant subdomain')
      setLoading(false)
      return
    }

    try {
      // Try to get tenant branding to verify tenant exists
      const tenantData = await tenant.getBranding()
      console.log('Tenant found:', tenantData)

      // Store subdomain and redirect to login
      localStorage.setItem('dev-subdomain', subdomain.trim())
      navigate('/login')
    } catch (err) {
      console.log('Tenant not found, proceeding to signup:', err.message)
      // If tenant doesn't exist, redirect to signup
      localStorage.setItem('dev-subdomain', subdomain.trim())
      navigate('/signup')
    } finally {
      setLoading(false)
    }
  }

  const handleSubdomainChange = (e) => {
    // Only allow lowercase letters, numbers, and hyphens
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomain(value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1 pb-4 sm:pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            Welcome to Voho SaaS
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Enter your tenant subdomain to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subdomain" className="text-sm font-medium">
                Tenant Subdomain
              </Label>
              <div className="flex items-center gap-1 sm:gap-2">
                <Input
                  id="subdomain"
                  placeholder="yourcompany"
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  required
                  className="h-10 sm:h-11"
                  autoFocus
                />
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                  .yourapp.com
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                This is the subdomain you or your company uses to access the application
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              disabled={loading || !subdomain.trim()}
            >
              {loading ? 'Checking...' : 'Continue'}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have a tenant? The system will guide you to create one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
