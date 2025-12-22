#!/usr/bin/env node

/**
 * Simple Authentication Testing Script
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('🔐 Testing Authentication System...\n');
  
  try {
    // Test user registration
    console.log('📝 Testing user registration...');
    const timestamp = Date.now();
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: `test${timestamp}@example.com`,
      password: 'testpassword123',
      fullName: 'Test User',
      username: `testuser${timestamp}`
    });
    
    console.log('✅ Registration successful!');
    console.log('User ID:', registerResponse.data.data.user.id);
    console.log('Token received:', registerResponse.data.data.token ? 'Yes' : 'No');
    
    const token = registerResponse.data.data.token;
    
    // Test profile access
    console.log('\n👤 Testing profile access...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Profile access successful!');
    console.log('Profile:', profileResponse.data.data);
    
    // Test login with the same user
    console.log('\n🔑 Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: registerResponse.data.data.user.email,
      password: 'testpassword123'
    });
    
    console.log('✅ Login successful!');
    console.log('New token received:', loginResponse.data.data.token ? 'Yes' : 'No');
    
    console.log('\n🎉 All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAuth();