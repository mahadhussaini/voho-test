import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Verify tenant matches (critical for tenant isolation)
    if (req.tenantId && user.tenantId.toString() !== req.tenantId.toString()) {
      await logAudit({
        tenantId: req.tenantId,
        userId: user._id,
        action: 'data.accessed',
        details: { 
          violation: 'cross_tenant_access_attempt',
          requestedTenant: req.tenantId,
          userTenant: user.tenantId
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      return res.status(403).json({ 
        error: 'Access denied',
        message: 'Tenant mismatch - security violation logged'
      });
    }

    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
};

/**
 * Require admin role
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'Admin role required'
    });
  }
  next();
};

