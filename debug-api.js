#!/usr/bin/env node

/**
 * API Debugging Script
 * Helps diagnose API connectivity issues
 */

console.log('🔧 Voho SaaS API Debugging Tool');
console.log('===============================\n');

// Check if we're in the frontend directory
try {
  const fs = await import('fs');

  const frontendPackageJson = JSON.parse(fs.readFileSync('./frontend/package.json', 'utf8'));
  console.log('✅ Frontend package.json found');
  console.log('📦 Frontend dependencies:', Object.keys(frontendPackageJson.dependencies || {}).length);

  // Check if .env file exists
  if (fs.existsSync('./frontend/.env')) {
    console.log('✅ Frontend .env file exists');
  } else {
    console.log('⚠️  Frontend .env file not found');
  }

  // Check if dist folder exists
  if (fs.existsSync('./frontend/dist')) {
    console.log('✅ Frontend dist folder exists');
  } else {
    console.log('❌ Frontend dist folder not found - run build first');
  }

} catch (error) {
  console.log('❌ Error checking frontend:', error.message);
}

console.log('\n🔍 Environment Variables Check:');
console.log('================================');

// Check for common environment variable issues
const commonEnvVars = [
  'VITE_API_URL',
  'NODE_ENV',
  'PORT'
];

commonEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}=${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
  } else {
    console.log(`❌ ${varName} not set`);
  }
});

console.log('\n📋 Next Steps to Fix:');
console.log('======================');

console.log('1. Check Vercel Environment Variables:');
console.log('   - Go to Vercel Dashboard');
console.log('   - Find your project');
console.log('   - Go to Settings → Environment Variables');
console.log('   - Ensure VITE_API_URL is set to: https://voho-saas.onrender.com/api');

console.log('\n2. Redeploy on Vercel:');
console.log('   - Go to Deployments tab');
console.log('   - Click "Redeploy" on latest deployment');

console.log('\n3. Check Browser Console:');
console.log('   - Open browser dev tools');
console.log('   - Check Console tab for API URL logs');
console.log('   - Should see: "🔗 API_URL: https://voho-saas.onrender.com/api"');

console.log('\n4. Test API Endpoints:');
console.log('   curl https://voho-saas.onrender.com/api/health');
console.log('   curl https://voho-saas.vercel.app/api/health');

console.log('\n🎯 Expected Behavior:');
console.log('   - API calls should go to: https://voho-saas.onrender.com/api/auth/signup');
console.log('   - Vercel proxy should forward /api/* requests to Render backend');
console.log('   - Frontend should show: "✅ Using production backend URL" in console');

console.log('\n🚨 If still broken:');
console.log('   - Check if VITE_API_URL in Vercel contains the full URL');
console.log('   - Verify backend is running on Render');
console.log('   - Check CORS configuration in backend');

console.log('\n✅ Ready for testing!');
