#!/usr/bin/env node

/**
 * Test existing video loading functionality
 */

const { io } = require('socket.io-client');

const BACKEND_URL = 'http://localhost:3001';
const TEST_SESSION_ID = 'session_1766659913514_k9y7wk4lt'; // Known uploaded session

console.log('🧪 Testing Existing Video Loading');
console.log('=================================');
console.log(`Session ID: ${TEST_SESSION_ID}`);
console.log(`Backend URL: ${BACKEND_URL}`);
console.log('');

async function testExistingVideoLoading() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Connecting to WebSocket...');
        
        const socket = io(BACKEND_URL, {
            transports: ['websocket', 'polling']
        });

        let videoReceived = false;
        let audioReceived = false;
        let instructionsReceived = false;

        // Connection events
        socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            console.log('📋 Registering session...');
            socket.emit('register', TEST_SESSION_ID);
        });

        socket.on('registered', (data) => {
            console.log('✅ Session registered:', data.message);
        });

        // Data events
        socket.on('video', (data) => {
            console.log('📹 Video received:', {
                filename: data.filename,
                path: data.path,
                timestamp: data.timestamp
            });
            videoReceived = true;
            checkCompletion();
        });

        socket.on('audio', (data) => {
            console.log('🎵 Audio received:', {
                filename: data.filename,
                path: data.path,
                textLength: data.text?.length || 0,
                timestamp: data.timestamp
            });
            audioReceived = true;
            checkCompletion();
        });

        socket.on('instructions', (data) => {
            console.log('📋 Instructions received:', {
                type: data.type || 'unknown',
                target: data.target?.tag || 'unknown'
            });
            instructionsReceived = true;
            checkCompletion();
        });

        // Error events
        socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            reject(error);
        });

        socket.on('disconnect', () => {
            console.log('🔌 WebSocket disconnected');
        });

        function checkCompletion() {
            if (videoReceived && audioReceived) {
                console.log('');
                console.log('🎉 Test Results:');
                console.log(`   Video: ${videoReceived ? '✅' : '❌'}`);
                console.log(`   Audio: ${audioReceived ? '✅' : '❌'}`);
                console.log(`   Instructions: ${instructionsReceived ? '✅' : '❌'}`);
                console.log('');
                
                if (videoReceived && audioReceived) {
                    console.log('✅ Existing video loading is working!');
                    console.log('');
                    console.log('🌐 Test the frontend:');
                    console.log(`   URL: http://localhost:3000/recording/${TEST_SESSION_ID}`);
                    console.log('   Expected: Video should load immediately');
                } else {
                    console.log('❌ Some data is missing');
                }
                
                socket.disconnect();
                resolve();
            }
        }

        // Timeout after 10 seconds
        setTimeout(() => {
            console.log('');
            console.log('⏰ Test timeout - Results so far:');
            console.log(`   Video: ${videoReceived ? '✅' : '❌'}`);
            console.log(`   Audio: ${audioReceived ? '✅' : '❌'}`);
            console.log(`   Instructions: ${instructionsReceived ? '✅' : '❌'}`);
            
            if (!videoReceived && !audioReceived) {
                console.log('');
                console.log('🔍 Troubleshooting:');
                console.log('1. Check if backend is running on port 3001');
                console.log('2. Verify video files exist in recordings directory');
                console.log('3. Check backend logs for errors');
            }
            
            socket.disconnect();
            resolve();
        }, 10000);
    });
}

// Run the test
testExistingVideoLoading().catch(console.error);