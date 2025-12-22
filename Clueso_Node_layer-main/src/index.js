const express = require('express');
const http = require('http');
const cors = require('cors'); // Import the cors middleware

const { ServerConfig, Logger } = require('./config');
const { initializeDatabase } = require('./config/database');
const apiRoutes = require('./routes');
const recordingRoutes = require('./routes/v1/recording-routes');
const pythonRoutes = require('./routes/v1/python-routes'); // Add python routes
const authRoutes = require('./routes/v1/auth-routes'); // Add auth routes
const { FrontendService } = require('./services');

const app = express();
const httpServer = http.createServer(app);

// Security headers for production use
app.use((req, res, next) => {
    // Allow browser extensions
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Security headers
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Initialize database first
const startServer = async () => {
    try {
        // Initialize database
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            Logger.error('Failed to initialize database');
            process.exit(1);
        }

        // Initialize Socket.IO for frontend communication
        FrontendService.initialize(httpServer);

// Enable CORS for all routes and origins with proper extension support
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'chrome-extension://*',
        'moz-extension://*',
        '*' // Allow all origins for browser extension compatibility
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Body parsers - MUST come before most routes (except recording routes that handle raw binary data)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory (for audio files)
app.use('/uploads', express.static('uploads'));

// Serve static files from recordings directory (for processed audio from Python)
app.use('/recordings', express.static('recordings'));

// Serve static files from src/recordings directory (for raw video/audio files)
app.use('/recordings', express.static('src/recordings'));

// Serve processed videos and thumbnails
app.use('/processed', express.static('processed'));

// IMPORTANT: Recording routes handle raw binary data, so they need special handling
app.use('/api/recording', recordingRoutes);

// Python AI processing routes
app.use('/api/python', pythonRoutes);

// Authentication routes - now req.body will be available
app.use('/api/auth', authRoutes);

// Project management routes
const projectRoutes = require('./routes/v1/project-routes');
app.use('/api/projects', projectRoutes);

// Video processing routes
const videoRoutes = require('./routes/v1/video-routes');
app.use('/api/videos', videoRoutes);

// Collaboration routes
const collaborationRoutes = require('./routes/v1/collaboration-routes');
app.use('/api/collaboration', collaborationRoutes);

// All other API routes
app.use('/api', apiRoutes);

httpServer.listen(ServerConfig.PORT, () => {
    console.log(`Successfully started server on PORT ${ServerConfig.PORT}`);
    Logger.info("Server started");
    Logger.info("Socket.IO server ready for frontend connections");
});

    } catch (error) {
        Logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
startServer();