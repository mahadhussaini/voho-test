import Tenant from '../models/Tenant.js';

/**
 * Middleware to resolve tenant from subdomain or header
 * Supports both subdomain routing and header-based tenant resolution for development
 * Gracefully handles database connection issues
 */
export const tenantMiddleware = async (req, res, next) => {
  try {
    let subdomain = null;

    // Check for tenant in header (for development/testing)
    if (req.headers['x-tenant-subdomain']) {
      subdomain = req.headers['x-tenant-subdomain'];
    } else {
      // Extract subdomain from host
      const host = req.headers.host || '';
      const parts = host.split('.');

      // If host is like "acme.localhost:5000" or "acme.example.com"
      if (parts.length >= 2) {
        subdomain = parts[0];
      }
    }

    // Log tenant resolution for debugging
    console.log('🔍 Tenant resolution:', {
      path: req.path,
      method: req.method,
      host: req.headers.host,
      subdomain: subdomain,
      headerSubdomain: req.headers['x-tenant-subdomain'],
      skipLookup: req.path.startsWith('/api/auth/')
    });

    // Skip tenant lookup for certain paths (like auth routes)
    if (subdomain && !req.path.startsWith('/api/auth/')) {
      try {
        const tenant = await Tenant.findOne({ subdomain, isActive: true });
        if (tenant) {
          req.tenant = tenant;
          req.tenantId = tenant._id;
          console.log('✅ Tenant found:', { subdomain, tenantId: tenant._id, name: tenant.name });
        } else {
          console.log('⚠️ Tenant not found in database:', subdomain);
        }
      } catch (dbError) {
        // If database is not connected, just log and continue
        console.log('⚠️ Database not available for tenant lookup, continuing without tenant:', dbError.message);
      }
    } else if (!subdomain) {
      console.log('⚠️ No subdomain found for tenant lookup');
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next();
  }
};

/**
 * Middleware to require a valid tenant
 */
export const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    console.log('🚫 Tenant access blocked:', {
      path: req.path,
      method: req.method,
      host: req.headers.host,
      subdomain: req.headers['x-tenant-subdomain'],
      user: req.user?.email || 'anonymous'
    });

    return res.status(404).json({
      error: 'Tenant not found',
      message: 'Invalid subdomain or tenant not active. Please check your tenant configuration.'
    });
  }
  next();
};

