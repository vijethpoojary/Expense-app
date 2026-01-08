/**
 * Secure Error Handling Middleware
 * Prevents information disclosure by sanitizing error messages
 * and only exposing safe information to clients
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Sanitize error message to remove sensitive information
 */
const sanitizeErrorMessage = (message) => {
  if (!message) return 'An error occurred';
  
  // Remove file paths
  let sanitized = message.replace(/\/[^\s]+/g, '[path]');
  
  // Remove MongoDB connection strings
  sanitized = sanitized.replace(/mongodb[^\s]+/gi, '[connection]');
  
  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
  
  // Remove IP addresses
  sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]');
  
  // Remove potential tokens/secrets
  sanitized = sanitized.replace(/[A-Za-z0-9]{32,}/g, '[token]');
  
  return sanitized;
};

/**
 * Get safe error message for client
 */
const getSafeErrorMessage = (err) => {
  // Handle known error types with safe messages
  if (err.name === 'ValidationError') {
    return 'Validation failed. Please check your input.';
  }
  
  if (err.name === 'CastError') {
    return 'Invalid data format.';
  }
  
  if (err.name === 'MongoServerError') {
    // MongoDB errors - be very careful
    if (err.code === 11000) {
      return 'This record already exists.';
    }
    return 'Database operation failed.';
  }
  
  if (err.name === 'JsonWebTokenError') {
    return 'Invalid authentication token.';
  }
  
  if (err.name === 'TokenExpiredError') {
    return 'Authentication token has expired.';
  }
  
  if (err.status === 401) {
    return 'Authentication required.';
  }
  
  if (err.status === 403) {
    return 'Access denied.';
  }
  
  if (err.status === 404) {
    return 'Resource not found.';
  }
  
  if (err.status === 400) {
    return err.message || 'Invalid request.';
  }
  
  // For development, show sanitized message
  if (isDevelopment) {
    return sanitizeErrorMessage(err.message) || 'An error occurred';
  }
  
  // For production, use generic message
  return 'An internal error occurred. Please try again later.';
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log full error details server-side (for debugging)
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Determine status code
  const statusCode = err.status || err.statusCode || 500;
  
  // Prepare response
  const response = {
    message: getSafeErrorMessage(err),
    status: statusCode
  };
  
  // Only include additional details in development
  if (isDevelopment) {
    // Sanitize stack trace - remove file paths and sensitive info
    let sanitizedStack = null;
    if (err.stack) {
      sanitizedStack = err.stack
        .split('\n')
        .slice(0, 5) // Limit to first 5 lines
        .map(line => {
          // Remove full file paths, keep only filename
          return line.replace(/\/[^\s:]+/g, (match) => {
            const parts = match.split('/');
            return '/' + parts[parts.length - 1];
          })
          .replace(/mongodb[^\s]+/gi, '[connection]')
          .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
        })
        .join('\n');
    }
    
    response.error = {
      name: err.name,
      message: sanitizeErrorMessage(err.message),
      stack: sanitizedStack
    };
  }
  
  // Send response
  res.status(statusCode).json(response);
};

module.exports = errorHandler;

