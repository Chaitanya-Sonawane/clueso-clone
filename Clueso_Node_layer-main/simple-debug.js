#!/usr/bin/env node

/**
 * Simple Video Upload Debug - Using built-in Node.js modules only
 */

const { io } = require('socket.io-client');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';

class SimpleDebugger {
  constructor() {
    this.sessionId = `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.socket = null;
    this.receivedVideo = false;
    this.receivedAudio = false;
    this.events = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async setupWebSocket() {
    return new Promise((resolve, reject) => {
      this.log('Connecting to WebSocket...');
      
      this.socket = io(BACKEND_URL, {
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.log('WebSocket connected', 'success');
        this.socket.emit('register', this.sessionId);
        this.log(`Registered session: ${this.sessionId}`);
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        this.log(`WebSocket failed: ${error.message}`, 'error');
        reject(error);
      });

      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('WebSocket timeout'));
        }
      }, 5000);
    });
  }

  setupEventListeners() {
    this.socket.on('registered', (data) => {
      this.log(`Session registered: ${data.sessionId}`, 'success');
    });

    this.socket.on('video', (data) => {
      this.log('📹 VIDEO EVENT RECEIVED!', 'success');
      this.log(`   Filename: ${data.filename}`);
      this.log(`   Path: ${data.path}`);
      this.log(`   Full URL: ${BACKEND_URL}${data.path}`);
      this.receivedVideo = true;
      this.events.push({ type: 'video', data });
      
      // Test video file access
      this.testVideoFile(data.path);
    });

    this.socket.on('audio', (data) => {
      this.log('🎵 AUDIO EVENT RECEIVED!', 'success');
      this.log(`   Filename: ${data.filename}`);
      this.log(`   Text: ${data.text ? data.text.substring(0, 100) + '...' : 'No text'}`);
      this.receivedAudio = true;
      this.events.push({ type: 'audio', data });
    });

    this.socket.on('processing_status', (data) => {
      this.log(`⚙️ Processing: ${data.currentStep} (${data.progress}%)`);
      this.events.push({ type: 'processing_status', data });
    });

    this.socket.on('processing_complete', (data) => {
      this.log('✅ Processing complete!', 'success');
      this.events.push({ type: 'processing_complete', data });
    });

    this.socket.on('error', (error) => {
      this.log(`Socket error: ${error}`, 'error');
    });
  }

  testVideoFile(videoPath) {
    const url = new URL(`${BACKEND_URL}${videoPath}`);
    
    this.log(`Testing video file: ${url.href}`);
    
    const req = http.request(url, (res) => {
      this.log(`Video file status: ${res.statusCode}`, res.statusCode === 200 ? 'success' : 'error');
      
      if (res.statusCode === 200) {
        this.log(`Content-Type: ${res.headers['content-type']}`);
        this.log(`Content-Length: ${res.headers['content-length']}`);
        this.log('✅ Video file is accessible!', 'success');
      } else {
        this.log('❌ Video file NOT accessible - This is the problem!', 'error');
      }
    });

    req.on('error', (error) => {
      this.log(`Video access error: ${error.message}`, 'error');
    });

    req.end();
  }

  async uploadTestVideo() {
    return new Promise((resolve, reject) => {
      // Create minimal test files
      const testVideoPath = path.join(__dirname, 'test-video.webm');
      const testAudioPath = path.join(__dirname, 'test-audio.wav');
      
      fs.writeFileSync(testVideoPath, Buffer.from([0x1A, 0x45, 0xDF, 0xA3])); // WebM header
      fs.writeFileSync(testAudioPath, Buffer.from([0x52, 0x49, 0x46, 0x46])); // WAV header
      
      this.log('Created test files');
      
      // Use multipart form data manually
      const boundary = '----formdata-boundary-' + Math.random().toString(36);
      const CRLF = '\r\n';
      
      let body = '';
      
      // Add sessionId
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="sessionId"${CRLF}${CRLF}`;
      body += `${this.sessionId}${CRLF}`;
      
      // Add events
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="events"${CRLF}${CRLF}`;
      body += `[]${CRLF}`;
      
      // Add metadata
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="metadata"${CRLF}${CRLF}`;
      body += JSON.stringify({
        sessionId: this.sessionId,
        title: 'Debug Test Video',
        uploadedAt: new Date().toISOString()
      }) + CRLF;
      
      // Add video file
      const videoData = fs.readFileSync(testVideoPath);
      body += `--${boundary}${CRLF}`;
      body += `Content-Disposition: form-data; name="video"; filename="test-video.webm"${CRLF}`;
      body += `Content-Type: video/webm${CRLF}${CRLF}`;
      
      // Add audio file
      const audioData = fs.readFileSync(testAudioPath);
      const bodyEnd = `${CRLF}--${boundary}${CRLF}`;
      bodyEnd += `Content-Disposition: form-data; name="audio"; filename="test-audio.wav"${CRLF}`;
      bodyEnd += `Content-Type: audio/wav${CRLF}${CRLF}`;
      
      const finalBoundary = `${CRLF}--${boundary}--${CRLF}`;
      
      // Calculate content length
      const bodyBuffer = Buffer.from(body, 'utf8');
      const bodyEndBuffer = Buffer.from(bodyEnd, 'utf8');
      const finalBoundaryBuffer = Buffer.from(finalBoundary, 'utf8');
      const contentLength = bodyBuffer.length + videoData.length + bodyEndBuffer.length + audioData.length + finalBoundaryBuffer.length;
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/recording/process-recording',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': contentLength
        }
      };

      this.log('Starting upload...');
      
      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            
            if (res.statusCode === 200) {
              this.log('Upload successful!', 'success');
              this.log(`Response: ${JSON.stringify(result, null, 2)}`);
              resolve(true);
            } else {
              this.log(`Upload failed: ${res.statusCode}`, 'error');
              this.log(`Error: ${responseData}`);
              resolve(false);
            }
          } catch (error) {
            this.log(`Response parse error: ${error.message}`, 'error');
            this.log(`Raw response: ${responseData}`);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        this.log(`Upload request error: ${error.message}`, 'error');
        resolve(false);
      });

      // Write the multipart data
      req.write(bodyBuffer);
      req.write(videoData);
      req.write(bodyEndBuffer);
      req.write(audioData);
      req.write(finalBoundaryBuffer);
      req.end();
      
      // Cleanup
      setTimeout(() => {
        try {
          fs.unlinkSync(testVideoPath);
          fs.unlinkSync(testAudioPath);
          this.log('Cleaned up test files');
        } catch (error) {
          // Ignore cleanup errors
        }
      }, 1000);
    });
  }

  async waitForEvents(timeoutMs = 15000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const check = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > timeoutMs) {
          this.log('Timeout waiting for events', 'error');
          resolve();
        } else if (this.receivedVideo) {
          this.log('Video event received - success!', 'success');
          resolve();
        } else {
          setTimeout(check, 1000);
        }
      };
      
      check();
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('VIDEO LOADING DEBUG REPORT');
    console.log('='.repeat(50));
    
    console.log(`\nSession ID: ${this.sessionId}`);
    console.log(`WebSocket Connected: ${this.socket?.connected ? '✅' : '❌'}`);
    console.log(`Total Events: ${this.events.length}`);
    
    console.log('\n📊 Critical Events:');
    console.log(`  Video Event: ${this.receivedVideo ? '✅ RECEIVED' : '❌ NOT RECEIVED'}`);
    console.log(`  Audio Event: ${this.receivedAudio ? '✅ RECEIVED' : '❌ NOT RECEIVED'}`);
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    if (!this.receivedVideo) {
      console.log('❌ VIDEO EVENT NOT RECEIVED');
      console.log('   This is why the video player shows "Waiting for video..."');
      console.log('   The backend is not sending the video event after upload.');
      console.log('\n💡 LIKELY CAUSES:');
      console.log('   1. Backend processing is failing silently');
      console.log('   2. File paths are incorrect');
      console.log('   3. WebSocket broadcast is not working');
      console.log('   4. Recording service is not calling sendVideo()');
    } else {
      console.log('✅ VIDEO EVENT RECEIVED');
      console.log('   The WebSocket communication is working correctly.');
      console.log('   Check if the video file URL is accessible.');
    }
    
    if (this.events.length > 0) {
      console.log('\n📋 Event Timeline:');
      this.events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.type}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }

  async cleanup() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  async run() {
    console.log('🔍 Video Loading Debug - Simple Version\n');
    
    try {
      await this.setupWebSocket();
      
      const uploadSuccess = await this.uploadTestVideo();
      
      if (uploadSuccess) {
        this.log('Waiting for video event...');
        await this.waitForEvents();
      }
      
      this.generateReport();
      
    } catch (error) {
      this.log(`Debug failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
    }
  }
}

const videoDebugger = new SimpleDebugger();
videoDebugger.run().catch(console.error);