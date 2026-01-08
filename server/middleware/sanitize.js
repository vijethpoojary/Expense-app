const validator = require('validator');
const mongoose = require('mongoose');

/**
 * Input Sanitization Middleware
 * Sanitizes user inputs to prevent XSS and injection attacks
 */

/**
 * Sanitize string input - remove HTML tags and escape special characters
 */
const sanitizeString = (str, options = {}) => {
  if (!str || typeof str !== 'string') return str;
  
  // Remove null bytes
  let sanitized = str.replace(/\0/g, '');
  
  // Remove HTML tags
  sanitized = validator.stripLow(sanitized, true);
  
  // Escape HTML entities
  sanitized = validator.escape(sanitized);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length if specified
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }
  
  return sanitized;
};

/**
 * Sanitize MongoDB ObjectId
 */
const sanitizeObjectId = (id) => {
  if (!id) return null;
  
  // Convert to string
  const strId = String(id);
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(strId)) {
    return null;
  }
  
  return new mongoose.Types.ObjectId(strId);
};

/**
 * Sanitize number input
 */
const sanitizeNumber = (value, options = {}) => {
  if (value === null || value === undefined) return null;
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(num)) return null;
  
  // Apply min/max constraints
  if (options.min !== undefined && num < options.min) return options.min;
  if (options.max !== undefined && num > options.max) return options.max;
  
  return num;
};

/**
 * Sanitize date input
 */
const sanitizeDate = (date) => {
  if (!date) return null;
  
  const parsed = new Date(date);
  
  if (isNaN(parsed.getTime())) {
    return null;
  }
  
  return parsed;
};

/**
 * Sanitize email
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmed)) {
    return null;
  }
  
  return trimmed;
};

/**
 * Sanitize query parameters
 */
const sanitizeQuery = (req, res, next) => {
  // Sanitize all string query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Don't sanitize dates - they'll be validated separately
        if (key.includes('Date') || key === 'date') {
          return;
        }
        req.query[key] = sanitizeString(req.query[key], { maxLength: 500 });
      }
    });
  }
  
  // Sanitize all string body parameters
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      const value = req.body[key];
      
      if (typeof value === 'string') {
        // Don't sanitize passwords - they're hashed
        if (key === 'password') {
          return;
        }
        
        // Sanitize based on field type
        if (key === 'email') {
          req.body[key] = sanitizeEmail(value);
        } else if (key.includes('date') || key === 'date') {
          // Dates are handled separately
          return;
        } else {
          // Default string sanitization
          const maxLength = key.includes('description') || key.includes('name') ? 1000 : 500;
          req.body[key] = sanitizeString(value, { maxLength });
        }
      } else if (typeof value === 'number') {
        // Sanitize numbers
        req.body[key] = sanitizeNumber(value);
      }
    });
  }
  
  // Sanitize URL parameters (ObjectIds)
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (key === 'id' || key.includes('Id') || key === 'roomId' || key === 'expenseId' || key === 'memberId') {
        const sanitized = sanitizeObjectId(req.params[key]);
        if (sanitized === null && req.params[key]) {
          // Invalid ObjectId - will be caught by validation
          return;
        }
        req.params[key] = sanitized ? sanitized.toString() : req.params[key];
      } else if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key], { maxLength: 200 });
      }
    });
  }
  
  next();
};

/**
 * Sanitize MongoDB query to prevent injection
 */
const sanitizeMongoQuery = (query) => {
  if (!query || typeof query !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  Object.keys(query).forEach(key => {
    const value = query[key];
    
    // Skip MongoDB operators (they're safe when used correctly)
    if (key.startsWith('$')) {
      sanitized[key] = value;
      return;
    }
    
    // Sanitize based on value type
    if (typeof value === 'string') {
      // For ObjectId fields, validate ObjectId
      if (key === '_id' || key.endsWith('Id') || key === 'userId' || key === 'roomId') {
        if (mongoose.Types.ObjectId.isValid(value)) {
          sanitized[key] = new mongoose.Types.ObjectId(value);
        } else {
          // Invalid ObjectId - don't include in query
          return;
        }
      } else {
        // Regular string - sanitize
        sanitized[key] = sanitizeString(value, { maxLength: 500 });
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      // Numbers, booleans, etc. - pass through
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

module.exports = {
  sanitizeString,
  sanitizeObjectId,
  sanitizeNumber,
  sanitizeDate,
  sanitizeEmail,
  sanitizeQuery,
  sanitizeMongoQuery
};

