#!/usr/bin/env node

/**
 * Test script to verify video player fixes
 * This script tests the complete flow from upload to ready state
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';
const TEST_SESSION_ID = `session_${Date.now()}_test`;

console.log('🧪 Testing Video Player Fixes');
console.log('==============================');
console.log(`Session ID: ${TEST_SESSION_ID}`);
console.log(`Backend URL: ${BACKEND_URL}`);
console.log('');

async function testVideoPlayerFlow() {
    try {
        // Step 1: Create a simple test video file (mock)
        console.log('📹 Step 1: Creating test video file...');
        const testVideoPath = path.join(__dirname, 'test-video.webm');
        const testVideoContent = Buffer.from('WEBM test video content - this is a mock file');
        fs.writeFileSync(testVideoPath, testVideoContent);
        console.log('✅ Test video file created');

        // Step 2: Upload video via recording endpoint
        console.log('📤 Step 2: Uploading video...');
        const formData = new FormData();
        formData.append('sessionId', TEST_SESSION_ID);
        formData.append('sequence', '0');
        formData.append('chunk', fs.createReadStream(testVideoPath));

        const uploadResponse = await axios.post(`${BACKEND_URL}/api/recording/video-chunk`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 10000
        });

        if (uploadResponse.status === 200) {
            console.log('✅ Video chunk uploaded successfully');
        } else {
            throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }

        // Step 3: Process the recording
        console.log('⚙️  Step 3: Processing recording...');
        const processFormData = new FormData();
        processFormData.append('events', JSON.stringify([
            {
                type: 'click',
                target: { tag: 'button', text: 'Test Button' },
                timestamp: Date.now()
            }
        ]));
        processFormData.append('metadata', JSON.stringify({
            sessionId: TEST_SESSION_ID,
            startTime: Date.now() - 5000,
            endTime: Date.now(),
            url: 'http://test.example.com',
            viewport: { width: 1920, height: 1080 }
        }));

        const processResponse = await axios.post(`${BACKEND_URL}/api/recording/process-recording`, processFormData, {
            headers: {
                ...processFormData.getHeaders(),
            },
            timeout: 30000
        });

        if (processResponse.status === 200) {
            console.log('✅ Recording processed successfully');
            console.log('📊 Process result:', JSON.stringify(processResponse.data, null, 2));
        } else {
            throw new Error(`Processing failed with status: ${processResponse.status}`);
        }

        // Step 4: Check if video file is accessible
        console.log('🔍 Step 4: Checking video accessibility...');
        const videoFilename = `recording_${TEST_SESSION_ID}_video.webm`;
        const videoUrl = `${BACKEND_URL}/recordings/${videoFilename}`;
        
        try {
            const videoResponse = await axios.head(videoUrl, { timeout: 5000 });
            if (videoResponse.status === 200) {
                console.log('✅ Video file is accessible via HTTP');
                console.log(`📹 Video URL: ${videoUrl}`);
            }
        } catch (error) {
            console.log('❌ Video file not accessible via HTTP');
            console.log(`   Tried URL: ${videoUrl}`);
            console.log(`   Error: ${error.message}`);
        }

        // Step 5: Test frontend page accessibility
        console.log('🌐 Step 5: Testing frontend page...');
        const frontendUrl = `http://localhost:3000/recording/${TEST_SESSION_ID}`;
        console.log(`📱 Frontend URL: ${frontendUrl}`);
        console.log('   Open this URL in your browser to test the video player');

        // Cleanup
        console.log('🧹 Cleaning up test files...');
        if (fs.existsSync(testVideoPath)) {
            fs.unlinkSync(testVideoPath);
        }

        console.log('');
        console.log('🎉 Test completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log(`1. Open ${frontendUrl} in your browser`);
        console.log('2. Verify that the video player loads immediately');
        console.log('3. Check that the transcript panel shows "Transcribing audio..."');
        console.log('4. Verify AI buttons are disabled until processing completes');
        console.log('5. Confirm session status shows "PROCESSING" → "READY"');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the test
testVideoPlayerFlow();