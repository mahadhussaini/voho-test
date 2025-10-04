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
  console.log('🔐 Signup request received:', { email: req.body.email, subdomain: req.body.subdomain });

  try {
    const { email, password, subdomain, tenantName } = req.body;

    // Validation
    if (!email || !password || !subdomain || !tenantName) {
      console.log('❌ Signup validation failed: missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      console.log('❌ Signup validation failed: password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if subdomain exists (with error handling)
    let existingTenant;
    try {
      existingTenant = await Tenant.findOne({ subdomain });
    } catch (dbError) {
      console.log('⚠️ Database not available for subdomain check, proceeding with signup');
    }

    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    // Create tenant (with error handling)
    let tenant;
    try {
      tenant = await Tenant.create({
        subdomain,
        name: tenantName
      });
    } catch (dbError) {
      console.error('❌ Failed to create tenant:', dbError.message);
      return res.status(500).json({ error: 'Failed to create tenant. Please try again.' });
    }

    // Create admin user (with error handling)
    let user;
    try {
      user = await User.create({
        email,
        password,
        tenantId: tenant._id,
        role: 'admin'
      });
    } catch (dbError) {
      console.error('❌ Failed to create user:', dbError.message);
      // Clean up tenant if user creation fails
      try {
        await Tenant.findByIdAndDelete(tenant._id);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup tenant:', cleanupError.message);
      }
      return res.status(500).json({ error: 'Failed to create user account. Please try again.' });
    }

    // Log audit (with error handling)
    try {
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
    } catch (auditError) {
      console.log('⚠️ Failed to log audit events:', auditError.message);
      // Don't fail the signup if audit logging fails
    }

    // Generate token
    const token = generateToken(user._id, tenant._id);

    console.log('✅ Signup successful for user:', email, 'tenant:', subdomain);

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
    console.error('❌ Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user
 */
router.post('/login', async (req, res, next) => {
  console.log('🔐 Login request received:', { email: req.body.email });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Login validation failed: missing email or password');
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email (with error handling for database issues)
    let user;
    try {
      user = await User.findOne({ email, isActive: true });
    } catch (dbError) {
      console.error('❌ Database not available for user lookup:', dbError.message);
      return res.status(500).json({ error: 'Service temporarily unavailable. Please try again.' });
    }

    if (!user || !(await user.comparePassword(password))) {
      // Log failed login attempt (with error handling)
      try {
        await logAudit({
          action: 'user.failed_login',
          details: { email },
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (auditError) {
        console.log('⚠️ Failed to log failed login:', auditError.message);
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get tenant info (with error handling)
    let tenant;
    try {
      tenant = await Tenant.findById(user.tenantId);
    } catch (dbError) {
      console.error('❌ Database not available for tenant lookup:', dbError.message);
      return res.status(500).json({ error: 'Service temporarily unavailable. Please try again.' });
    }

    // Log successful login (with error handling)
    try {
      await logAudit({
        tenantId: tenant._id,
        userId: user._id,
        action: 'user.login',
        details: { email },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
    } catch (auditError) {
      console.log('⚠️ Failed to log successful login:', auditError.message);
    }

    // Generate token
    const token = generateToken(user._id, tenant._id);

    console.log('✅ Login successful for user:', email, 'tenant:', tenant.subdomain);

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
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

