#!/usr/bin/env node

/**
 * Create a test session for the video player
 */

const fs = require('fs');
const path = require('path');

// Generate a test session ID
const TEST_SESSION_ID = `session_${Date.now()}_test`;

console.log('🎬 Creating Test Session for Video Player');
console.log('=========================================');
console.log(`Session ID: ${TEST_SESSION_ID}`);
console.log('');

// Create test video file
const recordingsDir = path.join(__dirname, 'Clueso_Node_layer-main', 'recordings');
if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
}

// Create a simple test video file (mock WebM content)
const testVideoPath = path.join(recordingsDir, `recording_${TEST_SESSION_ID}_video.webm`);
const testVideoContent = Buffer.from('WEBM test video content for player testing');
fs.writeFileSync(testVideoPath, testVideoContent);

// Create test audio file with transcript
const testAudioPath = path.join(recordingsDir, `recording_${TEST_SESSION_ID}_audio.webm`);
const testAudioContent = Buffer.from('WEBM test audio content');
fs.writeFileSync(testAudioPath, testAudioContent);

console.log('✅ Test files created:');
console.log(`   Video: ${testVideoPath}`);
console.log(`   Audio: ${testAudioPath}`);
console.log('');

console.log('🌐 Access URLs:');
console.log(`   Frontend: http://localhost:3000/recording/${TEST_SESSION_ID}`);
console.log(`   Video URL: http://localhost:3001/recordings/recording_${TEST_SESSION_ID}_video.webm`);
console.log(`   Audio URL: http://localhost:3001/recordings/recording_${TEST_SESSION_ID}_audio.webm`);
console.log('');

console.log('🧪 Test Instructions:');
console.log('1. Make sure both servers are running:');
console.log('   - Backend: http://localhost:3001');
console.log('   - Frontend: http://localhost:3000');
console.log('');
console.log('2. Open the frontend URL in your browser');
console.log('3. The video player should show the test video immediately');
console.log('4. Transcript panel should show "Transcribing audio..." initially');
console.log('5. AI buttons should be disabled until processing completes');
console.log('');

console.log('📋 Session Details:');
console.log(`Session ID: ${TEST_SESSION_ID}`);
console.log('Status: UPLOADED → PROCESSING → READY');
console.log('');

console.log('🎉 Test session created successfully!');