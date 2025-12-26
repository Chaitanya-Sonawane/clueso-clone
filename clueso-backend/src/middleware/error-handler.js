const { Logger } = require('../config');

// JSON parsing error handler
const jsonErrorHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        Logger.error('JSON parsing error:', err.message);
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON format',
            message: 'Request body contains invalid JSON'
        });
    }
    next(err);
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
    Logger.error('Unhandled error:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
        success: false,
        error: isDevelopment ? err.message : 'Internal server error',
        ...(isDevelopment && { stack: err.stack })
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
};

module.exports = {
    jsonErrorHandler,
    globalErrorHandler,
    notFoundHandler
};