import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ultravoxCallId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['queued', 'ringing', 'in_progress', 'completed', 'failed', 'ended'],
    default: 'queued'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  events: [{
    type: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: mongoose.Schema.Types.Mixed
  }],
  recordingUrl: String,
  transcript: String,
  duration: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Call', callSchema);

