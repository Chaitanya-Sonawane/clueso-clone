const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');
const { io } = require('socket.io-client');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_SESSION_ID = 'test_session_' + Date.now();
const TEST_VIDEO_PATH = path.join(__dirname, 'test-video.webm');

console.log('🧪 Testing Video Upload with WebSocket Communication');
console.log(`📋 Session ID: ${TEST_SESSION_ID}`);
console.log(`🎥 Video file: ${TEST_VIDEO_PATH}`);

// Create a simple test video file if it doesn't exist
if (!fs.existsSync(TEST_VIDEO_PATH)) {
    console.log('📁 Creating test video file...');
    // Create a minimal WebM file (just header bytes for testing)
    const testVideoData = Buffer.from([
        0x1A, 0x45, 0xDF, 0xA3, // EBML header
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1F, // EBML size
        0x42, 0x86, 0x81, 0x01, // EBMLVersion
        0x42, 0xF7, 0x81, 0x01, // EBMLReadVersion
        0x42, 0xF2, 0x81, 0x04, // EBMLMaxIDLength
        0x42, 0xF3, 0x81, 0x08, // EBMLMaxSizeLength
        0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D, // DocType: "webm"
        0x42, 0x87, 0x81, 0x02, // DocTypeVersion
        0x42, 0x85, 0x81, 0x02  // DocTypeReadVersion
    ]);
    fs.writeFileSync(TEST_VIDEO_PATH, testVideoData);
    console.log('✅ Test video file created');
}

async function testVideoUploadFlow() {
    console.log('\n🔌 Connecting to WebSocket...');
    
    // Connect to WebSocket
    const socket = io(BACKEND_URL, {
        transports: ['websocket'],
        timeout: 5000
    });

    // Set up WebSocket event listeners
    const events = [];
    
    socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        
        // Register for session
        console.log(`📝 Registering for session: ${TEST_SESSION_ID}`);
        socket.emit('register', TEST_SESSION_ID);
    });

    socket.on('registered', (data) => {
        console.log('✅ Successfully registered for session:', data);
        events.push({ type: 'registered', data, timestamp: Date.now() });
    });

    socket.on('processing_status', (data) => {
        console.log('📊 Processing status:', data);
        events.push({ type: 'processing_status', data, timestamp: Date.now() });
    });

    socket.on('processing_complete', (data) => {
        console.log('✅ Processing complete:', data);
        events.push({ type: 'processing_complete', data, timestamp: Date.now() });
    });

    socket.on('processing_error', (data) => {
        console.log('❌ Processing error:', data);
        events.push({ type: 'processing_error', data, timestamp: Date.now() });
    });

    socket.on('video', (data) => {
        console.log('🎥 Video event received:', data);
        events.push({ type: 'video', data, timestamp: Date.now() });
    });

    socket.on('audio', (data) => {
        console.log('🔊 Audio event received:', data);
        events.push({ type: 'audio', data, timestamp: Date.now() });
    });

    socket.on('instructions', (data) => {
        console.log('📋 Instructions received:', data);
        events.push({ type: 'instructions', data, timestamp: Date.now() });
    });

    socket.on('error', (error) => {
        console.log('❌ WebSocket error:', error);
        events.push({ type: 'error', data: error, timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
    });

    // Wait for connection
    await new Promise(resolve => {
        socket.on('registered', resolve);
        setTimeout(() => resolve(), 3000); // Timeout after 3 seconds
    });

    console.log('\n📤 Uploading video...');
    
    try {
        // Create form data for video upload
        const form = new FormData();
        form.append('video', fs.createReadStream(TEST_VIDEO_PATH));
        form.append('sessionId', TEST_SESSION_ID);

        // Upload video using http module
        const uploadResult = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: '/api/upload-video',
                method: 'POST',
                headers: form.getHeaders()
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(data));
                        } catch (e) {
                            resolve({ message: data });
                        }
                    } else {
                        reject(new Error(`Upload failed: ${res.statusCode} - ${data}`));
                    }
                });
            });

            req.on('error', reject);
            form.pipe(req);
        });
        console.log('✅ Video uploaded successfully:', uploadResult);

        // Wait for processing events
        console.log('\n⏳ Waiting for processing events...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Display all received events
        console.log('\n📋 Summary of WebSocket Events:');
        console.log('=====================================');
        
        if (events.length === 0) {
            console.log('❌ No WebSocket events received!');
        } else {
            events.forEach((event, index) => {
                console.log(`${index + 1}. ${event.type} (${new Date(event.timestamp).toLocaleTimeString()})`);
                if (event.data && typeof event.data === 'object') {
                    console.log(`   Data:`, JSON.stringify(event.data, null, 2));
                }
            });
        }

        // Test video accessibility
        if (uploadResult.videoUrl) {
            console.log('\n🔍 Testing video accessibility...');
            try {
                const videoAccessible = await new Promise((resolve) => {
                    const req = http.request({
                        hostname: 'localhost',
                        port: 3001,
                        path: uploadResult.videoUrl,
                        method: 'GET'
                    }, (res) => {
                        resolve(res.statusCode >= 200 && res.statusCode < 300);
                    });
                    req.on('error', () => resolve(false));
                    req.end();
                });

                if (videoAccessible) {
                    console.log('✅ Video is accessible at:', uploadResult.videoUrl);
                } else {
                    console.log('❌ Video not accessible');
                }
            } catch (error) {
                console.log('❌ Error accessing video:', error.message);
            }
        }

    } catch (error) {
        console.log('❌ Upload error:', error.message);
    }

    // Cleanup
    socket.disconnect();
    
    // Clean up test file
    if (fs.existsSync(TEST_VIDEO_PATH)) {
        fs.unlinkSync(TEST_VIDEO_PATH);
        console.log('🧹 Cleaned up test video file');
    }

    console.log('\n🏁 Test completed');
}

// Run the test
testVideoUploadFlow().catch(console.error);