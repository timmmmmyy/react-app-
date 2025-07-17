#!/usr/bin/env node

// Simple script to check environment variables
console.log('🔧 Environment Variable Check');
console.log('=============================');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  
  // Read and parse .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  console.log('📋 Environment Variables:');
  console.log('  - REACT_APP_API_URL:', envVars.REACT_APP_API_URL || '❌ NOT SET');
  console.log('  - REACT_APP_STRIPE_PUBLISHABLE_KEY:', envVars.REACT_APP_STRIPE_PUBLISHABLE_KEY ? '✅ SET' : '❌ NOT SET');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
  
  if (!envVars.REACT_APP_API_URL) {
    console.log('\n⚠️  WARNING: REACT_APP_API_URL is not set in .env file');
    console.log('   This will cause API calls to fail!');
    console.log('\n💡 To fix this:');
    console.log('   1. Copy env.example to .env');
    console.log('   2. Update REACT_APP_API_URL with your backend URL');
    console.log('   3. Restart your development server');
  } else {
    console.log('\n✅ REACT_APP_API_URL is set correctly');
    console.log(`   Backend URL: ${envVars.REACT_APP_API_URL}`);
  }
  
  console.log('\n🌐 To test the backend connection:');
  console.log('   curl ' + (envVars.REACT_APP_API_URL || 'http://localhost:4000') + '/health');
} else {
  console.log('❌ .env file not found');
  console.log('\n💡 To create .env file:');
  console.log('   1. Copy env.example to .env');
  console.log('   2. Update the values with your actual configuration');
  console.log('   3. Restart your development server');
} 