# 🧪 Clueso Complete Testing Guide

## 🚀 Quick Start Testing

### **1. Run Backend API Tests**
```bash
cd Clueso_Node_layer-main
node test-all-features.js
```

### **2. Frontend Manual Testing Checklist**

#### **Authentication Flow**
- [ ] Visit http://localhost:3001
- [ ] Click "Sign up" to create account
- [ ] Fill registration form and submit
- [ ] Verify redirect to dashboard
- [ ] Logout and login again
- [ ] Test "Forgot password" flow

#### **Dashboard Navigation**
- [ ] Verify sidebar navigation works
- [ ] Check user profile dropdown
- [ ] Test search functionality
- [ ] Navigate between pages (Dashboard, Projects, Analytics, Team)

#### **Project Management**
- [ ] Click "+ New video" button
- [ ] Create a new project with name/description
- [ ] Verify project appears in projects list
- [ ] Edit project details
- [ ] Delete a project

#### **Recording Features**
- [ ] Start a recording session
- [ ] Test video chunk upload
- [ ] Test audio chunk upload
- [ ] Stop recording session
- [ ] View recorded sessions in project

#### **Collaboration Features**
- [ ] Add timestamped comment on video
- [ ] Reply to existing comment
- [ ] Resolve/unresolve comments
- [ ] Test AI suggestion generation
- [ ] Dismiss AI suggestions

#### **Multi-Language Features**
- [ ] Add Spanish language support
- [ ] Switch between languages
- [ ] View translated subtitles
- [ ] Test subtitle synchronization

#### **AI Review Features**
- [ ] Generate AI review for demo
- [ ] View review insights and recommendations
- [ ] Check quality scoring
- [ ] Dismiss review suggestions

## 🔧 **Testing Individual Features**

### **1. Authentication System**

**Test Registration:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "fullName": "Test User",
    "username": "testuser"
  }'
```

**Test Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Test Protected Route:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Project Management**

**Create Project:**
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Project",
    "description": "A test project"
  }'
```

**Get Projects:**
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Recording Features**

**Start Recording Session:**
```bash
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/recordings/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sessionName": "Test Recording",
    "url": "https://example.com",
    "viewport": {"width": 1920, "height": 1080}
  }'
```

**Upload Video Chunk:**
```bash
curl -X POST http://localhost:3000/api/recording/video-chunk \
  -F "sessionId=SESSION_ID" \
  -F "sequence=0" \
  -F "chunk=@test-video.webm"
```

### **4. Collaboration Features**

**Add Comment:**
```bash
curl -X POST http://localhost:3000/api/collaboration/demos/SESSION_ID/comments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "username": "Test User",
    "timestamp": 45.2,
    "comment": "This needs improvement",
    "position": {"x": 300, "y": 150}
  }'
```

**Generate AI Suggestions:**
```bash
curl -X POST http://localhost:3000/api/collaboration/demos/SESSION_ID/ai-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Hello, welcome to our demo...",
    "pauseDurations": [0.5, 1.2, 0.8],
    "replayFrequency": [1, 2, 1]
  }'
```

### **5. Multi-Language Features**

**Add Language Support:**
```bash
curl -X POST http://localhost:3000/api/collaboration/demos/SESSION_ID/languages \
  -H "Content-Type: application/json" \
  -d '{
    "language": "es",
    "originalTranscript": "Hello, welcome to our demo..."
  }'
```

**Get Subtitles:**
```bash
curl -X GET http://localhost:3000/api/collaboration/demos/SESSION_ID/languages/es/subtitles
```

### **6. AI Review Features**

**Generate AI Review:**
```bash
curl -X POST http://localhost:3000/api/collaboration/demos/SESSION_ID/ai-review \
  -H "Content-Type: application/json" \
  -d '{
    "reviewType": "on_demand"
  }'
```

**Get AI Review:**
```bash
curl -X GET http://localhost:3000/api/collaboration/demos/SESSION_ID/ai-review
```

### **7. Video Processing Features**

**Upload Video:**
```bash
curl -X POST http://localhost:3000/api/videos/projects/PROJECT_ID/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "video=@test-video.mp4" \
  -F "audio=@test-audio.webm" \
  -F "title=Test Video" \
  -F "description=Test upload" \
  -F "template=tutorial"
```

**Get Processing Status:**
```bash
curl -X GET http://localhost:3000/api/videos/processing/SESSION_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 **Expected Results**

### **Successful Responses:**

**Authentication:**
- Registration: `201 Created` with user data and JWT token
- Login: `200 OK` with user data and JWT token
- Profile: `200 OK` with user profile data

**Projects:**
- Create: `201 Created` with project data
- List: `200 OK` with array of projects
- Get: `200 OK` with project details
- Update: `200 OK` with updated project
- Delete: `200 OK` with success message

**Recording:**
- Start session: `201 Created` with session data
- Upload chunk: `200 OK` with upload confirmation
- Stop session: `200 OK` with session data
- Get recordings: `200 OK` with recordings array

**Collaboration:**
- Add comment: `201 Created` with comment data
- Get comments: `200 OK` with comments array
- AI suggestions: `200 OK` with suggestions array
- Add language: `201 Created` with language data

**Video Processing:**
- Upload video: `201 Created` with processing info
- Processing status: `200 OK` with status data
- Get videos: `200 OK` with videos array

## 🚨 **Common Issues & Solutions**

### **Authentication Issues**
- **401 Unauthorized**: Check JWT token is included in Authorization header
- **403 Forbidden**: Verify user has permission for the resource
- **Token expired**: Login again to get new token

### **Database Issues**
- **Connection failed**: Verify Supabase credentials in .env
- **Table not found**: Run the database schema SQL
- **Permission denied**: Check Row Level Security policies

### **File Upload Issues**
- **413 Payload too large**: Check file size limits
- **400 Bad request**: Verify multipart/form-data headers
- **500 Server error**: Check file permissions and disk space

### **AI Service Issues**
- **AI suggestions fail**: Check if Python AI service is running
- **Translation errors**: Verify Google Gemini API key
- **Timeout errors**: AI services may take time, increase timeout

### **WebSocket Issues**
- **Connection failed**: Verify Socket.IO server is running
- **Events not received**: Check client-side event listeners
- **CORS errors**: Verify WebSocket CORS configuration

## 🔍 **Debugging Tips**

### **Check Server Logs**
```bash
# Backend logs
cd Clueso_Node_layer-main
npm run dev
# Watch for error messages and request logs
```

### **Check Frontend Console**
```bash
# Open browser developer tools
# Check Console tab for JavaScript errors
# Check Network tab for failed API requests
```

### **Database Debugging**
```bash
# Check Supabase dashboard
# Go to Table Editor to verify data
# Check Authentication to see users
# Review API logs for errors
```

### **Test API Endpoints Individually**
```bash
# Use curl or Postman to test each endpoint
# Start with authentication, then move to other features
# Check response status codes and error messages
```

## 📊 **Performance Testing**

### **Load Testing**
```bash
# Test concurrent users
ab -n 100 -c 10 http://localhost:3000/api/auth/login

# Test file uploads
ab -n 50 -c 5 -p test-data.json -T application/json http://localhost:3000/api/projects
```

### **Memory Usage**
```bash
# Monitor Node.js memory
node --inspect src/index.js

# Check for memory leaks
# Monitor WebSocket connections
# Check file upload cleanup
```

## 🎉 **Success Criteria**

### **All Features Working:**
- ✅ User can register and login
- ✅ Projects can be created and managed
- ✅ Recording sessions work end-to-end
- ✅ Comments can be added and managed
- ✅ AI suggestions generate properly
- ✅ Multi-language support functions
- ✅ AI reviews provide insights
- ✅ Video processing completes successfully
- ✅ Real-time collaboration works
- ✅ Frontend UI is responsive and functional

### **Performance Benchmarks:**
- ✅ API responses under 500ms
- ✅ File uploads handle 100MB+ files
- ✅ WebSocket connections stable
- ✅ Database queries optimized
- ✅ AI processing completes within 30s
- ✅ Frontend loads under 3s

### **Security Validation:**
- ✅ Authentication required for protected routes
- ✅ Users can only access their own data
- ✅ File uploads are validated
- ✅ SQL injection prevention works
- ✅ XSS protection enabled
- ✅ CORS properly configured

## 🚀 **Ready for Production**

Once all tests pass, your Clueso application is ready for:
- ✅ User registration and onboarding
- ✅ Project-based screen recording
- ✅ Team collaboration on demos
- ✅ Multi-language content creation
- ✅ AI-powered content improvement
- ✅ Professional video processing
- ✅ Analytics and insights

**Happy testing! 🎯**