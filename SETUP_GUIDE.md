# 🚀 Clueso Complete Setup Guide

This guide will help you set up the complete Clueso application with all the new features including authentication, collaboration, multi-language support, and AI-powered insights.

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (recommended database)
- Google Gemini API key (for AI features)
- Python 3.8+ (for AI processing layer)

## 🗄️ Database Setup (Supabase - Recommended)

### Why Supabase?
- Built-in authentication and user management
- Real-time subscriptions (perfect for collaboration)
- PostgreSQL with excellent performance
- Built-in file storage for recordings
- Easy API integration
- Great for analytics and insights

### Setup Steps:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run Database Schema**
   ```sql
   -- Copy and paste the contents of Clueso_Node_layer-main/database/supabase-schema.sql
   -- into your Supabase SQL editor and run it
   ```

3. **Configure Environment Variables**
   ```bash
   # In Clueso_Node_layer-main/.env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

## 🔧 Backend Setup (Node.js)

1. **Navigate to Backend Directory**
   ```bash
   cd Clueso_Node_layer-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Services
   GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   
   # Authentication
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   
   # Other configurations...
   ```

4. **Start the Backend Server**
   ```bash
   npm run dev
   ```

## 🎨 Frontend Setup (Next.js)

1. **Navigate to Frontend Directory**
   ```bash
   cd Clueso_Frontend_layer-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=http://localhost:3000
   ```

4. **Start the Frontend Server**
   ```bash
   npm run dev
   ```

## 🤖 AI Layer Setup (Python - Optional)

1. **Navigate to AI Directory**
   ```bash
   cd ProductAI-main/ProductAI-main
   ```

2. **Install Python Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start AI Service**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## 🌐 Browser Extension Setup

1. **Navigate to Extension Directory**
   ```bash
   cd Clueso_extension-main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Extension**
   ```bash
   npm run build
   ```

4. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## ✨ New Features Overview

### 🔐 Authentication System
- User registration and login
- JWT-based authentication
- Profile management
- Password reset functionality

### 🤝 Collaboration Features
- Real-time commenting on videos
- Timestamped feedback
- Team member management
- Project sharing and permissions

### 🌍 Multi-Language Support
- 12+ supported languages
- AI-powered translation
- Subtitle generation
- Language-specific sharing

### 🧠 AI-Powered Insights
- Automated content analysis
- Improvement suggestions
- Translation quality scoring
- Performance analytics

### 📊 Analytics Dashboard
- View counts and engagement metrics
- User behavior tracking
- Content performance insights
- Export capabilities

### 💬 Feedback System
- User feedback collection
- Bug reporting
- Feature requests
- Rating system

## 🚀 Getting Started

1. **Start All Services**
   ```bash
   # Terminal 1: Backend
   cd Clueso_Node_layer-main && npm run dev
   
   # Terminal 2: Frontend
   cd Clueso_Frontend_layer-main && npm run dev
   
   # Terminal 3: AI Layer (optional)
   cd ProductAI-main/ProductAI-main && uvicorn app.main:app --reload --port 8000
   ```

2. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3000/api
   - AI Layer: http://localhost:8000

3. **Create Your First Account**
   - Go to http://localhost:3000
   - Click "Sign up" to create an account
   - Start creating your first project!

## 🔧 Configuration Options

### Database Alternatives
While Supabase is recommended, you can also use:
- **MongoDB**: For document-based storage
- **Firebase**: For Google ecosystem integration
- **PostgreSQL**: Self-hosted option

### AI Service Providers
- **Google Gemini**: Recommended for translation and analysis
- **OpenAI GPT**: Alternative for content generation
- **Custom Models**: For specialized use cases

## 📱 Mobile Support
The application is responsive and works on:
- Desktop browsers
- Tablet devices
- Mobile browsers (limited recording features)

## 🔒 Security Features
- JWT token authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- SQL injection prevention

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure database schema is applied

2. **Authentication Problems**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Clear browser localStorage

3. **AI Features Not Working**
   - Verify API keys are set
   - Check Python service is running
   - Review API rate limits

4. **WebSocket Connection Issues**
   - Ensure backend server is running
   - Check CORS configuration
   - Verify WebSocket URL in frontend

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Collaboration Endpoints
- `POST /api/collaboration/demos/:id/comments` - Add comment
- `GET /api/collaboration/demos/:id/comments` - Get comments
- `POST /api/collaboration/demos/:id/languages` - Add language
- `POST /api/collaboration/demos/:id/ai-review` - Generate AI review

## 🎯 Next Steps

1. **Customize Branding**
   - Update logos and colors
   - Modify email templates
   - Configure domain settings

2. **Add Integrations**
   - Slack notifications
   - Google Drive storage
   - Zapier workflows

3. **Scale Infrastructure**
   - Set up CDN for video delivery
   - Configure load balancing
   - Implement caching strategies

## 🆘 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the console logs for errors
3. Ensure all environment variables are set correctly
4. Verify all services are running

## 🎉 Congratulations!

You now have a fully functional Clueso application with:
- ✅ User authentication and management
- ✅ Real-time collaboration features
- ✅ Multi-language support
- ✅ AI-powered insights
- ✅ Analytics dashboard
- ✅ Feedback system
- ✅ Modern, responsive UI

Start creating amazing product demos and documentation! 🚀