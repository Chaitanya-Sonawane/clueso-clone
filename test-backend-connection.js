#!/usr/bin/env node

const http = require('http');

// Test backend connection
function testBackend() {
    console.log('Testing backend connection...');
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/v1/health',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log('✅ Backend is responding with valid JSON:', parsed);
            } catch (e) {
                console.log('❌ Backend returned non-JSON response:', data);
            }
        });
    });

    req.on('error', (e) => {
        console.log('❌ Backend connection failed:', e.message);
        console.log('Make sure the backend is running on port 3001');
    });

    req.end();
}

// Test frontend connection
function testFrontend() {
    console.log('\nTesting frontend connection...');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log(`Frontend Status: ${res.statusCode}`);
        if (res.statusCode === 200) {
            console.log('✅ Frontend is running');
        } else {
            console.log('❌ Frontend returned error status');
        }
    });

    req.on('error', (e) => {
        console.log('❌ Frontend connection failed:', e.message);
        console.log('Make sure the frontend is running on port 3000');
    });

    req.end();
}

// Run tests
testBackend();
setTimeout(testFrontend, 1000);