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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS configuration for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://voho-saas.vercel.app',
  'https://voho-saas-3qm8fabcj-mahad-arshads-projects.vercel.app', // Current Vercel deployment
  'https://voho-saas-mi3lqi5ab-mahad-arshads-projects.vercel.app', // Previous Vercel deployment
  'http://localhost:5173',
  'http://localhost:3000',
  'https://localhost:5173',
  'https://localhost:3000'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowed request with no origin (mobile app, curl, etc.)');
      return callback(null, true);
    }

    // Allow all Vercel deployments (*.vercel.app)
    if (origin && origin.endsWith('.vercel.app')) {
      console.log('✅ Allowed CORS request from Vercel:', origin);
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      console.log('✅ Allowed CORS request from localhost:', origin);
      return callback(null, true);
    }

    // Check explicitly allowed origins
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Allowed CORS request from allowed origin:', origin);
      return callback(null, true);
    }

    // Block all other origins
    console.log('❌ Blocked CORS request from:', origin);
    console.log('Allowed origins:', allowedOrigins);
    console.log('Environment FRONTEND_URL:', process.env.FRONTEND_URL);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain', 'Accept', 'Origin', 'User-Agent']
}));

// Pre-flight requests
app.options('*', cors());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Tenant resolution middleware
app.use(tenantMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    tenant: req.tenant?.subdomain || 'none'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Voho SaaS Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      tenant: '/api/tenant',
      calls: '/api/calls',
      dashboard: '/api/dashboard'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection with retry logic
const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ MongoDB connected');
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ Failed to connect to MongoDB after all retries');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
    }
  }
};

// Start server
const startServer = async () => {
  const PORT = process.env.PORT || 10000;

  // Start the server first (even without database)
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

    // Try to connect to database after server starts
    connectDB().catch(err => {
      console.error('⚠️ Database connection failed, but server is running:', err.message);
      console.log('💡 Some features may not work until database is connected');
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');

    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  });

  return server;
};

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

export default app;

