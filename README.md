# Clueso - AI-Powered Screen Recording & Collaboration Platform

Clueso is a comprehensive full-stack application that enables users to record screen activities, generate AI-powered instructions, and collaborate on demos with real-time features.

## 🚀 Features

### Core Recording Features
- **Screen Recording**: Capture screen activities with audio
- **Real-time Processing**: Live video and audio processing
- **AI-Generated Instructions**: Automatic step-by-step instruction generation
- **Session Management**: Organized recording sessions with unique IDs

### Collaboration Features
- **Real-time Comments**: Add timestamped comments during playback
- **Multi-language Support**: Translate demos to different languages
- **AI Review System**: Automated demo analysis and suggestions
- **WebSocket Integration**: Real-time collaboration updates

### Technical Features
- **Full-stack Architecture**: Next.js frontend + Node.js backend
- **Database Integration**: Supabase for data persistence
- **File Management**: Organized video/audio storage system
- **Extension Support**: Browser extension compatibility

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI Service    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Database      │    │   AI Models     │
│   Extension     │    │   (Supabase)    │    │   (OpenAI/etc)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js**: v20.9.0 or higher
- **npm**: v10.0.0 or higher
- **Git**: Latest version
- **Supabase Account**: For database services

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Clueso
```

### 2. Install Node.js 20+ (if needed)
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 3. Backend Setup
```bash
cd Clueso_Node_layer-main

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Start the backend server
npm start
```

### 4. Frontend Setup
```bash
cd frontend-main

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

## ⚙️ Configuration

### Backend Environment Variables (.env)
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# AI Services
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# External Services
PYTHON_LAYER_URL=http://localhost:8000
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Frontend Environment Variables (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# AI Service URL
NEXT_PUBLIC_AI_URL=http://localhost:8000

# Extension Support
NEXT_PUBLIC_ALLOW_EXTENSION_ACCESS=true
```

## 🚀 Running the Application

### Development Mode
1. **Start Backend** (Terminal 1):
```bash
cd Clueso_Node_layer-main
npm start
```

2. **Start Frontend** (Terminal 2):
```bash
cd frontend-main
npm run dev
```

3. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Network Access: http://192.168.1.14:3000

### Production Mode
```bash
# Build frontend
cd frontend-main
npm run build
npm start

# Backend runs the same
cd Clueso_Node_layer-main
npm start
```

## 📁 Project Structure

```
Clueso/
├── frontend-main/                 # Next.js Frontend Application
│   ├── app/                      # App Router pages
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utility libraries
│   └── public/                   # Static assets
│
├── Clueso_Node_layer-main/       # Node.js Backend Application
│   ├── src/
│   │   ├── controllers/          # API controllers
│   │   ├── services/             # Business logic
│   │   ├── models/               # Database models
│   │   ├── routes/               # API routes
│   │   └── config/               # Configuration files
│   ├── uploads/                  # File storage
│   └── recordings/               # Recording storage
│
├── Clueso_extension-main/        # Browser Extension
└── ProductAI-main(1)/            # AI Service (Python)
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Recording
- `POST /api/projects/:id/recordings/start` - Start recording
- `POST /api/projects/:id/recordings/:sessionId/stop` - Stop recording
- `POST /api/recording/video-chunk` - Upload video chunk
- `POST /api/recording/audio-chunk` - Upload audio chunk

### Collaboration
- `GET /api/collaboration/demos/:id/comments` - Get comments
- `POST /api/collaboration/demos/:id/comments` - Add comment
- `POST /api/collaboration/demos/:id/ai-suggestions` - Generate AI suggestions
- `POST /api/collaboration/demos/:id/ai-review` - Generate AI review

## 🧪 Testing

### Backend Tests
```bash
cd Clueso_Node_layer-main
npm test

# Test specific features
node test-auth-simple.js
node test-collaboration-features.js
node test-complete-system.js
```

### Frontend Tests
```bash
cd frontend-main
npm test
```

## 🐛 Troubleshooting

### Common Issues

1. **Node.js Version Error**
   ```
   Error: You are using Node.js 18.x. For Next.js, Node.js version ">=20.9.0" is required.
   ```
   **Solution**: Upgrade to Node.js 20+ using nvm

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE: address already in use :::3000
   ```
   **Solution**: Kill existing processes or use different ports

3. **Connection Refused Errors**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:3001
   ```
   **Solution**: Ensure backend server is running on port 3001

4. **Supabase Connection Issues**
   **Solution**: Verify Supabase credentials in environment variables

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core recording features
- **v1.1.0** - Added collaboration features
- **v1.2.0** - AI integration and review system
- **Current** - Enhanced stability and performance

---

**Built with ❤️ using Next.js, Node.js, and modern web technologies**