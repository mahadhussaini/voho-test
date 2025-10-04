import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  subdomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[a-z0-9-]+$/.test(v);
      },
      message: 'Subdomain can only contain lowercase letters, numbers, and hyphens'
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  branding: {
    logo: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#3b82f6'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Tenant', tenantSchema);

