#!/usr/bin/env node

/**
 * Test Script: Video Upload Flow Verification
 * 
 * This script tests the complete video upload and processing flow
 * to ensure the "Waiting for video..." issue is resolved.
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { io } = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

class VideoUploadFlowTester {
  constructor() {
    this.sessionId = `test_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.socket = null;
    this.events = [];
    this.testResults = {
      upload: false,
      videoReceived: false,
      audioReceived: false,
      instructionsReceived: false,
      processingStatusReceived: false,
      processingCompleted: false,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async createTestVideoFile() {
    // Create a simple test video file (placeholder)
    const testVideoPath = path.join(__dirname, 'test-video.webm');
    
    if (!fs.existsSync(testVideoPath)) {
      // Create a minimal WebM file (just header bytes for testing)
      const webmHeader = Buffer.from([
        0x1A, 0x45, 0xDF, 0xA3, // EBML header
        0x9F, 0x42, 0x86, 0x81, 0x01, // DocType: webm
        0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6D // "webm"
      ]);
      
      fs.writeFileSync(testVideoPath, webmHeader);
      this.log('Created test video file');
    }
    
    return testVideoPath;
  }

  async createTestAudioFile() {
    // Create a simple test audio file (placeholder)
    const testAudioPath = path.join(__dirname, 'test-audio.wav');
    
    if (!fs.existsSync(testAudioPath)) {
      // Create a minimal WAV file header
      const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x24, 0x00, 0x00, 0x00, // File size
        0x57, 0x41, 0x56, 0x45, // "WAVE"
        0x66, 0x6D, 0x74, 0x20  // "fmt "
      ]);
      
      fs.writeFileSync(testAudioPath, wavHeader);
      this.log('Created test audio file');
    }
    
    return testAudioPath;
  }

  async setupWebSocketConnection() {
    return new Promise((resolve, reject) => {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket']
      });

      this.socket.on('connect', () => {
        this.log('WebSocket connected');
        
        // Register session
        this.socket.emit('register', this.sessionId);
        
        // Set up event listeners
        this.setupEventListeners();
        
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        this.log(`WebSocket connection failed: ${error.message}`, 'error');
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.socket.connected) {
          reject(new Error('WebSocket connection timeout'));
        }
      }, 10000);
    });
  }

  setupEventListeners() {
    // Listen for all expected events
    this.socket.on('registered', (data) => {
      this.log(`Session registered: ${data.sessionId}`);
    });

    this.socket.on('video', (data) => {
      this.log(`Video received: ${data.filename}`, 'success');
      this.testResults.videoReceived = true;
      this.events.push({ type: 'video', timestamp: Date.now(), data });
    });

    this.socket.on('audio', (data) => {
      this.log(`Audio received: ${data.filename}`, 'success');
      this.testResults.audioReceived = true;
      this.events.push({ type: 'audio', timestamp: Date.now(), data });
    });

    this.socket.on('instructions', (data) => {
      this.log(`Instructions received: ${Array.isArray(data) ? data.length : 1} items`, 'success');
      this.testResults.instructionsReceived = true;
      this.events.push({ type: 'instructions', timestamp: Date.now(), data });
    });

    this.socket.on('processing_status', (data) => {
      this.log(`Processing status: ${data.currentStep} (${data.progress}%) - ${data.message}`);
      this.testResults.processingStatusReceived = true;
      this.events.push({ type: 'processing_status', timestamp: Date.now(), data });
    });

    this.socket.on('processing_complete', (data) => {
      this.log('Processing completed!', 'success');
      this.testResults.processingCompleted = true;
      this.events.push({ type: 'processing_complete', timestamp: Date.now(), data });
    });

    this.socket.on('processing_error', (data) => {
      this.log(`Processing error: ${data.error}`, 'error');
      this.testResults.errors.push(data.error);
      this.events.push({ type: 'processing_error', timestamp: Date.now(), data });
    });

    this.socket.on('error', (error) => {
      this.log(`Socket error: ${error.message}`, 'error');
      this.testResults.errors.push(error.message);
    });
  }

  async uploadVideo() {
    try {
      const videoPath = await this.createTestVideoFile();
      const audioPath = await this.createTestAudioFile();

      const formData = new FormData();
      formData.append('sessionId', this.sessionId);
      formData.append('title', 'Test Video Upload');
      formData.append('description', 'Testing video upload flow');
      formData.append('template', 'demo');
      formData.append('video', fs.createReadStream(videoPath));
      formData.append('audio', fs.createReadStream(audioPath));

      this.log('Uploading video files...');

      const response = await fetch(`${BACKEND_URL}/api/v1/recording/process-recording`, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders()
        }
      });

      const result = await response.json();

      if (response.ok) {
        this.log('Video upload successful', 'success');
        this.testResults.upload = true;
        return result;
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      this.log(`Upload failed: ${error.message}`, 'error');
      this.testResults.errors.push(error.message);
      throw error;
    }
  }

  async waitForEvents(timeoutMs = 60000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkCompletion = () => {
        const elapsed = Date.now() - startTime;
        
        // Check if we've received all expected events or timed out
        if (this.testResults.processingCompleted || elapsed > timeoutMs) {
          resolve();
        } else {
          setTimeout(checkCompletion, 1000);
        }
      };
      
      checkCompletion();
    });
  }

  generateReport() {
    const report = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      events: this.events,
      summary: {
        totalEvents: this.events.length,
        success: this.testResults.processingCompleted && this.testResults.errors.length === 0,
        issues: []
      }
    };

    // Analyze results
    if (!this.testResults.upload) {
      report.summary.issues.push('Video upload failed');
    }
    
    if (!this.testResults.videoReceived) {
      report.summary.issues.push('Video event not received - UI will show "Waiting for video..."');
    }
    
    if (!this.testResults.audioReceived) {
      report.summary.issues.push('Audio event not received - Transcript panel will show "No Audio Available"');
    }
    
    if (!this.testResults.processingStatusReceived) {
      report.summary.issues.push('Processing status updates not received - No progress indication');
    }
    
    if (!this.testResults.processingCompleted) {
      report.summary.issues.push('Processing completion not received - UI may remain in processing state');
    }
    
    if (this.testResults.errors.length > 0) {
      report.summary.issues.push(`${this.testResults.errors.length} errors occurred`);
    }

    return report;
  }

  async cleanup() {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    // Clean up test files
    const testFiles = ['test-video.webm', 'test-audio.wav'];
    testFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }

  async runTest() {
    this.log('Starting video upload flow test...');
    this.log(`Session ID: ${this.sessionId}`);
    
    try {
      // Step 1: Setup WebSocket connection
      await this.setupWebSocketConnection();
      
      // Step 2: Upload video
      await this.uploadVideo();
      
      // Step 3: Wait for processing events
      this.log('Waiting for processing events...');
      await this.waitForEvents();
      
      // Step 4: Generate report
      const report = this.generateReport();
      
      // Step 5: Display results
      this.displayResults(report);
      
      // Step 6: Save report
      const reportPath = path.join(__dirname, `test-report-${this.sessionId}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Test report saved to: ${reportPath}`);
      
      return report;
      
    } catch (error) {
      this.log(`Test failed: ${error.message}`, 'error');
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  displayResults(report) {
    console.log('\n' + '='.repeat(60));
    console.log('VIDEO UPLOAD FLOW TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\nSession ID: ${report.sessionId}`);
    console.log(`Test Time: ${report.timestamp}`);
    console.log(`Overall Success: ${report.summary.success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n📊 Event Summary:');
    console.log(`  • Upload: ${report.testResults.upload ? '✅' : '❌'}`);
    console.log(`  • Video Received: ${report.testResults.videoReceived ? '✅' : '❌'}`);
    console.log(`  • Audio Received: ${report.testResults.audioReceived ? '✅' : '❌'}`);
    console.log(`  • Processing Status: ${report.testResults.processingStatusReceived ? '✅' : '❌'}`);
    console.log(`  • Processing Complete: ${report.testResults.processingCompleted ? '✅' : '❌'}`);
    console.log(`  • Instructions Received: ${report.testResults.instructionsReceived ? '✅' : '❌'}`);
    
    if (report.summary.issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      report.summary.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }
    
    if (report.testResults.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.testResults.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    console.log(`\n📈 Total Events Received: ${report.summary.totalEvents}`);
    
    if (report.events.length > 0) {
      console.log('\n📋 Event Timeline:');
      report.events.forEach((event, index) => {
        const time = new Date(event.timestamp).toLocaleTimeString();
        console.log(`  ${index + 1}. [${time}] ${event.type}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (report.summary.success) {
      console.log('🎉 All tests passed! The "Waiting for video..." issue should be resolved.');
    } else {
      console.log('⚠️  Some tests failed. The video upload flow needs attention.');
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const tester = new VideoUploadFlowTester();
  
  tester.runTest()
    .then((report) => {
      process.exit(report.summary.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = VideoUploadFlowTester;