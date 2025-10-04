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

// Auth routes (before tenant middleware - no tenant context needed)
app.use('/api/auth', authRoutes);

// Tenant resolution middleware (applied to all routes after auth)
app.use(tenantMiddleware);

// Other API routes (require tenant context)
app.use('/api/tenant', tenantRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint - must respond quickly
app.get('/api/health', (req, res) => {
  const isHealthy = mongoose.connection.readyState === 1;

  // Respond immediately with basic health status
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'service_unavailable',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 10000,
    mongodb: isHealthy ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Detailed health check
app.get('/api/health/detailed', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 10000,
    mongodb: {
      state: mongoose.connection.readyState,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    node: process.version,
    platform: process.platform
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
  const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

  console.log(`🚀 Starting Voho SaaS Backend...`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Target: ${HOST}:${PORT}`);

  // Connect to database first (critical for health checks)
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Server will start anyway, but health checks will fail');

    // In production, we might want to exit if DB is critical
    if (process.env.NODE_ENV === 'production') {
      console.log('💥 Exiting in production due to database failure');
      process.exit(1);
    }
  }

  // Start the server after database connection attempt
  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on ${HOST}:${PORT}`);
    console.log(`🌐 Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`🔗 Ready to accept connections at http://${HOST}:${PORT}`);
    console.log(`⏰ Uptime monitoring started`);
  });

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');

    server.close(async () => {
      try {
        // Close database connection without callback (Mongoose 8+ compatibility)
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
        process.exit(0);
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
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

