const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/server-config');
const { supabaseAdmin } = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    // 🛡️ Safe string operations with validation
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.includes(' ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }
    
    const token = authHeader.split(' ')[1];

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    // 🛡️ Safe string operations with validation
    if (authHeader && typeof authHeader === 'string' && authHeader.includes(' ')) {
      const token = authHeader.split(' ')[1];

      if (token && typeof token === 'string') {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', decoded.userId)
          .single();
        
        if (user) {
          req.user = user;
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};