const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Existing Configuration
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    PYTHON_LAYER_URL: process.env.PYTHON_LAYER_URL || 'http://localhost:8000',
    PYTHON_SERVICE_TIMEOUT: parseInt(process.env.PYTHON_SERVICE_TIMEOUT || '30000', 10),
    
    // Supabase Configuration
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // AI Services
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    
    // Authentication
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    // File Storage
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || '100MB',
    
    // WebSocket
    WEBSOCKET_PORT: process.env.WEBSOCKET_PORT || 3001,
    
    // Email Configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    
    // Analytics
    ANALYTICS_ENABLED: process.env.ANALYTICS_ENABLED === 'true'
}