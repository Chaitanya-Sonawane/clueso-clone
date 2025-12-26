# Team Collaboration Integration Guide

## Overview

This integration brings the demo collaboration features from port 3001 into the main Clueso application UI and backend on port 3000. The team collaboration functionality now includes real-time video synchronization, team member invitations, and collaborative playback control.

## 🚀 Quick Start

### Option 1: Integrated Services (Recommended)
```bash
# Start both backend (3000) and frontend (3001) with collaboration features
./start-integrated-services.sh
```

### Option 2: Manual Setup
```bash
# Terminal 1: Start Backend (Port 3000)
cd Clueso_Node_layer-main
npm install
npm start

# Terminal 2: Start Frontend (Port 3001)  
cd frontend-main
npm install
PORT=3001 npm run dev
```

## 🌐 Service URLs

- **Frontend Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Demo Collaboration**: http://localhost:3000/demo
- **WebSocket Server**: ws://localhost:3000

## ✨ New Features

### 1. Team Collaboration Modal
- **Location**: Dashboard → "Add users" button
- **Features**:
  - Real-time team member invitations
  - Role-based permissions (Admin, Editor, Viewer)
  - Live collaboration session management
  - Activity logging and event tracking

### 2. Enhanced Team Management
- **Location**: Dashboard → Team tab
- **Features**:
  - Online status indicators
  - Live collaboration button
  - Enhanced invite system with form validation
  - Real-time member status updates

### 3. Real-time Video Synchronization
- **Features**:
  - Synchronized playback across all team members
  - Permission-based playback control
  - Timeline scrubbing with real-time updates
  - Playback rate synchronization

### 4. WebSocket Integration
- **Port**: 3000 (integrated with main backend)
- **Events**:
  - `authenticate` - User authentication
  - `join_video` - Join video collaboration session
  - `playback_control` - Control video playback
  - `invite_sent` - Team member invitation
  - `user_joined/left` - Session participant updates

## 🔧 Technical Implementation

### Backend Changes (Port 3000)
1. **Server Configuration**: Updated to run on port 3000
2. **Collaboration Routes**: Integrated collaboration API endpoints
3. **WebSocket Server**: Socket.IO server for real-time communication
4. **Demo Integration**: Demo page available at `/demo`

### Frontend Changes (Port 3001)
1. **Team Collaboration Modal**: New comprehensive collaboration interface
2. **Socket Configuration**: Updated to connect to port 3000
3. **Dashboard Integration**: "Add users" button opens collaboration modal
4. **Team Page Enhancement**: Added live collaboration features

### Key Components

#### TeamCollaborationModal.tsx
- **Purpose**: Main collaboration interface
- **Features**: 
  - Three-tab interface (Invite, Participants, Playback)
  - Real-time WebSocket communication
  - Playback synchronization controls
  - Activity event logging

#### Enhanced Team Page
- **Purpose**: Team management with collaboration features
- **Features**:
  - Online status indicators
  - Live collaboration access
  - Enhanced invite system

## 📡 API Endpoints

### Collaboration Management
```
POST /api/collaboration/videos/:videoId/session
POST /api/collaboration/sessions/:sessionId/invite
GET /api/collaboration/sessions/:sessionId/participants
DELETE /api/collaboration/sessions/:sessionId/participants/:userId
PUT /api/collaboration/sessions/:sessionId/participants/:userId/role
```

### Comments & Feedback
```
POST /api/collaboration/demos/:demoId/comments
GET /api/collaboration/demos/:demoId/comments
PATCH /api/collaboration/comments/:commentId/resolve
```

### AI Features
```
POST /api/collaboration/demos/:demoId/ai-suggestions
POST /api/collaboration/demos/:demoId/ai-review
GET /api/collaboration/demos/:demoId/ai-review
```

## 🔌 WebSocket Events

### Client → Server
- `authenticate` - User authentication with token
- `join_video` - Join video collaboration session
- `playback_control` - Control video playback (play, pause, seek)
- `request_control` - Request playback control permissions

### Server → Client
- `authenticated` - Authentication confirmation
- `session_created` - Collaboration session created
- `participants_updated` - Team member list updated
- `playback_state` - Current playback state
- `playback_control` - Playback event from other users
- `user_joined/left` - User session events
- `invite_sent` - Invitation sent confirmation

## 🎯 Usage Examples

### 1. Starting a Collaboration Session
```javascript
// Create collaboration session
const response = await fetch('http://localhost:3000/api/collaboration/videos/demo_video/session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_token'
  },
  body: JSON.stringify({
    sessionName: 'Team Review Session',
    allowComments: true,
    allowPlaybackControl: true,
    maxParticipants: 10
  })
});
```

### 2. Inviting Team Members
```javascript
// Send team invitations
const invites = [{
  email: 'colleague@company.com',
  role: 'editor',
  permissions: ['view', 'comment', 'control_playback']
}];

const response = await fetch(`http://localhost:3000/api/collaboration/sessions/${sessionId}/invite`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_token'
  },
  body: JSON.stringify({ invites })
});
```

### 3. WebSocket Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Authenticate user
socket.emit('authenticate', {
  userId: 'user_123',
  username: 'John Doe',
  token: 'your_jwt_token'
});

// Join video session
socket.emit('join_video', {
  videoId: 'video_123',
  videoMetadata: {
    title: 'Project Demo',
    duration: 120
  }
});

// Control playback
socket.emit('playback_control', {
  action: 'play',
  currentTime: 30.5
});
```

## 🔒 Security Features

### Authentication
- JWT token-based authentication
- Role-based access control (Owner, Admin, Editor, Viewer)
- Session-based permissions

### Permissions
- **Owner**: Full control over session and participants
- **Admin**: Can invite users and manage participants
- **Editor**: Can control playback and add comments
- **Viewer**: Can view and add comments only

## 🐛 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :3000
   lsof -i :3001
   
   # Kill processes if needed
   kill -9 <PID>
   ```

2. **WebSocket Connection Issues**
   - Ensure backend is running on port 3000
   - Check browser console for connection errors
   - Verify CORS settings in backend

3. **Frontend Not Loading**
   - Ensure frontend is running on port 3001
   - Check if all dependencies are installed
   - Verify environment variables

### Debug Mode
```bash
# Enable debug logging
DEBUG=socket.io* npm start  # Backend
DEBUG=1 npm run dev        # Frontend
```

## 📊 Performance Considerations

### WebSocket Optimization
- Connection pooling for multiple users
- Event throttling for playback updates
- Automatic reconnection handling

### Scalability
- Session-based user management
- Efficient event broadcasting
- Memory-optimized participant tracking

## 🔄 Migration from Demo

The integration maintains backward compatibility with the existing demo while adding new features:

1. **Demo Page**: Still available at `http://localhost:3000/demo`
2. **API Compatibility**: All existing endpoints remain functional
3. **WebSocket Events**: Same event structure with additional features

## 🚀 Future Enhancements

### Planned Features
- Screen sharing during collaboration
- Voice chat integration
- Advanced permission management
- Session recording and playback
- Mobile app support

### API Extensions
- Bulk user invitations
- Session templates
- Advanced analytics
- Integration webhooks

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Ensure all services are running on correct ports
4. Verify WebSocket connections in browser dev tools

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. ✅ Backend server running on port 3000
2. ✅ Frontend dashboard accessible on port 3001
3. ✅ "Add users" button opens collaboration modal
4. ✅ WebSocket connection established (check browser console)
5. ✅ Real-time events appearing in activity log
6. ✅ Demo page accessible at localhost:3000/demo

The team collaboration features are now fully integrated into the main Clueso application, providing a seamless experience for real-time collaboration on video projects.