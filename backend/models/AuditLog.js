import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user.login',
      'user.logout',
      'user.signup',
      'user.failed_login',
      'tenant.created',
      'tenant.updated',
      'call.created',
      'call.completed',
      'branding.updated',
      'data.accessed'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

export default mongoose.model('AuditLog', auditLogSchema);

