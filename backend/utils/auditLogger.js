import AuditLog from '../models/AuditLog.js';

/**
 * Log audit events for security and compliance
 */
export const logAudit = async ({ tenantId, userId, action, details, ip, userAgent }) => {
  try {
    await AuditLog.create({
      tenantId,
      userId,
      action,
      details,
      ip,
      userAgent,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

