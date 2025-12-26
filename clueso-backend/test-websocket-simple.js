const { io } = require('socket.io-client');
const http = require('http');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_SESSION_ID = 'session_1766659357717_test'; // Use an existing session

console.log('🧪 Testing WebSocket Communication with Existing Session');
console.log(`📋 Session ID: ${TEST_SESSION_ID}`);

async function testWebSocketFlow() {
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

    // Wait for connection and registration
    await new Promise(resolve => {
        socket.on('registered', resolve);
        setTimeout(() => resolve(), 3000); // Timeout after 3 seconds
    });

    console.log('\n📤 Triggering video send via test endpoint...');
    
    try {
        // Use the test endpoint to send existing video data
        const testResult = await new Promise((resolve, reject) => {
            const req = http.request({
                hostname: 'localhost',
                port: 3001,
                path: `/api/test/send-video/${TEST_SESSION_ID}`,
                method: 'GET'
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
                        reject(new Error(`Test endpoint failed: ${res.statusCode} - ${data}`));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });

        console.log('✅ Test endpoint response:', testResult);

        // Wait for WebSocket events
        console.log('\n⏳ Waiting for WebSocket events...');
        await new Promise(resolve => setTimeout(resolve, 3000));

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

        // Test if we received video and audio events
        const hasVideo = events.some(e => e.type === 'video');
        const hasAudio = events.some(e => e.type === 'audio');
        const hasInstructions = events.some(e => e.type === 'instructions');

        console.log('\n🎯 Event Summary:');
        console.log(`   Video events: ${hasVideo ? '✅' : '❌'}`);
        console.log(`   Audio events: ${hasAudio ? '✅' : '❌'}`);
        console.log(`   Instructions: ${hasInstructions ? '✅' : '❌'}`);

        if (hasVideo && hasAudio) {
            console.log('\n🎉 SUCCESS: WebSocket communication is working!');
            console.log('   The video loading issue should be resolved.');
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS: Some events are missing.');
            console.log('   This may indicate remaining issues with the video loading flow.');
        }

    } catch (error) {
        console.log('❌ Test endpoint error:', error.message);
    }

    // Cleanup
    socket.disconnect();
    console.log('\n🏁 Test completed');
}

// Run the test
testWebSocketFlow().catch(console.error);