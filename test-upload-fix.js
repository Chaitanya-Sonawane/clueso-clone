#!/usr/bin/env node

/**
 * Test Script: Upload Fix Verification
 * 
 * This script tests if the "Failed to fetch" error is resolved
 * by testing the upload endpoint directly.
 */

const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';

async function testUploadEndpoint() {
  console.log('🧪 Testing Upload Fix...\n');

  // Test 1: Check if backend is running
  console.log('1. Testing backend connectivity...');
  try {
    const response = await fetch(`${BACKEND_URL}/api/recording/process-recording`, {
      method: 'OPTIONS'
    });
    
    if (response.ok) {
      console.log('✅ Backend is running and responding');
    } else {
      console.log('❌ Backend responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('\n💡 Solution: Make sure the backend server is running:');
    console.log('   cd Clueso/Clueso_Node_layer-main');
    console.log('   npm run dev');
    return false;
  }

  // Test 2: Create test files
  console.log('\n2. Creating test files...');
  const testVideoPath = path.join(__dirname, 'test-video.webm');
  const testAudioPath = path.join(__dirname, 'test-audio.wav');
  
  // Create minimal test files
  const webmHeader = Buffer.from([0x1A, 0x45, 0xDF, 0xA3]);
  const wavHeader = Buffer.from([0x52, 0x49, 0x46, 0x46]);
  
  fs.writeFileSync(testVideoPath, webmHeader);
  fs.writeFileSync(testAudioPath, wavHeader);
  console.log('✅ Test files created');

  // Test 3: Test upload endpoint
  console.log('\n3. Testing upload endpoint...');
  try {
    const formData = new FormData();
    const sessionId = `test_${Date.now()}`;
    
    formData.append('sessionId', sessionId);
    formData.append('events', JSON.stringify([]));
    formData.append('video', fs.createReadStream(testVideoPath));
    formData.append('audio', fs.createReadStream(testAudioPath));
    formData.append('metadata', JSON.stringify({
      sessionId: sessionId,
      title: 'Test Upload',
      uploadedAt: new Date().toISOString()
    }));

    const response = await fetch(`${BACKEND_URL}/api/recording/process-recording`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('📄 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Upload failed with status:', response.status);
      console.log('📄 Error response:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Upload request failed:', error.message);
    return false;
  }

  // Cleanup
  console.log('\n4. Cleaning up test files...');
  try {
    fs.unlinkSync(testVideoPath);
    fs.unlinkSync(testAudioPath);
    console.log('✅ Test files cleaned up');
  } catch (error) {
    console.log('⚠️  Could not clean up test files:', error.message);
  }

  console.log('\n🎉 Upload fix verification completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Backend server is running');
  console.log('   ✅ Upload endpoint is accessible');
  console.log('   ✅ File upload works correctly');
  console.log('\n💡 The "Failed to fetch" error should now be resolved.');
  console.log('   You can now upload videos through the frontend.');

  return true;
}

// Test 4: Frontend connectivity
async function testFrontendConnectivity() {
  console.log('\n5. Testing frontend connectivity...');
  try {
    const response = await fetch('http://localhost:3002', {
      method: 'HEAD'
    });
    
    if (response.ok || response.status === 404) {
      console.log('✅ Frontend is running on http://localhost:3002');
    } else {
      console.log('⚠️  Frontend may not be fully started yet');
    }
  } catch (error) {
    console.log('⚠️  Frontend connection test failed:', error.message);
    console.log('💡 Make sure the frontend is running:');
    console.log('   cd Clueso/frontend-main');
    console.log('   npm run dev');
  }
}

// Run tests
async function runTests() {
  const uploadSuccess = await testUploadEndpoint();
  await testFrontendConnectivity();
  
  if (uploadSuccess) {
    console.log('\n🚀 Ready to test! Open http://localhost:3002 and try uploading a video.');
  } else {
    console.log('\n❌ Upload test failed. Please check the backend server.');
  }
}

runTests().catch(console.error);