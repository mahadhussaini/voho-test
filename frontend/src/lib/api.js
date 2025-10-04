const API_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Get current subdomain from window location
 */
export const getSubdomain = () => {
  const host = window.location.host
  const parts = host.split('.')
  
  // If host is like "acme.localhost:5173" or "acme.example.com"
  if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
    return parts[0]
  }
  
  // For development, check localStorage
  return localStorage.getItem('dev-subdomain') || null
}

/**
 * Make API request with authentication
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = JSON.parse(localStorage.getItem('voho-auth-storage') || '{}')?.state?.token
  const subdomain = getSubdomain()
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  if (subdomain) {
    headers['X-Tenant-Subdomain'] = subdomain
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || 'Request failed')
  }
  
  return response.json()
}

// Auth API
export const auth = {
  signup: (data) => apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}

// Tenant API
export const tenant = {
  getBranding: () => apiRequest('/tenant/branding'),
  
  updateBranding: (data) => apiRequest('/tenant/branding', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  getInfo: () => apiRequest('/tenant/info'),
}

// Calls API
export const calls = {
  create: (data) => apiRequest('/calls', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  getAll: () => apiRequest('/calls'),
  
  getById: (id) => apiRequest(`/calls/${id}`),
  
  getStatus: (id) => apiRequest(`/calls/${id}/status`),
  
  getTranscript: (id) => apiRequest(`/calls/${id}/transcript`),
}

// Dashboard API
export const dashboard = {
  getMetrics: () => apiRequest('/dashboard/metrics'),
  
  getStats: () => apiRequest('/dashboard/stats'),
  
  getAuditLogs: (limit = 50) => apiRequest(`/dashboard/audit-logs?limit=${limit}`),
  
  getUsers: () => apiRequest('/dashboard/users'),
}

