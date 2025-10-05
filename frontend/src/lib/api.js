// Determine API URL based on environment
const API_URL = (() => {
  // Always use VITE_API_URL if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development, use relative path for proxy
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production (Vercel), use full backend URL with /api prefix
  return 'https://voho-saas.onrender.com/api';
})();

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

  // Add timeout to prevent hanging requests
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    console.log(`🔗 Making API request to: ${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))

      // Handle specific error cases
      if (response.status === 404) {
        throw new Error('Service not found. Please check if the backend is running.')
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.')
      } else if (response.status === 503) {
        throw new Error('Service temporarily unavailable. Please try again.')
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.')
      }

      throw new Error(error.error || error.message || 'Request failed')
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.')
    }

    // Log the error for debugging
    console.error('API Request failed:', {
      endpoint: `${API_URL}${endpoint}`,
      error: error.message,
      status: error.status
    });

    throw error
  }
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

