# 🎨 Clueso Frontend

> **Modern Next.js frontend with real-time collaboration, AI-powered insights, and responsive design**

## 📋 Overview

The Clueso Frontend is a sophisticated React/Next.js application that provides an intuitive interface for screen recording, real-time collaboration, and AI-powered content analysis. Built with TypeScript and Tailwind CSS for a modern, type-safe, and responsive user experience.

## ✨ Key Features

- **🎬 Recording Playback**: Advanced video player with synchronized controls
- **👥 Real-time Collaboration**: Live commenting, synchronized playback, team management
- **🤖 AI Integration**: Smart suggestions, content analysis, and automated insights
- **🎨 Modern UI/UX**: Responsive design with Tailwind CSS and custom components
- **🔐 Secure Authentication**: JWT-based auth with Supabase integration
- **📱 Responsive Design**: Mobile-first approach with cross-device compatibility
- **⚡ Performance**: Optimized with Next.js App Router and static generation
- **🌐 Real-time Updates**: Socket.IO integration for live collaboration

## 🛠 Tech Stack

```
Next.js 14.2.15      - React framework with App Router
TypeScript 5.0+      - Type-safe development
Tailwind CSS 4       - Utility-first CSS framework
React 18.3.1         - UI library with latest features
Zustand 5.0.9        - Lightweight state management
Socket.IO Client     - Real-time communication
React Hot Toast      - Elegant notifications
Supabase Client      - Database and auth integration
```

## 🏗 Architecture

### **Directory Structure**
```
app/                          # Next.js App Router pages
├── 📁 dashboard/            # Dashboard pages and layouts
│   ├── page.tsx             # Main dashboard
│   ├── analytics/           # Analytics page
│   ├── projects/            # Project management
│   └── team/                # Team collaboration
├── 📁 login/                # Authentication pages
├── 📁 register/             # User registration
├── 📁 recording/            # Recording playback
│   └── [sessionId]/         # Dynamic recording pages
├── layout.tsx               # Root layout component
├── page.tsx                 # Home page
└── globals.css              # Global styles

components/                   # Reusable UI components
├── AuthModal.tsx            # Authentication modal
├── CollaborationPanel.tsx   # Real-time collaboration UI
├── SyncedVideoPlayer.tsx    # Synchronized video player
├── Timeline.tsx             # Video timeline component
├── TranscriptPanel.tsx      # Transcript display
├── AIReviewPanel.tsx        # AI insights panel
├── DashboardLayout.tsx      # Dashboard wrapper
└── ...                      # Other components

hooks/                       # Custom React hooks
├── useWebSocketConnection.ts # WebSocket management
└── ...                      # Other custom hooks

lib/                         # Utilities and stores
├── auth-store.ts            # Authentication state management
├── collaboration-store.ts   # Collaboration state
├── projects-store.ts        # Project management state
├── socket.ts                # Socket.IO client setup
├── supabase.ts              # Supabase client configuration
└── demo-data.ts             # Demo/mock data
```

### **Component Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Pages       │───▶│   Components    │───▶│     Hooks       │
│  (App Router)   │    │   (UI Logic)    │    │ (State & Logic) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Layouts      │    │     Stores      │    │   External APIs │
│  (Structure)    │    │   (Zustand)     │    │ (Backend, AI)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Running Clueso Backend API
- Environment variables configured

### **Installation**
```bash
# Navigate to frontend directory
cd clueso-frontend

# Install dependencies
npm install

# Environment setup
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
# Frontend runs on http://localhost:3001
```

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## ⚙️ Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Feature Flags
NEXT_PUBLIC_ALLOW_EXTENSION_ACCESS=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Development
NEXT_PUBLIC_DEBUG_MODE=false
```

## 🎨 UI Components

### **Core Components**

#### **SyncedVideoPlayer**
```typescript
// Synchronized video player with real-time collaboration
<SyncedVideoPlayer
  sessionId="session_123"
  videoUrl="/recordings/video.webm"
  onTimeUpdate={(time) => handleTimeUpdate(time)}
  isController={userRole === 'admin'}
/>
```

#### **CollaborationPanel**
```typescript
// Real-time collaboration interface
<CollaborationPanel
  sessionId="session_123"
  participants={participants}
  comments={comments}
  onAddComment={(comment) => handleAddComment(comment)}
/>
```

#### **Timeline**
```typescript
// Interactive video timeline with events
<Timeline
  duration={videoDuration}
  currentTime={currentTime}
  events={timelineEvents}
  onSeek={(time) => handleSeek(time)}
/>
```

### **Layout Components**

#### **DashboardLayout**
```typescript
// Main dashboard wrapper with navigation
<DashboardLayout>
  <YourPageContent />
</DashboardLayout>
```

## 🔄 State Management

### **Zustand Stores**

#### **Authentication Store**
```typescript
// lib/auth-store.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}
```

#### **Collaboration Store**
```typescript
// lib/collaboration-store.ts
interface CollaborationState {
  currentSession: Session | null;
  participants: Participant[];
  comments: Comment[];
  isConnected: boolean;
  joinSession: (sessionId: string) => void;
  addComment: (comment: CommentData) => void;
}
```

#### **Projects Store**
```typescript
// lib/projects-store.ts
interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  createProject: (projectData: CreateProjectData) => Promise<void>;
}
```

## 🔌 WebSocket Integration

### **Connection Management**
```typescript
// hooks/useWebSocketConnection.ts
const useWebSocketConnection = (sessionId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('authenticate', { token: getAuthToken() });
    });

    newSocket.on('playback_control', (data) => {
      // Handle synchronized playback
    });

    return () => newSocket.close();
  }, [sessionId]);

  return { socket, isConnected };
};
```

### **Real-time Events**
```typescript
// Real-time collaboration events
socket.on('user_joined', (user) => {
  addParticipant(user);
  showNotification(`${user.username} joined the session`);
});

socket.on('new_comment', (comment) => {
  addComment(comment);
  updateTimeline(comment.timestamp);
});

socket.on('ai_suggestions', (suggestions) => {
  updateAISuggestions(suggestions);
});
```

## 📱 Responsive Design

### **Breakpoint System**
```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### **Mobile-First Approach**
```typescript
// Responsive component example
<div className="
  flex flex-col          // Mobile: stack vertically
  md:flex-row           // Tablet+: horizontal layout
  lg:gap-6              // Large screens: more spacing
  xl:max-w-7xl          // Extra large: max width
">
  <VideoPlayer className="w-full md:w-2/3" />
  <CollaborationPanel className="w-full md:w-1/3" />
</div>
```

## 🎯 Key Features Implementation

### **Authentication Flow**
```typescript
// Login process
const handleLogin = async (credentials: LoginCredentials) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const { token, user } = await response.json();
    
    // Store in auth store
    setAuthData({ token, user });
    
    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    showError('Login failed');
  }
};
```

### **Real-time Collaboration**
```typescript
// Synchronized video playback
const handlePlaybackControl = (action: PlaybackAction) => {
  if (!isController) {
    showError('You do not have playback control');
    return;
  }

  socket.emit('playback_control', {
    action,
    currentTime: videoRef.current?.currentTime,
    sessionId
  });
};
```

### **AI Integration**
```typescript
// AI suggestions display
const AIReviewPanel = ({ sessionId }: { sessionId: string }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    socket.on('ai_suggestions', (newSuggestions) => {
      setSuggestions(newSuggestions);
    });
  }, []);

  return (
    <div className="ai-panel">
      {suggestions.map(suggestion => (
        <SuggestionCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
};
```

## 🔒 Security & Performance

### **Authentication**
- JWT token storage in secure HTTP-only cookies
- Automatic token refresh handling
- Protected routes with authentication guards
- Role-based component rendering

### **Performance Optimizations**
- Next.js App Router with static generation
- Component lazy loading with React.lazy()
- Image optimization with Next.js Image component
- Bundle splitting and code optimization
- WebSocket connection pooling

### **Error Handling**
```typescript
// Global error boundary
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error) => {
        console.error('Application error:', error);
        // Send to error reporting service
      }}
    >
      {children}
    </ErrorBoundaryComponent>
  );
};
```

## 🧪 Testing & Development

### **Development Tools**
```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build verification
npm run build
```

### **Browser Extension Integration**
The frontend is designed to work seamlessly with the Clueso browser extension:
- Cross-origin communication handling
- Extension detection and setup
- Secure message passing
- Recording session initialization

## 🚀 Deployment

### **Production Build**
```bash
# Create optimized production build
npm run build

# Start production server
npm start
```

### **Netlify Deployment**
```bash
# Build settings
Build command: npm run build
Publish directory: .next

# Environment variables (set in Netlify dashboard)
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### **Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🎨 Styling & Theming

### **Design System**
```css
/* Design tokens in globals.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}
```

### **Component Styling**
```typescript
// Consistent component styling with Tailwind
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

## 🤝 Contributing

### **Development Guidelines**
1. Use TypeScript for all new components
2. Follow the established component structure
3. Add proper error boundaries
4. Implement responsive design
5. Add loading states and error handling
6. Write meaningful commit messages

### **Component Creation**
```typescript
// Component template
interface ComponentProps {
  // Define props with TypeScript
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    <div className="component-wrapper">
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

## 📞 Support

- **Development**: Hot reload and error overlay
- **Debugging**: React DevTools and browser debugging
- **Performance**: Next.js built-in performance monitoring
- **Documentation**: Comprehensive component documentation

---

**Built with ❤️ using Next.js and modern React patterns**