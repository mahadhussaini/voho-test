import express from 'express';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { generateToken } from '../utils/jwt.js';
import { logAudit } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Create new tenant and admin user
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, subdomain, tenantName } = req.body;

    // Validation
    if (!email || !password || !subdomain || !tenantName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if subdomain exists
    const existingTenant = await Tenant.findOne({ subdomain });
    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    // Create tenant
    const tenant = await Tenant.create({
      subdomain,
      name: tenantName
    });

    // Create admin user
    const user = await User.create({
      email,
      password,
      tenantId: tenant._id,
      role: 'admin'
    });

    // Log audit
    await logAudit({
      tenantId: tenant._id,
      userId: user._id,
      action: 'tenant.created',
      details: { subdomain, tenantName },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    await logAudit({
      tenantId: tenant._id,
      userId: user._id,
      action: 'user.signup',
      details: { email, role: 'admin' },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Generate token
    const token = generateToken(user._id, tenant._id);

    res.status(201).json({
      token,
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        branding: tenant.branding
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!req.tenantId) {
      return res.status(400).json({ error: 'Tenant not found' });
    }

    // Find user by email and tenant
    const user = await User.findOne({ email, tenantId: req.tenantId, isActive: true });

    if (!user || !(await user.comparePassword(password))) {
      await logAudit({
        tenantId: req.tenantId,
        action: 'user.failed_login',
        details: { email },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get tenant info
    const tenant = await Tenant.findById(req.tenantId);

    // Log successful login
    await logAudit({
      tenantId: tenant._id,
      userId: user._id,
      action: 'user.login',
      details: { email },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Generate token
    const token = generateToken(user._id, tenant._id);

    res.json({
      token,
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        subdomain: tenant.subdomain,
        name: tenant.name,
        branding: tenant.branding
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

