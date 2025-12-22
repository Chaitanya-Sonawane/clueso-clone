#!/usr/bin/env node

// Simple script to test backend connection and API endpoints
const API_BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, options = {}) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    const data = await response.json();
    console.log(`✅ ${endpoint}: ${response.status} - ${data.message || 'OK'}`);
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing Backend API Connection...\n');
  
  // Test health endpoint
  await testEndpoint('/api/health');
  
  // Test auth endpoints (should fail without credentials)
  await testEndpoint('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' })
  });
  
  // Test projects endpoint (should fail without auth)
  await testEndpoint('/api/projects');
  
  // Test collaboration endpoints
  await testEndpoint('/api/collaboration/demos/test123/comments');
  
  // Test recording endpoints
  await testEndpoint('/api/recording/video-chunk', {
    method: 'POST',
    body: JSON.stringify({ sessionId: 'test', sequence: 1 })
  });
  
  console.log('\n✨ Backend connection test completed!');
  console.log('If you see connection errors, make sure the backend server is running on port 3000');
}

runTests().catch(console.error);