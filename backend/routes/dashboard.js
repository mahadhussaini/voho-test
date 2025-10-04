import express from 'express';
import Call from '../models/Call.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics
 */
router.get('/metrics', authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';

    // Base query for tenant isolation
    const baseQuery = { tenantId: req.tenantId };
    
    // Non-admins can only see their own data
    const userQuery = isAdmin ? baseQuery : { ...baseQuery, userId: req.userId };

    // Get metrics
    const [totalCalls, completedCalls, activeCalls, totalUsers] = await Promise.all([
      Call.countDocuments(userQuery),
      Call.countDocuments({ ...userQuery, status: 'completed' }),
      Call.countDocuments({ ...userQuery, status: { $in: ['queued', 'ringing', 'in_progress'] } }),
      isAdmin ? User.countDocuments(baseQuery) : Promise.resolve(null)
    ]);

    // Get recent activity
    const recentCalls = await Call.find(userQuery)
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate average call duration
    const durationStats = await Call.aggregate([
      { $match: { ...userQuery, duration: { $exists: true, $ne: null } } },
      { 
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    res.json({
      metrics: {
        totalCalls,
        completedCalls,
        activeCalls,
        totalUsers,
        avgCallDuration: durationStats[0]?.avgDuration || 0,
        totalCallDuration: durationStats[0]?.totalDuration || 0
      },
      recentCalls,
      userRole: req.user.role
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/audit-logs
 * Get audit logs (admin only)
 */
router.get('/audit-logs', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const logs = await AuditLog.find({ tenantId: req.tenantId })
      .populate('userId', 'email role')
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json(logs);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/users
 * Get all users (admin only)
 */
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenantId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/stats
 * Get real-time statistics
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const baseQuery = { tenantId: req.tenantId };
    const userQuery = isAdmin ? baseQuery : { ...baseQuery, userId: req.userId };

    // Get call status breakdown
    const statusBreakdown = await Call.aggregate([
      { $match: userQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get calls over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const callsOverTime = await Call.aggregate([
      { 
        $match: { 
          ...userQuery,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      statusBreakdown,
      callsOverTime
    });
  } catch (error) {
    next(error);
  }
});

export default router;

