import express from 'express';
import Tenant from '../models/Tenant.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenant.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * GET /api/tenant/branding
 * Get tenant branding (public)
 */
router.get('/branding', requireTenant, async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      name: tenant.name,
      subdomain: tenant.subdomain,
      branding: tenant.branding
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tenant/branding
 * Update tenant branding (admin only)
 */
router.put('/branding', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { logo, primaryColor, name } = req.body;

    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update fields
    if (name) tenant.name = name;
    if (logo !== undefined) tenant.branding.logo = logo;
    if (primaryColor) tenant.branding.primaryColor = primaryColor;

    await tenant.save();

    // Log audit
    await logAudit({
      tenantId: tenant._id,
      userId: req.userId,
      action: 'branding.updated',
      details: { logo, primaryColor, name },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      name: tenant.name,
      branding: tenant.branding
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenant/info
 * Get full tenant information (authenticated)
 */
router.get('/info', authenticate, async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

export default router;

