#!/usr/bin/env node

/**
 * Test video upload functionality
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';

console.log('🎬 Testing Video Upload Functionality');
console.log('====================================');

async function testVideoUpload() {
    try {
        // Create a test video file with proper WebM header
        const testVideoPath = path.join(__dirname, 'test-upload-video.webm');
        
        // Create a minimal WebM file with proper header
        const webmHeader = Buffer.from([
            0x1A, 0x45, 0xDF, 0xA3, // EBML header
            0x9F, 0x42, 0x86, 0x81, 0x01, // DocType: webm
            0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // "webm"
        ]);
        
        // Add some dummy video data
        const dummyVideoData = Buffer.alloc(1000, 0x00);
        const testVideoContent = Buffer.concat([webmHeader, dummyVideoData]);
        
        fs.writeFileSync(testVideoPath, testVideoContent);
        console.log('✅ Created test video file');

        // Generate session ID
        const sessionId = `session_${Date.now()}_upload_test`;
        console.log(`📋 Session ID: ${sessionId}`);

        // Test the upload endpoint
        console.log('📤 Testing upload endpoint...');
        
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('events', JSON.stringify([
            {
                type: 'click',
                target: { tag: 'button', text: 'Upload Test' },
                timestamp: Date.now()
            }
        ]));
        formData.append('metadata', JSON.stringify({
            sessionId: sessionId,
            uploadedAt: new Date().toISOString(),
            originalFilename: 'test-upload-video.webm',
            testUpload: true
        }));
        formData.append('video', fs.createReadStream(testVideoPath));
        formData.append('audio', fs.createReadStream(testVideoPath)); // Use same file for audio

        // Make the upload request
        const response = await fetch(`${BACKEND_URL}/api/recording/process-recording`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Upload successful!');
            console.log('📊 Response:', JSON.stringify(result, null, 2));
            
            // Check if video file is accessible
            const videoFilename = `recording_${sessionId}_video.webm`;
            const videoUrl = `${BACKEND_URL}/recordings/${videoFilename}`;
            
            console.log('🔍 Testing video accessibility...');
            const videoResponse = await fetch(videoUrl, { method: 'HEAD' });
            
            if (videoResponse.ok) {
                console.log('✅ Video file is accessible');
                console.log(`📹 Video URL: ${videoUrl}`);
            } else {
                console.log('❌ Video file not accessible');
            }
            
            // Provide frontend URL
            const frontendUrl = `http://localhost:3000/recording/${sessionId}`;
            console.log('');
            console.log('🌐 Frontend URLs:');
            console.log(`   Player: ${frontendUrl}`);
            console.log(`   Dashboard: http://localhost:3000/dashboard`);
            console.log('');
            console.log('🎉 Upload test completed successfully!');
            console.log('');
            console.log('📋 Next Steps:');
            console.log('1. Open the dashboard: http://localhost:3000/dashboard');
            console.log('2. Click "Upload a video" to test the UI');
            console.log('3. Select any video file from your computer');
            console.log('4. Watch the upload progress and player activation');
            
        } else {
            console.error('❌ Upload failed:', result);
        }

        // Cleanup
        if (fs.existsSync(testVideoPath)) {
            fs.unlinkSync(testVideoPath);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
    }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.log('❌ This test requires Node.js 18+ or you can install node-fetch');
    console.log('');
    console.log('🔧 Manual Test Instructions:');
    console.log('1. Open http://localhost:3000/dashboard in your browser');
    console.log('2. Click the "Upload a video" button');
    console.log('3. Select any video file (MP4, WebM, etc.)');
    console.log('4. Click "Upload and Process"');
    console.log('5. You should be redirected to the video player');
    console.log('6. The video should load immediately');
    console.log('7. Transcript should show "Transcribing audio..."');
    console.log('8. AI buttons should be disabled until processing completes');
} else {
    testVideoUpload();
}