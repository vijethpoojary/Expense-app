const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token from HTTP-only cookie and attaches user to request
 * 
 * Security: Never trust userId from frontend - always get from verified JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie (set by login)
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required. Please login.' 
      });
    }
    
    try {
      // Verify token
      const decoded = verifyToken(token);
      
      // Get user from database (verify user still exists)
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        // Token valid but user doesn't exist (user was deleted)
        return res.status(401).json({ 
          message: 'User not found. Please login again.' 
        });
      }
      
      // Attach user to request object
      // SECURITY: Always use req.user.id from verified token, never from frontend
      req.user = {
        id: user._id.toString(),
        email: user.email
      };
      
      next();
    } catch (error) {
      // Token verification failed (expired, invalid, etc.)
      return res.status(401).json({ 
        message: 'Invalid or expired token. Please login again.' 
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};

