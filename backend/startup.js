#!/usr/bin/env node

/**
 * Startup script for Voho SaaS Backend
 * Ensures proper initialization before health checks
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const mongoose = require('mongoose');

// Environment variables with defaults
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voho-test';
const PORT = process.env.PORT || 10000;

// MongoDB connection with timeout
const connectWithTimeout = async (timeoutMs = 30000) => {
  return Promise.race([
    mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      maxPoolSize: 10,
      minPoolSize: 2,
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
    )
  ]);
};

// Health check function
const performHealthCheck = async () => {
  const https = await import('https');

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 5000,
      headers: {
        'User-Agent': 'Startup-Healthcheck/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => data += chunk);

      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            if (response.status === 'ok' || response.status === 'service_unavailable') {
              resolve(response);
            } else {
              reject(new Error(`Health check returned status: ${response.status}`));
            }
          } else {
            reject(new Error(`Health check HTTP status: ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Invalid health check response: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Health check request failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });

    req.end();
  });
};

// Main startup function
const startup = async () => {
  console.log('🚀 Voho SaaS Backend - Startup Sequence');
  console.log('======================================');

  try {
    // Step 1: Connect to database
    console.log('📡 Step 1: Connecting to MongoDB...');
    await connectWithTimeout();
    console.log('✅ Database connected successfully');

    // Step 2: Start the main server
    console.log('🚀 Step 2: Starting server...');

    // Import and start server (this will run the server.js)
    await import('./server.js');

    // Step 3: Wait for server to be ready
    console.log('⏳ Step 3: Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give server time to start

    // Step 4: Perform health check
    console.log('🏥 Step 4: Performing health check...');
    const health = await performHealthCheck();
    console.log('✅ Health check passed:', health.status);

    console.log('🎉 Startup sequence completed successfully!');
    console.log('🔗 Server is ready to accept connections');

    // Keep the process alive
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    console.error('💥 Exiting with error code 1');
    process.exit(1);
  }
};

// Handle shutdown signals gracefully
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received during startup, shutting down...');
  mongoose.connection.close(() => {
    console.log('📪 Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down...');
  mongoose.connection.close(() => {
    console.log('📪 Database connection closed');
    process.exit(0);
  });
});

// Start the application
startup();
