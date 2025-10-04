import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from './ui/button'
import { LayoutDashboard, Phone, Settings, LogOut, Shield, Menu, X } from 'lucide-react'

// Utility function to convert hex color to hue rotation
const getHueFromColor = (hexColor) => {
  if (!hexColor || !hexColor.startsWith('#')) return 0;

  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / (max - min) + 2) / 6;
  } else {
    h = ((r - g) / (max - min) + 4) / 6;
  }

  // Convert to degrees for CSS hue-rotate
  return Math.round(h * 360) - 210; // Offset to match blue theme
};

export default function Layout() {
  const { user, tenant, logout, isAdmin } = useAuthStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calls', href: '/calls', icon: Phone },
    { name: 'Settings', href: '/settings', icon: Settings, adminOnly: true },
  ]

  const isActive = (href) => location.pathname === href

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-4">
              <img
                src="/logo.svg"
                alt="Voho SaaS Logo"
                className="h-6 sm:h-8 lg:h-10 w-auto"
                style={{ filter: tenant?.branding?.primaryColor ? `hue-rotate(${getHueFromColor(tenant.branding.primaryColor)}deg)` : 'none' }}
              />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate" style={{ color: tenant?.branding?.primaryColor }}>
                {tenant?.name || 'Voho SaaS'}
              </h1>
            </div>

            {/* User info and logout */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                  {user?.email}
                </span>
                {isAdmin() && (
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)] sm:min-h-[calc(100vh-73px)]">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:min-h-[calc(100vh-73px)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile user info */}
            <div className="p-4 border-b md:hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{user?.email}</span>
                {isAdmin() && <Shield className="h-4 w-4 text-primary flex-shrink-0" />}
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                if (item.adminOnly && !isAdmin()) return null

                return (
                  <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}>
                    <Button
                      variant={isActive(item.href) ? 'default' : 'ghost'}
                      className="w-full justify-start text-sm sm:text-base"
                    >
                      <item.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                      {item.name}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

