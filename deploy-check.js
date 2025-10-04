#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * Run this after deployment to verify everything is working
 */

const https = require('https');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app';
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-render-backend.onrender.com';

console.log('🔍 Voho SaaS Deployment Health Check');
console.log('=====================================\n');

// Check backend health
function checkBackend() {
  return new Promise((resolve) => {
    console.log('📡 Checking Backend API...');
    const url = new URL('/api/health', BACKEND_URL);

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.status === 'ok') {
            console.log('✅ Backend API is healthy');
            resolve(true);
          } else {
            console.log('❌ Backend API returned unexpected response');
            console.log('   Status:', res.statusCode);
            console.log('   Response:', data);
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Backend API returned invalid JSON');
          console.log('   Response:', data);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ Backend API is unreachable');
      console.log('   Error:', err.message);
      resolve(false);
    });
  });
}

// Check frontend accessibility
function checkFrontend() {
  return new Promise((resolve) => {
    console.log('🌐 Checking Frontend...');
    const url = new URL(FRONTEND_URL);

    https.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend is accessible');
        resolve(true);
      } else {
        console.log('❌ Frontend returned status:', res.statusCode);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Frontend is unreachable');
      console.log('   Error:', err.message);
      resolve(false);
    });
  });
}

// Main check function
async function runChecks() {
  const backendOk = await checkBackend();
  console.log('');
  const frontendOk = await checkFrontend();

  console.log('\n📊 Deployment Status:');
  console.log('===================');

  if (backendOk && frontendOk) {
    console.log('🎉 All systems operational!');
    console.log('\n🔗 Access your application:');
    console.log(`   Frontend: ${FRONTEND_URL}`);
    console.log(`   Backend:  ${BACKEND_URL}`);
    process.exit(0);
  } else {
    console.log('⚠️  Some systems are not responding correctly');
    console.log('\n🔧 Troubleshooting:');
    if (!backendOk) {
      console.log('   - Check Render service logs');
      console.log('   - Verify environment variables');
      console.log('   - Test MongoDB connection');
    }
    if (!frontendOk) {
      console.log('   - Check Vercel deployment logs');
      console.log('   - Verify build configuration');
      console.log('   - Check VITE_API_URL environment variable');
    }
    process.exit(1);
  }
}

// Run the checks
runChecks().catch((err) => {
  console.error('💥 Unexpected error during health check:', err);
  process.exit(1);
});
