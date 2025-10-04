import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenant.js';
import callRoutes from './routes/calls.js';
import dashboardRoutes from './routes/dashboard.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Tenant resolution middleware
app.use(tenantMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    tenant: req.tenant?.subdomain || 'none',
    tenantId: req.tenantId || 'none',
    subdomain: req.headers['x-tenant-subdomain'] || 'none'
  });
});

// Error handling
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

export default app;

