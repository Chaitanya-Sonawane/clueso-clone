# 🎥 Screen Recording with Video & Audio - Project Integration Guide

## 🚀 Overview

Clueso now supports comprehensive screen recording with video and audio capture, fully integrated with project management. Users can create projects, start recording sessions, and capture both screen video and microphone audio simultaneously.

## 📋 Features

### ✅ **Project Management**
- Create and manage projects
- Organize recordings by project
- Track recording sessions per project
- User-specific project access

### ✅ **Screen Recording Capabilities**
- **Video Capture**: Full screen recording in WebM format
- **Audio Capture**: Microphone recording in WebM format
- **Real-time Streaming**: Chunked upload during recording
- **Synchronized Playback**: Video and audio synchronized
- **AI Processing**: Automatic transcription and analysis

### ✅ **Data Storage**
- **Supabase Integration**: All data stored in Supabase
- **File Management**: Video/audio files with metadata
- **AI Analysis**: Transcription and processing results
- **Session Tracking**: Complete recording session history

## 🔧 API Endpoints

### **Project Management**
```bash
# Create a new project
POST /api/projects
{
  "name": "My Project",
  "description": "Project description"
}

# Get user's projects
GET /api/projects

# Get specific project with recordings
GET /api/projects/{projectId}

# Update project
PUT /api/projects/{projectId}
{
  "name": "Updated Name",
  "description": "Updated description"
}

# Delete project
DELETE /api/projects/{projectId}
```

### **Recording Sessions**
```bash
# Start recording session
POST /api/projects/{projectId}/recordings/start
{
  "sessionName": "Recording Session 1",
  "url": "https://example.com",
  "viewport": { "width": 1920, "height": 1080 }
}

# Stop recording session
POST /api/projects/{projectId}/recordings/{sessionId}/stop

# Get project recordings
GET /api/projects/{projectId}/recordings
```

### **Recording Upload**
```bash
# Upload video chunks (during recording)
POST /api/recording/video-chunk
FormData: {
  sessionId: "session_id",
  sequence: 0,
  chunk: <binary_data>
}

# Upload audio chunks (during recording)
POST /api/recording/audio-chunk
FormData: {
  sessionId: "session_id", 
  sequence: 0,
  chunk: <binary_data>
}

# Process final recording
POST /api/recording/process-recording
FormData: {
  events: JSON.stringify([...domEvents]),
  metadata: JSON.stringify({
    sessionId: "session_id",
    projectId: "project_id",
    startTime: "2025-12-22T10:00:00Z",
    endTime: "2025-12-22T10:05:00Z",
    url: "https://example.com",
    viewport: { width: 1920, height: 1080 }
  }),
  video: <video_file>,
  audio: <audio_file>
}
```

## 🎯 Usage Flow

### **1. Create Project**
```javascript
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Website Testing Project',
    description: 'Testing user interactions on our website'
  })
});

const project = await response.json();
```

### **2. Start Recording Session**
```javascript
const sessionResponse = await fetch(`/api/projects/${projectId}/recordings/start`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionName: 'User Journey Test',
    url: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  })
});

const session = await sessionResponse.json();
const sessionId = session.data.id;
```

### **3. Browser Extension Recording**
```javascript
// In browser extension content script
const startRecording = async () => {
  // Get screen and audio streams
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: { mediaSource: 'screen' },
    audio: true
  });
  
  const audioStream = await navigator.mediaDevices.getUserMedia({
    audio: true
  });

  // Create separate recorders for video and audio
  const videoRecorder = new MediaRecorder(screenStream, {
    mimeType: 'video/webm;codecs=vp9'
  });
  
  const audioRecorder = new MediaRecorder(audioStream, {
    mimeType: 'audio/webm;codecs=opus'
  });

  // Handle video chunks
  videoRecorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      await uploadChunk('video', event.data, videoSequence++);
    }
  };

  // Handle audio chunks
  audioRecorder.ondataavailable = async (event) => {
    if (event.data.size > 0) {
      await uploadChunk('audio', event.data, audioSequence++);
    }
  };

  // Start recording
  videoRecorder.start(1000); // 1 second chunks
  audioRecorder.start(1000);
};

const uploadChunk = async (type, chunk, sequence) => {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('sequence', sequence);
  formData.append('chunk', chunk);

  await fetch(`/api/recording/${type}-chunk`, {
    method: 'POST',
    body: formData
  });
};
```

### **4. Stop Recording & Process**
```javascript
const stopRecording = async () => {
  // Stop recording session
  await fetch(`/api/projects/${projectId}/recordings/${sessionId}/stop`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  // Process the recording
  const formData = new FormData();
  formData.append('events', JSON.stringify(domEvents));
  formData.append('metadata', JSON.stringify({
    sessionId: sessionId,
    projectId: projectId,
    startTime: recordingStartTime,
    endTime: new Date().toISOString(),
    url: window.location.href,
    viewport: { width: window.innerWidth, height: window.innerHeight }
  }));

  const result = await fetch('/api/recording/process-recording', {
    method: 'POST',
    body: formData
  });

  console.log('Recording processed:', await result.json());
};
```

## 📊 Database Schema

### **Projects Table**
```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Recording Sessions Table**
```sql
CREATE TABLE recording_sessions (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id),
    session_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration INTEGER,
    file_path TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Files Table**
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY,
    recording_session_id UUID REFERENCES recording_sessions(id),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    file_path TEXT,
    storage_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **AI Analysis Table**
```sql
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY,
    recording_session_id UUID REFERENCES recording_sessions(id),
    analysis_type VARCHAR(100), -- 'transcription', 'ai_processing'
    result JSONB,
    confidence_score DECIMAL(3,2),
    processing_time INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎥 Recording Features

### **Video Recording**
- **Format**: WebM with VP9 codec
- **Quality**: Full screen resolution
- **Streaming**: Real-time chunked upload
- **Storage**: Permanent files in `/recordings/` directory
- **Playback**: Direct browser playback support

### **Audio Recording**
- **Format**: WebM with Opus codec
- **Source**: Microphone input
- **Quality**: High-quality audio capture
- **Transcription**: Automatic with Deepgram
- **AI Processing**: OpenAI analysis of transcribed text

### **Synchronization**
- Video and audio recorded separately
- Synchronized playback in frontend
- Metadata tracking for timing
- DOM events correlated with recordings

## 🔄 Real-time Features

### **Live Streaming**
- Chunks uploaded during recording
- Real-time progress tracking
- Immediate feedback to user
- Error handling and recovery

### **WebSocket Integration**
- Live session status updates
- Real-time collaboration features
- Instant notifications
- Progress broadcasting

## 🎯 Frontend Integration

### **Project Dashboard**
```javascript
// Get user projects
const projects = await fetch('/api/projects', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Display projects with recording counts
projects.data.forEach(project => {
  console.log(`${project.name}: ${project.recording_sessions.length} recordings`);
});
```

### **Recording Playback**
```javascript
// Get project recordings
const recordings = await fetch(`/api/projects/${projectId}/recordings`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Play video and audio
recordings.data.recordings.forEach(recording => {
  const videoFile = recording.files.find(f => f.file_type === 'video/webm');
  const audioFile = recording.files.find(f => f.file_type === 'audio/webm');
  
  if (videoFile) {
    const videoElement = document.createElement('video');
    videoElement.src = `/recordings/${videoFile.filename}`;
    videoElement.controls = true;
    document.body.appendChild(videoElement);
  }
});
```

## 🚀 Getting Started

1. **Create a Project**: Use the project API to create a new project
2. **Install Extension**: Load the browser extension for recording
3. **Start Session**: Begin a recording session within the project
4. **Record**: Capture screen video and microphone audio
5. **Process**: AI transcription and analysis automatically
6. **Review**: Access recordings through the project dashboard

Your screen recording system is now fully integrated with project management and ready for comprehensive video and audio capture!