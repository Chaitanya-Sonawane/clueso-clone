# Clueso Collaboration & Video Sync API Guide

## Overview

This guide covers the enhanced backend APIs for video timeline synchronization, real-time playback sync, and team collaboration features.

## 🎥 Video Timeline & Audio Synchronization

### Core Concepts

- **Original Duration**: Always reflects the actual video file duration, not trimmed/preview duration
- **Audio Sync**: Video and audio streams are synchronized with metadata tracking
- **Timeline Calculations**: Derived from video metadata, not frontend assumptions

### Key Endpoints

#### Get Video Metadata
```http
GET /api/videos/{sessionId}/metadata
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "session_123",
    "originalDuration": 120.5,
    "currentTime": 0,
    "hasAudio": true,
    "audioTrackDuration": 120.5,
    "playbackState": {
      "isPlaying": false,
      "playbackRate": 1.0,
      "activeUsers": 0
    },
    "metadata": {
      "video": {
        "width": 1920,
        "height": 1080,
        "fps": 30,
        "codec": "h264"
      },
      "audio": {
        "codec": "aac",
        "sampleRate": 44100,
        "channels": 2
      }
    }
  }
}
```

#### Get Enhanced Video Details
```http
GET /api/videos/projects/{projectId}/videos/{sessionId}
Authorization: Bearer {jwt_token}
```

**Response includes:**
- `originalDuration` - Critical for timeline sync
- `hasAudio` - Audio availability
- `audioTrackDuration` - Audio track length
- `playbackState` - Current sync state
- `videoMetadata` - Complete metadata

## 🔁 Real-Time Playback Synchronization

### WebSocket Events

Connect to WebSocket server and authenticate:

```javascript
const socket = io('http://localhost:3001');

// Authenticate user
socket.emit('authenticate', {
  userId: 'user_123',
  username: 'john_doe',
  token: 'jwt_token_here'
});

// Join video collaboration
socket.emit('join_video', {
  videoId: 'session_123',
  videoMetadata: {
    originalDuration: 120.5,
    hasAudio: true,
    audioTrackDuration: 120.5
  }
});
```

### Playback Control Events

#### Play/Pause/Seek
```javascript
// Play video
socket.emit('playback_control', {
  action: 'play',
  currentTime: 45.2
});

// Pause video
socket.emit('playback_control', {
  action: 'pause',
  currentTime: 45.2
});

// Seek to position
socket.emit('playback_control', {
  action: 'seek',
  currentTime: 60.0
});

// Change playback rate
socket.emit('playback_control', {
  action: 'rate_change',
  playbackRate: 1.5,
  currentTime: 45.2
});
```

#### Receiving Sync Events
```javascript
// Playback control from other users
socket.on('playback_control', (data) => {
  console.log('Playback event:', data);
  // {
  //   action: 'play',
  //   videoId: 'session_123',
  //   currentTime: 45.2,
  //   timestamp: 1640995200000,
  //   initiatedBy: { userId: 'user_456', username: 'jane_doe' }
  // }
});

// Current playback state
socket.on('playback_state', (state) => {
  console.log('Playback state:', state);
  // {
  //   videoId: 'session_123',
  //   currentTime: 45.2,
  //   isPlaying: true,
  //   playbackRate: 1.0,
  //   originalDuration: 120.5,
  //   hasAudio: true,
  //   activeUsers: 3
  // }
});

// User joined/left video
socket.on('user_joined', (data) => {
  console.log('User joined:', data.user);
});

socket.on('user_left', (data) => {
  console.log('User left:', data.user);
});
```

### Permission System

- **Controller**: User who can control playback (play/pause/seek)
- **Viewer**: User who can only watch
- **Auto-transfer**: Control transfers when controller leaves

```javascript
// Grant control to another user
socket.emit('grant_control', {
  videoId: 'session_123',
  userId: 'user_456'
});

// Receive control
socket.on('control_granted', (data) => {
  console.log('You now have control');
});
```

## 👥 Team Collaboration & Invites

### Create Collaboration Session

```http
POST /api/collaboration/videos/{videoId}/session
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "sessionName": "Product Demo Review",
  "allowComments": true,
  "allowPlaybackControl": true,
  "requireApproval": false,
  "maxParticipants": 10
}
```

### Invite Team Members

```http
POST /api/collaboration/sessions/{sessionId}/invite
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "invites": [
    {
      "email": "teammate@company.com",
      "role": "editor",
      "permissions": {
        "canControlPlayback": true,
        "canComment": true,
        "canResolveComments": true
      }
    },
    {
      "email": "client@external.com",
      "role": "viewer",
      "permissions": {
        "canComment": true
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "email": "teammate@company.com",
        "status": "sent",
        "inviteId": "invite_123",
        "userExists": true
      }
    ],
    "summary": {
      "total": 2,
      "sent": 2,
      "failed": 0
    }
  }
}
```

### Accept Invite

```http
POST /api/collaboration/invites/{inviteToken}/accept
Authorization: Bearer {jwt_token}
```

### Manage Participants

#### Get Session Participants
```http
GET /api/collaboration/sessions/{sessionId}/participants
Authorization: Bearer {jwt_token}
```

#### Remove Participant
```http
DELETE /api/collaboration/sessions/{sessionId}/participants/{userId}
Authorization: Bearer {jwt_token}
```

#### Update Participant Role
```http
PUT /api/collaboration/sessions/{sessionId}/participants/{userId}/role
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "role": "admin",
  "permissions": {
    "canInvite": true,
    "canControlPlayback": true,
    "canComment": true,
    "canResolveComments": true
  }
}
```

## 🔐 Security & Access Control

### Permission Levels

#### Owner
- Full control over session
- Can invite/remove users
- Can control playback
- Can delete session

#### Admin
- Can invite/remove users
- Can control playback
- Can manage comments
- Cannot delete session

#### Editor
- Can control playback
- Can add/resolve comments
- Cannot invite users

#### Viewer
- Can view video
- Can add comments
- Cannot control playback

### Authentication

All endpoints require JWT authentication:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Access Validation

- Users can only access videos in their projects
- Collaboration participants verified by session membership
- Playback control restricted by permissions
- Invite permissions checked before sending

## 📡 WebSocket Event Reference

### Connection Events
- `authenticate` - Authenticate user for collaboration
- `join_video` - Join video collaboration session
- `disconnect` - Leave all sessions

### Playback Events
- `playback_control` - Control video playback
- `get_playback_state` - Request current state
- `grant_control` - Transfer control to another user

### Collaboration Events
- `collaboration_invite` - Real-time invite notification
- `collaboration_removed` - Removed from session
- `user_joined` - User joined video session
- `user_left` - User left video session
- `control_granted` - Received playback control

### Response Events
- `authenticated` - Authentication successful
- `playback_state` - Current playback state
- `playback_control` - Playback event from other users
- `control_granted` - Control transfer notification
- `error` - Error messages

## 🚀 Implementation Examples

### Frontend Integration

```javascript
class VideoCollaboration {
  constructor(videoId, apiUrl, wsUrl) {
    this.videoId = videoId;
    this.apiUrl = apiUrl;
    this.socket = io(wsUrl);
    this.setupEventHandlers();
  }

  async initialize() {
    // Get video metadata
    const metadata = await this.getVideoMetadata();
    
    // Authenticate and join
    this.socket.emit('authenticate', {
      userId: this.currentUser.id,
      username: this.currentUser.username,
      token: this.authToken
    });
    
    this.socket.emit('join_video', {
      videoId: this.videoId,
      videoMetadata: metadata
    });
  }

  setupEventHandlers() {
    this.socket.on('playback_control', (data) => {
      this.syncVideoPlayer(data);
    });
    
    this.socket.on('user_joined', (data) => {
      this.updateUserList(data);
    });
  }

  play() {
    const currentTime = this.videoPlayer.currentTime;
    this.socket.emit('playback_control', {
      action: 'play',
      currentTime: currentTime
    });
  }

  async inviteUsers(emails) {
    const invites = emails.map(email => ({
      email,
      role: 'viewer',
      permissions: { canComment: true }
    }));
    
    const response = await fetch(`${this.apiUrl}/collaboration/sessions/${this.sessionId}/invite`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ invites })
    });
    
    return response.json();
  }
}
```

## ✅ Testing the Implementation

### 1. Video Upload & Metadata
```bash
# Upload video and check metadata extraction
curl -X POST http://localhost:3001/api/videos/projects/proj_123/videos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "video=@test-video.mp4" \
  -F "title=Test Video"

# Get metadata
curl http://localhost:3001/api/videos/session_123/metadata \
  -H "Authorization: Bearer $TOKEN"
```

### 2. WebSocket Playback Sync
```javascript
// Test real-time sync between multiple browser tabs
const socket1 = io('http://localhost:3001');
const socket2 = io('http://localhost:3001');

// Both join same video
socket1.emit('join_video', { videoId: 'session_123' });
socket2.emit('join_video', { videoId: 'session_123' });

// Control from socket1, verify socket2 receives event
socket1.emit('playback_control', { action: 'play', currentTime: 30 });
```

### 3. Team Collaboration
```bash
# Create collaboration session
curl -X POST http://localhost:3001/api/collaboration/videos/session_123/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionName": "Team Review"}'

# Send invites
curl -X POST http://localhost:3001/api/collaboration/sessions/collab_123/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"invites": [{"email": "test@example.com", "role": "viewer"}]}'
```

## 🔧 Configuration

### Environment Variables
```env
# WebSocket Configuration
WEBSOCKET_PORT=3001

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# File Processing
MAX_FILE_SIZE=500MB
UPLOAD_DIR=uploads

# Collaboration Settings
MAX_PARTICIPANTS_PER_SESSION=50
INVITE_EXPIRY_DAYS=7
```

### Database Tables

The system creates these tables automatically:
- `CollaborationSessions` - Video collaboration sessions
- `CollaborationParticipants` - Session participants
- `CollaborationInvites` - Pending invitations
- `PlaybackStates` - Real-time playback sync
- `VideoMetadata` - Enhanced video metadata
- `Comments` - Timestamped comments

## 📊 Monitoring & Analytics

### Playback Sync Stats
```javascript
// Get sync statistics
const stats = PlaybackSyncService.getStats();
console.log('Active sessions:', stats.activeSessions);
console.log('Total users:', stats.totalUsers);
```

### Collaboration Metrics
- Active collaboration sessions
- Invite acceptance rates
- User engagement per video
- Comment activity
- Playback control usage

This implementation provides a robust foundation for real-time video collaboration with precise timeline synchronization and comprehensive team management features.