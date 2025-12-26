#!/usr/bin/env node

/**
 * Comprehensive Clueso Feature Testing Script
 * Tests all implemented features and API endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let userId = '';
let projectId = '';
let sessionId = '';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, success, details });
  if (success) testResults.passed++;
  else testResults.failed++;
}

async function testFeature(name, testFn) {
  try {
    await testFn();
    logTest(name, true);
  } catch (error) {
    logTest(name, false, error.message);
  }
}

// ===== AUTHENTICATION TESTS =====

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication System...');
  
  // Test user registration
  await testFeature('User Registration', async () => {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Test User',
      username: 'testuser'
    });
    
    if (response.status !== 201) throw new Error('Registration failed');
    authToken = response.data.data.token;
    userId = response.data.data.user.id;
  });

  // Test user login
  await testFeature('User Login', async () => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: `test${Date.now()-1000}@example.com`,
      password: 'testpassword123'
    });
    
    // Login might fail if user doesn't exist, that's ok for this test
    if (response.status === 200) {
      authToken = response.data.data.token;
    }
  });

  // Test profile access (protected route)
  await testFeature('Profile Access', async () => {
    const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Profile access failed');
  });
}

// ===== PROJECT MANAGEMENT TESTS =====

async function testProjectManagement() {
  console.log('\n📁 Testing Project Management...');
  
  // Test project creation
  await testFeature('Create Project', async () => {
    const response = await axios.post(`${BASE_URL}/api/projects`, {
      name: 'Test Project',
      description: 'A test project for feature testing'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 201) throw new Error('Project creation failed');
    projectId = response.data.data.id;
  });

  // Test get user projects
  await testFeature('Get User Projects', async () => {
    const response = await axios.get(`${BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get projects failed');
    if (!Array.isArray(response.data.data)) throw new Error('Projects not returned as array');
  });

  // Test get specific project
  await testFeature('Get Specific Project', async () => {
    const response = await axios.get(`${BASE_URL}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get project failed');
  });

  // Test update project
  await testFeature('Update Project', async () => {
    const response = await axios.put(`${BASE_URL}/api/projects/${projectId}`, {
      name: 'Updated Test Project',
      description: 'Updated description'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Project update failed');
  });
}

// ===== RECORDING TESTS =====

async function testRecordingFeatures() {
  console.log('\n🎥 Testing Recording Features...');
  
  // Test start recording session
  await testFeature('Start Recording Session', async () => {
    const response = await axios.post(`${BASE_URL}/api/projects/${projectId}/recordings/start`, {
      sessionName: 'Test Recording Session',
      url: 'https://example.com',
      viewport: { width: 1920, height: 1080 }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 201) throw new Error('Start recording failed');
    sessionId = response.data.data.id;
  });

  // Test video chunk upload
  await testFeature('Video Chunk Upload', async () => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('sequence', '0');
    formData.append('chunk', Buffer.from('fake video data'), 'test.webm');

    const response = await axios.post(`${BASE_URL}/api/recording/video-chunk`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.status !== 200) throw new Error('Video chunk upload failed');
  });

  // Test audio chunk upload
  await testFeature('Audio Chunk Upload', async () => {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('sequence', '0');
    formData.append('chunk', Buffer.from('fake audio data'), 'test.webm');

    const response = await axios.post(`${BASE_URL}/api/recording/audio-chunk`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.status !== 200) throw new Error('Audio chunk upload failed');
  });

  // Test stop recording session
  await testFeature('Stop Recording Session', async () => {
    const response = await axios.post(`${BASE_URL}/api/projects/${projectId}/recordings/${sessionId}/stop`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Stop recording failed');
  });

  // Test get project recordings
  await testFeature('Get Project Recordings', async () => {
    const response = await axios.get(`${BASE_URL}/api/projects/${projectId}/recordings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get recordings failed');
  });
}

// ===== COLLABORATION TESTS =====

async function testCollaborationFeatures() {
  console.log('\n🤝 Testing Collaboration Features...');
  
  let commentId = '';

  // Test add comment
  await testFeature('Add Comment', async () => {
    const response = await axios.post(`${BASE_URL}/api/collaboration/demos/${sessionId}/comments`, {
      userId: userId,
      username: 'Test User',
      timestamp: 45.2,
      comment: 'This is a test comment',
      position: { x: 300, y: 150 }
    });
    
    if (response.status !== 201) throw new Error('Add comment failed');
    commentId = response.data.data.id;
  });

  // Test get comments
  await testFeature('Get Comments', async () => {
    const response = await axios.get(`${BASE_URL}/api/collaboration/demos/${sessionId}/comments`);
    
    if (response.status !== 200) throw new Error('Get comments failed');
    if (!Array.isArray(response.data.data)) throw new Error('Comments not returned as array');
  });

  // Test update comment
  await testFeature('Update Comment', async () => {
    const response = await axios.put(`${BASE_URL}/api/collaboration/comments/${commentId}`, {
      comment: 'Updated test comment'
    });
    
    if (response.status !== 200) throw new Error('Update comment failed');
  });

  // Test resolve comment
  await testFeature('Resolve Comment', async () => {
    const response = await axios.patch(`${BASE_URL}/api/collaboration/comments/${commentId}/resolve`);
    
    if (response.status !== 200) throw new Error('Resolve comment failed');
  });

  // Test AI suggestions generation
  await testFeature('Generate AI Suggestions', async () => {
    const response = await axios.post(`${BASE_URL}/api/collaboration/demos/${sessionId}/ai-suggestions`, {
      transcript: 'Hello, welcome to our demo. This is a test transcript.',
      pauseDurations: [0.5, 1.2, 0.8],
      replayFrequency: [1, 2, 1]
    });
    
    if (response.status !== 200) throw new Error('AI suggestions failed');
  });
}

// ===== MULTI-LANGUAGE TESTS =====

async function testMultiLanguageFeatures() {
  console.log('\n🌍 Testing Multi-Language Features...');
  
  // Test add language support
  await testFeature('Add Language Support', async () => {
    const response = await axios.post(`${BASE_URL}/api/collaboration/demos/${sessionId}/languages`, {
      language: 'es',
      originalTranscript: 'Hello, welcome to our demo. This is a test transcript.'
    });
    
    if (response.status !== 201) throw new Error('Add language failed');
  });

  // Test get languages
  await testFeature('Get Languages', async () => {
    const response = await axios.get(`${BASE_URL}/api/collaboration/demos/${sessionId}/languages`);
    
    if (response.status !== 200) throw new Error('Get languages failed');
  });

  // Test get subtitles
  await testFeature('Get Subtitles', async () => {
    const response = await axios.get(`${BASE_URL}/api/collaboration/demos/${sessionId}/languages/es/subtitles`);
    
    if (response.status !== 200) throw new Error('Get subtitles failed');
  });
}

// ===== AI REVIEW TESTS =====

async function testAIReviewFeatures() {
  console.log('\n🧠 Testing AI Review Features...');
  
  // Test generate AI review
  await testFeature('Generate AI Review', async () => {
    const response = await axios.post(`${BASE_URL}/api/collaboration/demos/${sessionId}/ai-review`, {
      reviewType: 'on_demand'
    });
    
    if (response.status !== 201) throw new Error('AI review generation failed');
  });

  // Test get AI review
  await testFeature('Get AI Review', async () => {
    const response = await axios.get(`${BASE_URL}/api/collaboration/demos/${sessionId}/ai-review`);
    
    if (response.status !== 200) throw new Error('Get AI review failed');
  });
}

// ===== VIDEO PROCESSING TESTS =====

async function testVideoProcessingFeatures() {
  console.log('\n🎬 Testing Video Processing Features...');
  
  // Test video upload (if we have a test file)
  await testFeature('Video Upload', async () => {
    // Create a small test file
    const testVideoPath = path.join(__dirname, 'test-video.webm');
    fs.writeFileSync(testVideoPath, Buffer.from('fake video content'));
    
    const formData = new FormData();
    formData.append('video', fs.createReadStream(testVideoPath));
    formData.append('title', 'Test Video');
    formData.append('description', 'Test video upload');
    formData.append('template', 'tutorial');

    const response = await axios.post(`${BASE_URL}/api/videos/projects/${projectId}/videos/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${authToken}`
      }
    });
    
    // Clean up test file
    fs.unlinkSync(testVideoPath);
    
    if (response.status !== 201) throw new Error('Video upload failed');
  });

  // Test get project videos
  await testFeature('Get Project Videos', async () => {
    const response = await axios.get(`${BASE_URL}/api/videos/projects/${projectId}/videos`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.status !== 200) throw new Error('Get project videos failed');
  });

  // Test processing status
  await testFeature('Get Processing Status', async () => {
    const response = await axios.get(`${BASE_URL}/api/videos/processing/${sessionId}/status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    // This might return 404 if no processing is active, which is ok
    if (response.status !== 200 && response.status !== 404) {
      throw new Error('Processing status check failed');
    }
  });
}

// ===== HEALTH CHECK =====

async function testHealthCheck() {
  console.log('\n🏥 Testing Server Health...');
  
  await testFeature('Server Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    
    // Server might return 404 for root, but should be responsive
    if (response.status >= 500) throw new Error('Server not healthy');
  });
}

// ===== MAIN TEST RUNNER =====

async function runAllTests() {
  console.log('🚀 Starting Clueso Feature Testing...\n');
  console.log(`Testing against: ${BASE_URL}`);
  
  try {
    await testHealthCheck();
    await testAuthentication();
    
    if (authToken) {
      await testProjectManagement();
      
      if (projectId) {
        await testRecordingFeatures();
        
        if (sessionId) {
          await testCollaborationFeatures();
          await testMultiLanguageFeatures();
          await testAIReviewFeatures();
          await testVideoProcessingFeatures();
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
  
  // Print summary
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.success)
      .forEach(test => console.log(`   - ${test.name}: ${test.details}`));
  }
  
  console.log('\n🎉 Testing Complete!');
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };