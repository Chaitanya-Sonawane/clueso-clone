# Clueso System Architecture & Collaboration Flowcharts

## 🏗️ System Overview Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js - Port 3001)"
        UI[User Interface]
        Auth[Authentication Modal]
        Dashboard[Dashboard]
        VideoPlayer[Video Player]
        Collab[Collaboration Panel]
        Timeline[Timeline Component]
        Transcript[Transcript Panel]
    end

    subgraph "Backend (Node.js - Port 3000)"
        API[REST API Server]
        WS[WebSocket Server]
        Auth_API[Auth Controller]
        Project_API[Project Controller]
        Recording_API[Recording Controller]
        Collab_API[Collaboration Controller]
        FS[Frontend Service]
    end

    subgraph "Database Layer"
        SQLite[(SQLite Database)]
        Supabase[(Supabase)]
    end

    subgraph "AI Services (Python - Port 8000)"
        AI_Service[AI Processing Service]
        Deepgram[Deepgram API]
        OpenAI[OpenAI/Gemini API]
    end

    subgraph "File Storage"
        Uploads[/uploads/]
        Recordings[/recordings/]
        Processed[/processed/]
    end

    subgraph "Browser Extension"
        Extension[Clueso Extension]
        ScreenCapture[Screen Capture API]
    end

    %% Frontend to Backend Connections
    UI --> API
    Auth --> Auth_API
    Dashboard --> Project_API
    VideoPlayer --> Recording_API
    Collab --> Collab_API
    UI -.->|WebSocket| WS

    %% Backend Internal Connections
    API --> SQLite
    API --> Supabase
    WS --> FS
    FS -.->|Events| UI

    %% Backend to AI Services
    Recording_API --> AI_Service
    Collab_API --> AI_Service
    AI_Service --> Deepgram
    AI_Service --> OpenAI

    %% File Storage Connections
    Recording_API --> Uploads
    AI_Service --> Recordings
    AI_Service --> Processed
    VideoPlayer --> Recordings

    %% Extension Integration
    Extension --> ScreenCapture
    Extension -.->|Upload Chunks| Recording_API
    Extension -.->|WebSocket| WS

    %% Styling
    classDef frontend fill:#e1f5fe
    classDef backend fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef ai fill:#fff3e0
    classDef storage fill:#fce4ec
    classDef extension fill:#f1f8e9

    class UI,Auth,Dashboard,VideoPlayer,Collab,Timeline,Transcript frontend
    class API,WS,Auth_API,Project_API,Recording_API,Collab_API,FS backend
    class SQLite,Supabase database
    class AI_Service,Deepgram,OpenAI ai
    class Uploads,Recordings,Processed storage
    class Extension,ScreenCapture extension
```

## 🤝 Collaboration Workflow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ Frontend
    participant Backend as ⚙️ Backend API
    participant WebSocket as 🔌 WebSocket
    participant AI as 🤖 AI Service
    participant DB as 🗄️ Database

    Note over User,DB: User Authentication & Session Setup
    User->>Frontend: Login/Register
    Frontend->>Backend: POST /api/auth/login
    Backend->>DB: Validate credentials
    DB-->>Backend: User data + JWT token
    Backend-->>Frontend: Authentication response
    Frontend->>WebSocket: Connect & register session
    WebSocket-->>Frontend: Connection confirmed

    Note over User,DB: Project & Recording Management
    User->>Frontend: Create new project
    Frontend->>Backend: POST /api/projects
    Backend->>DB: Store project data
    DB-->>Backend: Project created
    Backend-->>Frontend: Project response
    
    User->>Frontend: Start recording session
    Frontend->>Backend: POST /api/projects/:id/recordings/start
    Backend->>DB: Create recording session
    Backend-->>Frontend: Session ID
    Frontend->>WebSocket: Register for session updates

    Note over User,DB: Real-time Collaboration Features
    User->>Frontend: Add comment at timestamp
    Frontend->>Backend: POST /api/collaboration/demos/:id/comments
    Backend->>DB: Store comment
    Backend->>WebSocket: Emit 'new_comment' event
    WebSocket-->>Frontend: Broadcast to all connected clients
    Frontend-->>User: Update UI with new comment

    User->>Frontend: Request AI suggestions
    Frontend->>Backend: POST /api/collaboration/demos/:id/ai-suggestions
    Backend->>AI: Process video/audio for suggestions
    AI-->>Backend: AI suggestions response
    Backend->>DB: Store AI suggestions
    Backend->>WebSocket: Emit 'ai_suggestions' event
    WebSocket-->>Frontend: Real-time AI suggestions
    Frontend-->>User: Display AI suggestions

    User->>Frontend: Add new language support
    Frontend->>Backend: POST /api/collaboration/demos/:id/languages
    Backend->>AI: Generate translations
    AI-->>Backend: Translated content
    Backend->>DB: Store language data
    Backend->>WebSocket: Emit 'language_added' event
    WebSocket-->>Frontend: Update language options
    Frontend-->>User: New language available

    User->>Frontend: Resolve comment
    Frontend->>Backend: PATCH /api/collaboration/comments/:id/resolve
    Backend->>DB: Update comment status
    Backend->>WebSocket: Emit 'comment_resolved' event
    WebSocket-->>Frontend: Update comment status
    Frontend-->>User: Comment marked as resolved
```

## 🎥 Video Recording & Processing Flow

```mermaid
flowchart TD
    Start([User Starts Recording]) --> Extension{Browser Extension Installed?}
    
    Extension -->|Yes| Capture[Screen Capture API]
    Extension -->|No| Manual[Manual File Upload]
    
    Capture --> Chunks[Split into Chunks<br/>Video + Audio]
    Manual --> Upload[Direct File Upload]
    
    Chunks --> ChunkUpload[Upload Chunks via API<br/>POST /api/recording/video-chunk<br/>POST /api/recording/audio-chunk]
    Upload --> ProcessUpload[Process Complete File<br/>POST /api/recording/process-recording]
    
    ChunkUpload --> Backend[Backend Receives Chunks]
    ProcessUpload --> Backend
    
    Backend --> SaveChunks[Save to /uploads Directory]
    SaveChunks --> WebSocketNotify[WebSocket: processing_status]
    
    WebSocketNotify --> AIProcess{AI Processing Available?}
    
    AIProcess -->|Yes| SendToAI[Send to Python AI Service]
    AIProcess -->|No| DirectProcess[Direct Processing]
    
    SendToAI --> AIAnalysis[AI Analysis:<br/>- Speech Recognition<br/>- Event Detection<br/>- Instruction Generation]
    
    AIAnalysis --> AIResponse[AI Returns:<br/>- Transcript<br/>- Instructions<br/>- Metadata]
    
    AIResponse --> SaveProcessed[Save to /recordings Directory]
    DirectProcess --> SaveProcessed
    
    SaveProcessed --> WebSocketUpdate[WebSocket Events:<br/>- video<br/>- audio<br/>- instructions<br/>- processing_complete]
    
    WebSocketUpdate --> FrontendUpdate[Frontend Receives Real-time Updates]
    
    FrontendUpdate --> VideoPlayer[Video Player Displays:<br/>- Video with Timeline<br/>- Audio with Transcript<br/>- Interactive Instructions<br/>- Event Overlay]
    
    VideoPlayer --> CollabFeatures[Collaboration Features Available:<br/>- Comments<br/>- AI Suggestions<br/>- Language Support<br/>- Export Options]
    
    CollabFeatures --> End([Complete Recording Session])

    %% Styling
    classDef startEnd fill:#4caf50,stroke:#2e7d32,color:#fff
    classDef process fill:#2196f3,stroke:#1565c0,color:#fff
    classDef decision fill:#ff9800,stroke:#ef6c00,color:#fff
    classDef ai fill:#9c27b0,stroke:#6a1b9a,color:#fff
    classDef websocket fill:#00bcd4,stroke:#00838f,color:#fff
    classDef frontend fill:#e91e63,stroke:#ad1457,color:#fff

    class Start,End startEnd
    class Capture,Chunks,ChunkUpload,Backend,SaveChunks,SaveProcessed process
    class Extension,AIProcess decision
    class SendToAI,AIAnalysis,AIResponse ai
    class WebSocketNotify,WebSocketUpdate websocket
    class FrontendUpdate,VideoPlayer,CollabFeatures frontend
```

## 🔄 Real-time Collaboration Data Flow

```mermaid
graph LR
    subgraph "User Actions"
        A1[Add Comment]
        A2[Request AI Review]
        A3[Add Language]
        A4[Resolve Comment]
        A5[Generate Suggestions]
    end

    subgraph "Frontend Layer"
        F1[Collaboration Panel]
        F2[WebSocket Hook]
        F3[Collaboration Store]
        F4[UI Components]
    end

    subgraph "Backend Layer"
        B1[Collaboration API]
        B2[WebSocket Server]
        B3[Frontend Service]
        B4[Database Operations]
    end

    subgraph "AI Processing"
        AI1[AI Service]
        AI2[Language Translation]
        AI3[Content Analysis]
        AI4[Suggestion Generation]
    end

    subgraph "Database"
        DB1[(Comments)]
        DB2[(Languages)]
        DB3[(AI Reviews)]
        DB4[(Suggestions)]
    end

    subgraph "Real-time Updates"
        RT1[new_comment]
        RT2[ai_suggestions]
        RT3[language_added]
        RT4[comment_resolved]
        RT5[ai_review_generated]
    end

    %% User Actions to Frontend
    A1 --> F1
    A2 --> F1
    A3 --> F1
    A4 --> F1
    A5 --> F1

    %% Frontend Internal Flow
    F1 --> F3
    F3 --> F2
    F2 --> F4

    %% Frontend to Backend
    F3 --> B1
    F2 -.->|WebSocket| B2

    %% Backend Processing
    B1 --> B4
    B1 --> AI1
    B4 --> DB1
    B4 --> DB2
    B4 --> DB3
    B4 --> DB4

    %% AI Processing
    AI1 --> AI2
    AI1 --> AI3
    AI1 --> AI4

    %% Backend to WebSocket
    B1 --> B3
    B3 --> B2
    AI1 --> B3

    %% WebSocket Events
    B2 --> RT1
    B2 --> RT2
    B2 --> RT3
    B2 --> RT4
    B2 --> RT5

    %% Real-time Updates to Frontend
    RT1 -.-> F2
    RT2 -.-> F2
    RT3 -.-> F2
    RT4 -.-> F2
    RT5 -.-> F2

    %% Frontend Updates UI
    F2 --> F3
    F3 --> F4

    %% Styling
    classDef userAction fill:#4caf50
    classDef frontend fill:#2196f3
    classDef backend fill:#ff9800
    classDef ai fill:#9c27b0
    classDef database fill:#607d8b
    classDef realtime fill:#e91e63

    class A1,A2,A3,A4,A5 userAction
    class F1,F2,F3,F4 frontend
    class B1,B2,B3,B4 backend
    class AI1,AI2,AI3,AI4 ai
    class DB1,DB2,DB3,DB4 database
    class RT1,RT2,RT3,RT4,RT5 realtime
```

## 🔐 Authentication & Security Flow

```mermaid
sequenceDiagram
    participant Browser as 🌐 Browser
    participant Frontend as 🖥️ Frontend
    participant AuthStore as 📦 Auth Store
    participant Backend as ⚙️ Backend
    participant JWT as 🔑 JWT Service
    participant Database as 🗄️ Database

    Note over Browser,Database: User Registration Flow
    Browser->>Frontend: Fill registration form
    Frontend->>Backend: POST /api/auth/register
    Backend->>Database: Check if user exists
    alt User doesn't exist
        Backend->>Database: Create new user (hashed password)
        Backend->>JWT: Generate JWT token
        JWT-->>Backend: Return signed token
        Backend-->>Frontend: {success: true, user, token}
        Frontend->>AuthStore: Store user & token
        AuthStore->>Browser: Update localStorage
        Frontend-->>Browser: Redirect to dashboard
    else User exists
        Backend-->>Frontend: {success: false, message: "User exists"}
        Frontend-->>Browser: Show error message
    end

    Note over Browser,Database: User Login Flow
    Browser->>Frontend: Fill login form
    Frontend->>Backend: POST /api/auth/login
    Backend->>Database: Find user by email
    Backend->>Backend: Compare password hash
    alt Valid credentials
        Backend->>JWT: Generate JWT token
        JWT-->>Backend: Return signed token
        Backend-->>Frontend: {success: true, user, token}
        Frontend->>AuthStore: Store user & token
        AuthStore->>Browser: Update localStorage
        Frontend-->>Browser: Redirect to dashboard
    else Invalid credentials
        Backend-->>Frontend: {success: false, message: "Invalid credentials"}
        Frontend-->>Browser: Show error message
    end

    Note over Browser,Database: Protected API Calls
    Browser->>Frontend: Access protected feature
    Frontend->>AuthStore: Get stored token
    AuthStore-->>Frontend: Return JWT token
    Frontend->>Backend: API call with Authorization header
    Backend->>JWT: Verify token signature
    alt Valid token
        JWT-->>Backend: Token valid, return user data
        Backend->>Database: Execute requested operation
        Database-->>Backend: Return data
        Backend-->>Frontend: {success: true, data}
        Frontend-->>Browser: Display data
    else Invalid/Expired token
        JWT-->>Backend: Token invalid
        Backend-->>Frontend: {success: false, message: "Unauthorized"}
        Frontend->>AuthStore: Clear stored auth data
        Frontend-->>Browser: Redirect to login
    end

    Note over Browser,Database: Auto-logout on Token Expiry
    Frontend->>Frontend: Check token expiry (7 days)
    alt Token expired
        Frontend->>AuthStore: Clear auth data
        AuthStore->>Browser: Clear localStorage
        Frontend-->>Browser: Redirect to login
    end
```

## 🎛️ State Management Architecture

```mermaid
graph TB
    subgraph "Zustand Stores"
        AuthStore[Auth Store<br/>- user<br/>- token<br/>- isAuthenticated<br/>- login/logout]
        ProjectStore[Projects Store<br/>- projects[]<br/>- currentProject<br/>- CRUD operations]
        CollabStore[Collaboration Store<br/>- comments[]<br/>- languages[]<br/>- aiSuggestions[]<br/>- aiReview]
    end

    subgraph "React Components"
        AuthModal[Auth Modal]
        Dashboard[Dashboard]
        VideoPlayer[Video Player]
        CollabPanel[Collaboration Panel]
        Timeline[Timeline]
        Transcript[Transcript Panel]
    end

    subgraph "Custom Hooks"
        WebSocketHook[useWebSocketConnection<br/>- connectionState<br/>- videoData<br/>- audioData<br/>- instructions]
    end

    subgraph "API Services"
        AuthAPI[authAPI]
        ProjectsAPI[projectsAPI]
        CollabAPI[collaborationAPI]
        RecordingAPI[recordingAPI]
    end

    subgraph "Backend APIs"
        AuthEndpoints[/api/auth/*]
        ProjectEndpoints[/api/projects/*]
        CollabEndpoints[/api/collaboration/*]
        RecordingEndpoints[/api/recording/*]
    end

    subgraph "WebSocket Events"
        WSEvents[Socket Events<br/>- video<br/>- audio<br/>- instructions<br/>- new_comment<br/>- ai_suggestions]
    end

    subgraph "Persistent Storage"
        LocalStorage[localStorage<br/>- Auth data<br/>- Session cache]
        SessionStorage[sessionStorage<br/>- Temporary data]
    end

    %% Component to Store connections
    AuthModal --> AuthStore
    Dashboard --> ProjectStore
    CollabPanel --> CollabStore
    VideoPlayer --> WebSocketHook
    Timeline --> WebSocketHook
    Transcript --> WebSocketHook

    %% Store to API connections
    AuthStore --> AuthAPI
    ProjectStore --> ProjectsAPI
    CollabStore --> CollabAPI

    %% API to Backend connections
    AuthAPI --> AuthEndpoints
    ProjectsAPI --> ProjectEndpoints
    CollabAPI --> CollabEndpoints
    WebSocketHook --> RecordingEndpoints

    %% WebSocket connections
    WebSocketHook -.-> WSEvents
    CollabStore -.-> WSEvents

    %% Persistent storage
    AuthStore --> LocalStorage
    WebSocketHook --> SessionStorage

    %% Styling
    classDef store fill:#e3f2fd
    classDef component fill:#f3e5f5
    classDef hook fill:#e8f5e8
    classDef api fill:#fff3e0
    classDef backend fill:#fce4ec
    classDef websocket fill:#f1f8e9
    classDef storage fill:#fff8e1

    class AuthStore,ProjectStore,CollabStore store
    class AuthModal,Dashboard,VideoPlayer,CollabPanel,Timeline,Transcript component
    class WebSocketHook hook
    class AuthAPI,ProjectsAPI,CollabAPI,RecordingAPI api
    class AuthEndpoints,ProjectEndpoints,CollabEndpoints,RecordingEndpoints backend
    class WSEvents websocket
    class LocalStorage,SessionStorage storage
```

## 🚀 Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Frontend (Vercel/Netlify)"
            NextJS[Next.js App<br/>Port 3000]
            StaticAssets[Static Assets<br/>CSS, JS, Images]
        end

        subgraph "Backend (AWS/DigitalOcean)"
            NodeAPI[Node.js API Server<br/>Port 3000]
            WebSocketServer[WebSocket Server<br/>Socket.IO]
            FileStorage[File Storage<br/>/uploads, /recordings]
        end

        subgraph "Database Layer"
            PrimaryDB[(PostgreSQL<br/>Primary Database)]
            CacheDB[(Redis<br/>Session Cache)]
            SupabaseDB[(Supabase<br/>Backup/Analytics)]
        end

        subgraph "AI Services"
            PythonAI[Python AI Service<br/>Port 8000]
            DeepgramAPI[Deepgram API<br/>Speech Recognition]
            OpenAIAPI[OpenAI/Gemini API<br/>AI Processing]
        end

        subgraph "CDN & Storage"
            CDN[CloudFront CDN<br/>Static Assets]
            S3[AWS S3<br/>File Storage]
            CloudStorage[Cloud Storage<br/>Video/Audio Files]
        end

        subgraph "Monitoring & Security"
            LoadBalancer[Load Balancer<br/>NGINX/AWS ALB]
            SSL[SSL Certificates<br/>Let's Encrypt]
            Monitoring[Monitoring<br/>DataDog/New Relic]
            Logs[Centralized Logging<br/>ELK Stack]
        end
    end

    subgraph "External Services"
        BrowserExt[Browser Extension<br/>Chrome Web Store]
        EmailService[Email Service<br/>SendGrid/AWS SES]
        Analytics[Analytics<br/>Google Analytics]
    end

    %% User connections
    Users[👥 Users] --> LoadBalancer
    LoadBalancer --> SSL
    SSL --> NextJS
    SSL --> NodeAPI

    %% Frontend connections
    NextJS --> CDN
    NextJS --> NodeAPI
    NextJS -.->|WebSocket| WebSocketServer

    %% Backend connections
    NodeAPI --> PrimaryDB
    NodeAPI --> CacheDB
    NodeAPI --> PythonAI
    WebSocketServer --> CacheDB

    %% AI service connections
    PythonAI --> DeepgramAPI
    PythonAI --> OpenAIAPI

    %% File storage
    NodeAPI --> S3
    FileStorage --> CloudStorage
    CDN --> S3

    %% External integrations
    BrowserExt -.-> NodeAPI
    NodeAPI --> EmailService
    NextJS --> Analytics

    %% Monitoring
    NodeAPI --> Monitoring
    NextJS --> Monitoring
    NodeAPI --> Logs
    NextJS --> Logs

    %% Styling
    classDef frontend fill:#e3f2fd
    classDef backend fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef ai fill:#fff3e0
    classDef storage fill:#fce4ec
    classDef security fill:#f1f8e9
    classDef external fill:#fff8e1

    class NextJS,StaticAssets frontend
    class NodeAPI,WebSocketServer,FileStorage backend
    class PrimaryDB,CacheDB,SupabaseDB database
    class PythonAI,DeepgramAPI,OpenAIAPI ai
    class CDN,S3,CloudStorage storage
    class LoadBalancer,SSL,Monitoring,Logs security
    class BrowserExt,EmailService,Analytics external
```

## 📊 Performance & Scalability Considerations

### Horizontal Scaling Strategy
```mermaid
graph LR
    subgraph "Load Distribution"
        LB[Load Balancer] --> API1[API Server 1]
        LB --> API2[API Server 2]
        LB --> API3[API Server 3]
    end

    subgraph "Database Scaling"
        Master[(Master DB<br/>Write Operations)]
        Replica1[(Replica 1<br/>Read Operations)]
        Replica2[(Replica 2<br/>Read Operations)]
        Master --> Replica1
        Master --> Replica2
    end

    subgraph "Caching Layer"
        Redis1[(Redis Cluster 1)]
        Redis2[(Redis Cluster 2)]
        Redis3[(Redis Cluster 3)]
    end

    subgraph "File Storage"
        S3Primary[S3 Primary Region]
        S3Backup[S3 Backup Region]
        CDN[CloudFront CDN]
        S3Primary --> S3Backup
        S3Primary --> CDN
    end

    API1 --> Master
    API2 --> Replica1
    API3 --> Replica2
    
    API1 --> Redis1
    API2 --> Redis2
    API3 --> Redis3
    
    API1 --> S3Primary
    API2 --> S3Primary
    API3 --> S3Primary
```

This comprehensive architecture documentation shows how all components work together to create a robust, scalable, and maintainable system for the Clueso platform.