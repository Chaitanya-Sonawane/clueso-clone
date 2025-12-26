# 🚀 Clueso Backend API

> **Enterprise-grade Express.js backend with real-time collaboration, AI integration, and secure authentication**

## 📋 Overview

The Clueso Backend is a robust Node.js/Express.js API server that powers the Clueso screen recording and collaboration platform. It provides RESTful APIs, real-time WebSocket communication, AI service integration, and secure file handling.

## ✨ Key Features

- **🔐 JWT Authentication**: Secure user authentication with Supabase integration
- **🔄 Real-time Collaboration**: Socket.IO powered synchronized playback and commenting
- **🤖 AI Integration**: Modular AI services (Deepgram, OpenAI, Gemini)
- **📁 File Management**: Secure upload/download of video and audio files
- **📊 Database Management**: Sequelize ORM with PostgreSQL/SQLite support
- **🛡️ Security**: CORS, rate limiting, input validation, and error handling
- **📈 Logging**: Structured logging with Winston
- **🧪 Testing**: Comprehensive test routes and debugging tools

## 🛠 Tech Stack

```
Node.js 18+          - Runtime environment
Express.js 5.1.0     - Web application framework
Socket.IO 4.8.1      - Real-time bidirectional communication
Sequelize 6.37.7     - Promise-based ORM for SQL databases
JWT                  - JSON Web Token authentication
Winston 3.17.0       - Logging library
Multer 2.0.2         - File upload middleware
Joi 17.11.0          - Data validation
```

## 🏗 Architecture

### **Directory Structure**
```
src/
├── 📁 config/              # Configuration files
│   ├── database.js         # Database connection setup
│   ├── server-config.js    # Server configuration
│   ├── supabase.js         # Supabase client setup
│   └── logger-config.js    # Winston logger configuration
│
├── 📁 controllers/         # Request handlers (business logic)
│   ├── auth-controller.js          # Authentication logic
│   ├── collaboration-controller.js # Real-time collaboration
│   ├── recording-controller.js     # Video/audio processing
│   ├── project-controller.js       # Project management
│   └── ...
│
├── 📁 services/           # Business logic layer
│   ├── ai-service.js              # AI integration abstraction
│   ├── frontend-service.js        # WebSocket management
│   ├── playback-sync-service.js   # Video synchronization
│   ├── auth-service.js            # Authentication business logic
│   └── ...
│
├── 📁 routes/v1/          # API route definitions
│   ├── auth-routes.js             # Authentication endpoints
│   ├── collaboration-routes.js    # Collaboration endpoints
│   ├── recording-routes.js        # Recording management
│   └── ...
│
├── 📁 middlewares/        # Express middleware
│   ├── auth.js                    # JWT authentication middleware
│   └── error-handler.js           # Global error handling
│
├── 📁 models/             # Database models (Sequelize)
│   ├── collaboration-models.js    # Collaboration entities
│   └── ...
│
└── server.js              # Main application entry point
```

### **Service Layer Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│    Services     │───▶│   External APIs │
│   (HTTP Layer)  │    │ (Business Logic)│    │  (AI, Database) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Middlewares   │    │     Models      │    │   File System   │
│ (Auth, Validation)    │   (Database)    │    │   (Uploads)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- PostgreSQL or SQLite database
- Supabase account
- API keys for AI services (Deepgram, OpenAI, etc.)

### **Installation**
```bash
# Clone and navigate to backend
cd clueso-backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)

# Start development server
npm run dev
# Server runs on http://localhost:3000
```

### **Available Scripts**
```bash
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint checking
npm run lint:fix     # Fix ESLint issues
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# AI Services
DEEPGRAM_API_KEY=your_deepgram_api_key
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# External Services
PYTHON_LAYER_URL=http://localhost:8000
PYTHON_SERVICE_TIMEOUT=30000

# File Storage
UPLOAD_DIR=uploads
MAX_FILE_SIZE=100MB

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Analytics (Optional)
ANALYTICS_ENABLED=true
```

## 🔌 API Endpoints

### **Authentication**
```http
POST   /api/auth/register           # User registration
POST   /api/auth/login              # User login
GET    /api/auth/profile            # Get user profile
PUT    /api/auth/profile            # Update user profile
PUT    /api/auth/change-password    # Change password
```

### **Recording Management**
```http
POST   /api/recording/start         # Start recording session
POST   /api/recording/upload        # Upload video/audio files
GET    /api/recording/:sessionId    # Get recording details
POST   /api/recording/process       # Process uploaded files
DELETE /api/recording/:sessionId    # Delete recording
```

### **Collaboration**
```http
POST   /api/collaboration/videos/:videoId/session    # Create collaboration session
GET    /api/collaboration/videos/:videoId/session    # Get session details
POST   /api/collaboration/sessions/:sessionId/invite # Send invitations
GET    /api/collaboration/sessions/:sessionId/participants # Get participants
POST   /api/collaboration/demos/:demoId/comments     # Add comment
GET    /api/collaboration/demos/:demoId/comments     # Get comments
```

### **AI Services**
```http
POST   /api/python/process                           # AI content analysis
POST   /api/collaboration/demos/:demoId/ai-suggestions # Generate AI suggestions
POST   /api/collaboration/demos/:demoId/ai-review     # AI review generation
```

### **Project Management**
```http
GET    /api/projects                # Get user projects
POST   /api/projects                # Create new project
GET    /api/projects/:id            # Get project details
PUT    /api/projects/:id            # Update project
DELETE /api/projects/:id            # Delete project
```

## 🔄 WebSocket Events

### **Connection Management**
```javascript
// Client authentication
socket.emit('authenticate', { userId, username, token })

// Server responses
socket.on('authenticated', (userData) => {})
socket.on('user_joined', (userData) => {})
socket.on('user_left', (userData) => {})
```

### **Video Synchronization**
```javascript
// Join video session
socket.emit('join_video', { videoId, videoMetadata })

// Playback controls
socket.emit('playback_control', { 
  action: 'play|pause|seek|rate_change', 
  currentTime: 30.5,
  playbackRate: 1.5 
})

// Receive playback updates
socket.on('playback_state', (state) => {})
socket.on('playback_control', (controlData) => {})
```

### **Collaboration Features**
```javascript
// Comments
socket.emit('add_comment', { timestamp, comment, position })
socket.on('new_comment', (comment) => {})

// AI suggestions
socket.on('ai_suggestions', (suggestions) => {})
```

## 🧪 Testing & Debugging

### **Test Routes**
```http
GET    /api/test/sessions           # List all recording sessions
POST   /api/test/collaboration-session # Create test collaboration session
GET    /api/test/send-video/:sessionId  # Manually send video data
```

### **Demo Page**
Visit `http://localhost:3000/demo` for a comprehensive collaboration demo with:
- Real-time WebSocket connection testing
- Video playback synchronization
- Team collaboration features
- Event logging and debugging

### **Logging**
The application uses Winston for structured logging:
```javascript
Logger.info('Information message');
Logger.error('Error message', error);
Logger.warn('Warning message');
```

Logs are written to:
- Console (development)
- `Alllogs.log` file
- Structured JSON format for production

## 🔒 Security Features

### **Authentication & Authorization**
- JWT-based stateless authentication
- Role-based access control (Admin, Editor, Viewer)
- Secure password hashing with bcrypt
- Token expiration and refresh handling

### **Input Validation**
- Joi schema validation for all endpoints
- File upload restrictions and validation
- SQL injection prevention with Sequelize ORM
- XSS protection with input sanitization

### **Security Headers**
```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Access-Control-Allow-Origin: (configured origins)
```

## 🚀 Deployment

### **Production Build**
```bash
# Install production dependencies
npm ci --only=production

# Start production server
NODE_ENV=production npm start
```

### **Environment Setup**
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS origins
5. Set up SSL certificates
6. Configure file storage limits

### **Recommended Hosting**
- **Heroku**: Easy deployment with add-ons
- **Railway**: Modern deployment platform
- **DigitalOcean**: VPS with full control
- **AWS**: Enterprise-grade infrastructure

## 🔧 Development

### **Code Structure Guidelines**
- **Controllers**: Handle HTTP requests, minimal business logic
- **Services**: Contain business logic, reusable across controllers
- **Models**: Database schema and relationships
- **Middlewares**: Cross-cutting concerns (auth, validation, logging)
- **Routes**: API endpoint definitions and middleware application

### **Adding New Features**
1. Create model (if database changes needed)
2. Create service (business logic)
3. Create controller (HTTP handling)
4. Create routes (endpoint definition)
5. Add tests
6. Update documentation

### **Database Migrations**
```bash
# Create new migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npx sequelize-cli db:migrate

# Rollback migration
npx sequelize-cli db:migrate:undo
```

## 📊 Monitoring & Analytics

### **Health Checks**
```http
GET /api/health              # Basic health check
GET /api/status              # Detailed system status
```

### **Metrics**
- Request/response times
- Error rates and types
- WebSocket connection counts
- File upload/download metrics
- Database query performance

## 🤝 Contributing

1. Follow the established code structure
2. Add tests for new features
3. Update documentation
4. Follow ESLint configuration
5. Use conventional commit messages

## 📞 Support

- **Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive API documentation
- **Demo**: Interactive demo at `/demo` endpoint

---

**Built with ❤️ for the Clueso Platform**