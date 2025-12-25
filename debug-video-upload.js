#!/usr/bin/env node

/**
 * Debug Video Upload Flow
 * 
 * This script will help us identify exactly where the video loading is failing
 */

const { io } = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';

class VideoUploadDebugger {
  constructor() {
    this.sessionId = `debug_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.socket = null;
    this.events = [];
    this.receivedVideo = false;
    this.receivedAudio = false;
    this.receivedInstructions = false;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  async setupWebSocket() {
    return new Promise((resolve, reject) => {
      this.log('Connecting to WebSocket server...');
      
      this.socket = io(BACKEND_URL, {
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.log('WebSocket connected successfully', 'success');
        
        // Register session
        this.socket.emit('register', this.sessionId);
        this.log(`Registering session: ${this.sessionId}`);
        
        this.setupEventListeners();
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        this.log(`WebSocket connection failed: ${error.message}`, 'error');
        reject(error);
      });

      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  setupEventListeners() {
    this.socket.on('registered', (data) => {
      this.log(`Session registered successfully: ${data.sessionId}`, 'success');
    });

    this.socket.on('video', (data) => {
      this.log(`📹 Video event received!`, 'success');
      this.log(`   Filename: ${data.filename}`);
      this.log(`   Path: ${data.path}`);
      this.log(`   Full URL: ${BACKEND_URL}${data.path}`);
      this.log(`   Metadata: ${JSON.stringify(data.metadata, null, 2)}`);
      this.receivedVideo = true;
      this.events.push({ type: 'video', timestamp: Date.now(), data });
      
      // Test if the video file is actually accessible
      this.testVideoAccess(data.path);
    });

    this.socket.on('audio', (data) => {
      this.log(`🎵 Audio event received!`, 'success');
      this.log(`   Filename: ${data.filename}`);
      this.log(`   Path: ${data.path}`);
      this.log(`   Text length: ${data.text ? data.text.length : 0} characters`);
      this.receivedAudio = true;
      this.events.push({ type: 'audio', timestamp: Date.now(), data });
    });

    this.socket.on('instructions', (data) => {
      this.log(`📋 Instructions event received!`, 'success');
      this.log(`   Instructions: ${Array.isArray(data) ? data.length : 1} items`);
      this.receivedInstructions = true;
      this.events.push({ type: 'instructions', timestamp: Date.now(), data });
    });

    this.socket.on('processing_status', (data) => {
      this.log(`⚙️ Processing status: ${data.currentStep} (${data.progress}%) - ${data.message}`);
      this.events.push({ type: 'processing_status', timestamp: Date.now(), data });
    });

    this.socket.on('processing_complete', (data) => {
      this.log(`✅ Processing completed!`, 'success');
      this.events.push({ type: 'processing_complete', timestamp: Date.now(), data });
    });

    this.socket.on('processing_error', (data) => {
      this.log(`❌ Processing error: ${data.error}`, 'error');
      this.events.push({ type: 'processing_error', timestamp: Date.now(), data });
    });

    this.socket.on('error', (error) => {
      this.log(`Socket error: ${error.message}`, 'error');
    });
  }

  async testVideoAccess(videoPath) {
    try {
      const http = require('http');
      const url = `${BACKEND_URL}${videoPath}`;
      
      this.log(`Testing video file access: ${url}`);
      
      const options = new URL(url);
      const req = http.request(options, (res) => {
        this.log(`Video file response: ${res.statusCode}`, res.statusCode === 200 ? 'success' : 'error');
        this.log(`Content-Type: ${res.headers['content-type']}`);
        this.log(`Content-Length: ${res.headers['content-length']}`);
        
        if (res.statusCode !== 200) {
          this.log(`Video file not accessible! This is why the video won't load.`, 'error');
        }
      });

      req.on('error', (error) => {
        this.log(`Video file access error: ${error.message}`, 'error');
      });

      req.end();
    } catch (error) {
      this.log(`Error testing video access: ${error.message}`, 'error');
    }
  }

  createTestFiles() {
    const testVideoPath = path.join(__dirname, 'debug-test-video.webm');
    const testAudioPath = path.join(__dirname, 'debug-test-audio.wav');
    
    // Create minimal test files
    const webmHeader = Buffer.from([
      0x1A, 0x45, 0xDF, 0xA3, // EBML header
      0x9F, 0x42, 0x86, 0x81, 0x01, // DocType: webm
      0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D // "webm"
    ]);
    
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20  // "fmt "
    ]);
    
    fs.writeFileSync(testVideoPath, webmHeader);
    fs.writeFileSync(testAudioPath, wavHeader);
    
    this.log('Created test files for upload');
    return { testVideoPath, testAudioPath };
  }

  async uploadTestVideo() {
    const { testVideoPath, testAudioPath } = this.createTestFiles();
    
    try {
      this.log('Starting test video upload...');
      
      // Use the built-in FormData and fetch (Node.js 18+)
      const FormData = require('form-data');
      const fetch = require('node-fetch');
      
      const formData = new FormData();
      formData.append('sessionId', this.sessionId);
      formData.append('events', JSON.stringify([]));
      formData.append('video', fs.createReadStream(testVideoPath));
      formData.append('audio', fs.createReadStream(testAudioPath));
      formData.append('metadata', JSON.stringify({
        sessionId: this.sessionId,
        title: 'Debug Test Video',
        uploadedAt: new Date().toISOString()
      }));

      const response = await fetch(`${BACKEND_URL}/api/recording/process-recording`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });

      const result = await response.json();

      if (response.ok) {
        this.log('Upload successful!', 'success');
        this.log(`Response: ${JSON.stringify(result, null, 2)}`);
        return true;
      } else {
        this.log(`Upload failed: ${response.status}`, 'error');
        this.log(`Error: ${JSON.stringify(result, null, 2)}`);
        return false;
      }
    } catch (error) {
      this.log(`Upload error: ${error.message}`, 'error');
      return false;
    } finally {
      // Cleanup test files
      try {
        fs.unlinkSync(testVideoPath);
        fs.unlinkSync(testAudioPath);
        this.log('Cleaned up test files');
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  async waitForEvents(timeoutMs = 30000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkEvents = () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed > timeoutMs) {
          this.log('Timeout waiting for events', 'warning');
          resolve();
        } else if (this.receivedVideo && this.receivedAudio) {
          this.log('Received both video and audio events!', 'success');
          resolve();
        } else {
          setTimeout(checkEvents, 1000);
        }
      };
      
      checkEvents();
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('VIDEO UPLOAD DEBUG REPORT');
    console.log('='.repeat(60));
    
    console.log(`\nSession ID: ${this.sessionId}`);
    console.log(`WebSocket Connected: ${this.socket?.connected ? '✅' : '❌'}`);
    console.log(`Events Received: ${this.events.length}`);
    
    console.log('\n📊 Event Summary:');
    console.log(`  • Video Event: ${this.receivedVideo ? '✅' : '❌'}`);
    console.log(`  • Audio Event: ${this.receivedAudio ? '✅' : '❌'}`);
    console.log(`  • Instructions Event: ${this.receivedInstructions ? '✅' : '❌'}`);
    
    if (this.events.length > 0) {
      console.log('\n📋 Event Timeline:');
      this.events.forEach((event, index) => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        console.log(`  ${index + 1}. [${time}] ${event.type}`);
      });
    }
    
    console.log('\n🔍 Diagnosis:');
    if (!this.receivedVideo) {
      console.log('❌ VIDEO NOT RECEIVED - This is why the video player shows "Waiting for video..."');
      console.log('   Possible causes:');
      console.log('   • Backend not sending video event after upload');
      console.log('   • WebSocket connection issues');
      console.log('   • File processing errors');
    } else {
      console.log('✅ Video event received - Check if video file is accessible');
    }
    
    if (!this.receivedAudio) {
      console.log('❌ AUDIO NOT RECEIVED - Transcript panel will show "No Audio Available"');
    } else {
      console.log('✅ Audio event received - Transcript should be available');
    }
    
    console.log('\n' + '='.repeat(60));
  }

  async cleanup() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  async runDebug() {
    console.log('🔍 Starting Video Upload Debug Session...\n');
    
    try {
      // Step 1: Setup WebSocket
      await this.setupWebSocket();
      
      // Step 2: Upload test video
      const uploadSuccess = await this.uploadTestVideo();
      
      if (!uploadSuccess) {
        console.log('❌ Upload failed - cannot continue debug');
        return;
      }
      
      // Step 3: Wait for events
      this.log('Waiting for WebSocket events...');
      await this.waitForEvents();
      
      // Step 4: Generate report
      this.generateReport();
      
    } catch (error) {
      this.log(`Debug session failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
    }
  }
}

// Run debug if this script is executed directly
if (require.main === module) {
  const videoDebugger = new VideoUploadDebugger();
  videoDebugger.runDebug().catch(console.error);
}

module.exports = VideoUploadDebugger;