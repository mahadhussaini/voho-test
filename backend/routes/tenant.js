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
router.get('/branding', async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get tenant info (with error handling)
    let tenant;
    try {
      tenant = await Tenant.findById(req.tenantId);
    } catch (dbError) {
      console.error('❌ Database not available for tenant lookup:', dbError.message);
      return res.status(500).json({ error: 'Service temporarily unavailable. Please try again.' });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json({
      name: tenant.name,
      subdomain: tenant.subdomain,
      branding: tenant.branding
    });
  } catch (error) {
    console.error('❌ Branding lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/tenant/branding
 * Update tenant branding (admin only)
 */
router.put('/branding', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { logo, primaryColor, name } = req.body;

    if (!req.tenantId) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get tenant info (with error handling)
    let tenant;
    try {
      tenant = await Tenant.findById(req.tenantId);
    } catch (dbError) {
      console.error('❌ Database not available for tenant lookup:', dbError.message);
      return res.status(500).json({ error: 'Service temporarily unavailable. Please try again.' });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update fields
    if (name) tenant.name = name;
    if (logo !== undefined) tenant.branding.logo = logo;
    if (primaryColor) tenant.branding.primaryColor = primaryColor;

    // Save tenant (with error handling)
    try {
      await tenant.save();
    } catch (dbError) {
      console.error('❌ Failed to save tenant:', dbError.message);
      return res.status(500).json({ error: 'Failed to update tenant. Please try again.' });
    }

    // Log audit (with error handling)
    try {
      await logAudit({
        tenantId: tenant._id,
        userId: req.userId,
        action: 'branding.updated',
        details: { logo, primaryColor, name },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditError) {
      console.log('⚠️ Failed to log branding update:', auditError.message);
    }

    res.json({
      name: tenant.name,
      branding: tenant.branding
    });
  } catch (error) {
    console.error('❌ Branding update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tenant/info
 * Get full tenant information (authenticated)
 */
router.get('/info', authenticate, async (req, res, next) => {
  try {
    if (!req.tenantId) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get tenant info (with error handling)
    let tenant;
    try {
      tenant = await Tenant.findById(req.tenantId);
    } catch (dbError) {
      console.error('❌ Database not available for tenant info lookup:', dbError.message);
      return res.status(500).json({ error: 'Service temporarily unavailable. Please try again.' });
    }

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    res.json(tenant);
  } catch (error) {
    console.error('❌ Tenant info lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

