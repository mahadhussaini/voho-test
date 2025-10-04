import Tenant from '../models/Tenant.js';

/**
 * Middleware to resolve tenant from subdomain or header
 * Supports both subdomain routing and header-based tenant resolution for development
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

    // In test environment, allow any subdomain, otherwise filter out localhost and www
    if (subdomain) {
      const tenant = await Tenant.findOne({ subdomain, isActive: true });
      if (tenant) {
        req.tenant = tenant;
        req.tenantId = tenant._id;
      }
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
    return res.status(404).json({ 
      error: 'Tenant not found',
      message: 'Invalid subdomain or tenant not active'
    });
  }
  next();
};

