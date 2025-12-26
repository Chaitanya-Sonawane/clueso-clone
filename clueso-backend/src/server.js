/**
 * Clueso Backend Server
 * 
 * Main server entry point for the Clueso AI-powered screen recording
 * and collaboration platform.
 * 
 * Features:
 * - Express.js REST API
 * - Socket.IO real-time collaboration
 * - JWT authentication
 * - File upload handling
 * - AI service integration
 * - Database management with Sequelize
 * 
 * @author Clueso Team
 * @version 1.0.0
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

// Import core configurations and utilities
const { ServerConfig, Logger } = require('./config');
const { initializeDatabase } = require('./config/database');

// Import route handlers
const apiRoutes = require('./routes');
const recordingRoutes = require('./routes/v1/recording-routes');
const pythonRoutes = require('./routes/v1/python-routes');
const authRoutes = require('./routes/v1/auth-routes');

// Import services
const { FrontendService } = require('./services');

// Import middleware
const { jsonErrorHandler, globalErrorHandler, notFoundHandler } = require('./middleware/error-handler');

// Initialize Express application and HTTP server
const app = express();
const httpServer = http.createServer(app);

/**
 * Global Error Handling
 * Ensures the server continues running even with unexpected errors
 */
process.on('uncaughtException', (err) => {
    Logger.error('UNCAUGHT EXCEPTION - Server will continue running:', err);
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    Logger.error('UNHANDLED PROMISE REJECTION - Server will continue running:', reason);
    console.error('UNHANDLED PROMISE REJECTION at:', promise, 'reason:', reason);
});

/**
 * Security and CORS Configuration
 * Configures headers for cross-origin requests and security
 */
app.use((req, res, next) => {
    // CORS headers for cross-origin requests
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

/**
 * Application Startup
 * Initializes database, services, and starts the HTTP server
 */
const startServer = async () => {
    try {
        // Initialize database connection and models
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            Logger.error('Failed to initialize database');
            process.exit(1);
        }

        // Initialize WebSocket service for real-time collaboration
        FrontendService.initialize(httpServer);

        /**
         * Middleware Configuration
         */
        
        // CORS middleware with comprehensive origin support
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

        // Body parsing middleware with enhanced error handling
        app.use(express.json({ 
            limit: "50mb",
            verify: (req, res, buf) => {
                try {
                    JSON.parse(buf);
                } catch (e) {
                    res.status(400).json({
                        success: false,
                        error: 'Invalid JSON',
                        message: 'Request body contains invalid JSON'
                    });
                    return;
                }
            }
        }));
        app.use(express.urlencoded({ extended: true, limit: "50mb" }));

        // JSON parsing error handler
        app.use(jsonErrorHandler);

        /**
         * Static File Serving
         */
        
        // Serve uploaded files (audio/video recordings)
        app.use('/uploads', express.static('uploads'));
        
        // Serve processed recordings
        app.use('/recordings', express.static(path.join(__dirname, '..', 'recordings')));
        
        // Legacy support for existing files
        app.use('/recordings', express.static(path.join(__dirname, 'recordings')));
        
        // Serve processed videos and thumbnails
        app.use('/processed', express.static('processed'));

        /**
         * Demo and Testing Routes
         */
        
        // Serve collaboration demo page
        app.get('/demo', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'demo-collaboration.html'));
        });

        /**
         * API Route Configuration
         * Routes are organized by feature and version
         */
        
        // Recording routes (handle raw binary data with special processing)
        app.use('/api/recording', recordingRoutes);

        // AI processing routes
        app.use('/api/python', pythonRoutes);

        // Authentication routes
        app.use('/api/auth', authRoutes);

        // Project management routes
        const projectRoutes = require('./routes/v1/project-routes');
        app.use('/api/projects', projectRoutes);

        // Session management routes (WebSocket fallback)
        const sessionRoutes = require('./routes/v1/session-routes');
        app.use('/api/session', sessionRoutes);

        // Video processing routes
        const videoRoutes = require('./routes/v1/video-routes');
        app.use('/api/videos', videoRoutes);

        // Collaboration routes
        const collaborationRoutes = require('./routes/v1/collaboration-routes');
        app.use('/api/collaboration', collaborationRoutes);

        // Testing and debugging routes
        const testRoutes = require('./routes/v1/test-routes');
        app.use('/api/test', testRoutes);

        // General API routes
        app.use('/api', apiRoutes);

        /**
         * Error Handling Middleware
         */
        
        // 404 handler for unmatched routes
        app.use(notFoundHandler);

        // Global error handler
        app.use(globalErrorHandler);

        /**
         * Start HTTP Server
         */
        httpServer.listen(ServerConfig.PORT, () => {
            console.log(`🚀 Clueso Backend Server started successfully`);
            console.log(`📡 Server running on PORT ${ServerConfig.PORT}`);
            console.log(`🌐 API available at http://localhost:${ServerConfig.PORT}/api`);
            console.log(`🎮 Demo page at http://localhost:${ServerConfig.PORT}/demo`);
            
            Logger.info("✅ Server started successfully");
            Logger.info("🔌 Socket.IO server ready for real-time collaboration");
        });

    } catch (error) {
        Logger.error('❌ Failed to start server:', error);
        console.error('❌ Server startup failed:', error.message);
        process.exit(1);
    }
};

/**
 * Initialize the Clueso Backend Server
 */
startServer().catch((error) => {
    Logger.error('❌ Critical server error:', error);
    process.exit(1);
});