#!/usr/bin/env node

/**
 * Deployment Fix Script
 * This script helps fix common deployment issues
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔧 Voho SaaS Deployment Fix Script');
console.log('==================================\n');

// Function to run commands safely
function runCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Success');
    return result;
  } catch (error) {
    console.log('❌ Failed:', error.message);
    return null;
  }
}

// Check if we're in the right directory
console.log('🔍 Checking project structure...');
try {
  const packageJsonContent = readFileSync('./package.json', 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  if (packageJson.name !== 'voho-saas') {
    throw new Error('Not in the correct project directory');
  }
  console.log('✅ Project structure looks good');
} catch (error) {
  console.log('❌ Error:', error.message);
  process.exit(1);
}

// Check git status
console.log('\n🔍 Checking git status...');
runCommand('git status --porcelain', 'Checking for uncommitted changes');

console.log('\n📝 Next steps to fix the deployment:');
console.log('1. Commit the API configuration fixes:');
console.log('   git add .');
console.log('   git commit -m "Fix API URL configuration for production"');
console.log('   git push origin main');

console.log('\n2. Redeploy on Vercel:');
console.log('   - Go to your Vercel dashboard');
console.log('   - Find the voho-saas project');
console.log('   - Click "Deployments" tab');
console.log('   - Click "Redeploy" on the latest deployment');

console.log('\n3. Verify the environment variables in Vercel:');
console.log('   - VITE_API_URL should be: https://voho-saas.onrender.com/api');
console.log('   - Or leave it empty to use the default');

console.log('\n4. Test the deployment:');
console.log('   npm run deploy-check');

console.log('\n📋 API endpoints that should now work:');
console.log('   POST https://voho-saas.vercel.app/api/auth/signup');
console.log('   GET  https://voho-saas.vercel.app/api/health');
console.log('   (These will be proxied to the Render backend)');

console.log('\n🎯 The issue was:');
console.log('   Frontend was calling: /auth/signup');
console.log('   But needed to call: /api/auth/signup');
console.log('   Vercel proxy now handles this correctly');

console.log('\n🚀 Ready for redeployment!');
