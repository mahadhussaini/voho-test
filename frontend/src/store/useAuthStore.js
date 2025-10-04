import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenant: null,
      
      setAuth: (token, user, tenant) => {
        set({ token, user, tenant })
      },
      
      logout: () => {
        set({ token: null, user: null, tenant: null })
      },
      
      isAuthenticated: () => {
        return !!get().token
      },
      
      isAdmin: () => {
        return get().user?.role === 'admin'
      },
      
      updateTenantBranding: (branding) => {
        set(state => ({
          tenant: { ...state.tenant, branding }
        }))
      }
    }),
    {
      name: 'voho-auth-storage',
    }
  )
)

