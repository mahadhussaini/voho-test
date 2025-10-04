import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { tenant } from '@/lib/api'
import { useAuthStore } from '@/store/useAuthStore'
import { Save, Palette } from 'lucide-react'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { tenant: currentTenant, updateTenantBranding } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: currentTenant?.name || '',
    logo: currentTenant?.branding?.logo || '',
    primaryColor: currentTenant?.branding?.primaryColor || '#3b82f6',
  })
  const [success, setSuccess] = useState(false)

  const updateBrandingMutation = useMutation({
    mutationFn: (data) => tenant.updateBranding(data),
    onSuccess: (data) => {
      updateTenantBranding(data.branding)
      queryClient.invalidateQueries(['tenant'])
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateBrandingMutation.mutate(formData)
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Manage your tenant branding and configuration
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-lg sm:text-xl">Branding</CardTitle>
          </div>
          <CardDescription className="text-sm">
            Customize your tenant&apos;s appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Corporation"
                className="h-10 sm:h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm font-medium">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="h-10 sm:h-11"
              />
              {formData.logo && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">Logo Preview:</p>
                  <img
                    src={formData.logo}
                    alt="Logo preview"
                    className="h-8 sm:h-12 object-contain"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Custom logos will be displayed alongside the Voho brand
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-sm font-medium">Primary Color</Label>
              <div className="flex gap-2 sm:gap-4 items-center">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-16 sm:w-24 h-10 sm:h-12"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 h-10 sm:h-11"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            {success && (
              <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
                Branding updated successfully!
              </div>
            )}

            {updateBrandingMutation.isError && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                Error: {updateBrandingMutation.error.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={updateBrandingMutation.isPending}
              className="w-full sm:w-auto h-10 sm:h-11"
            >
              {updateBrandingMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Tenant Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-2">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Subdomain</p>
            <p className="font-medium text-sm sm:text-base break-all">{currentTenant?.subdomain}.yourapp.com</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">Tenant ID</p>
            <p className="font-mono text-xs sm:text-sm break-all">{currentTenant?.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

