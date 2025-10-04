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
  process.env.FRONTEND_URL || 'https://voho-saas.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked CORS request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain']
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
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
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

