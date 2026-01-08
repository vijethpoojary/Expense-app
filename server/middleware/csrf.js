const Tokens = require('csrf');

// Create CSRF token instance
const tokens = new Tokens();

/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing requests
 * 
 * Security: Protects against Cross-Site Request Forgery attacks
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for safe HTTP methods (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth routes (login/register handle their own security)
  if (req.path.startsWith('/api/auth')) {
    return next();
  }

  try {
    // Get secret from cookie or generate new one
    let secret = req.cookies?.csrfSecret;
    
    if (!secret) {
      // Generate new secret for first-time user
      secret = tokens.secretSync();
      // Set secret in cookie (httpOnly: false so we can verify, but secure)
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrfSecret', secret, {
        httpOnly: false, // Need to read for validation
        secure: isProduction, // HTTPS only in production
        sameSite: isProduction ? 'none' : 'lax', // Cross-domain support in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
    }

    // Get CSRF token from header (client sends this)
    const token = req.headers['x-csrf-token'] || req.body._csrf;

    if (!token) {
      return res.status(403).json({
        message: 'CSRF token missing. Please refresh the page and try again.'
      });
    }

    // Verify token
    if (!tokens.verify(secret, token)) {
      return res.status(403).json({
        message: 'Invalid CSRF token. Please refresh the page and try again.'
      });
    }

    // Token is valid, proceed
    next();
  } catch (error) {
    return res.status(403).json({
      message: 'CSRF validation failed. Please refresh the page and try again.'
    });
  }
};

/**
 * Generate CSRF token endpoint
 * Client calls this to get a CSRF token
 */
const generateCsrfToken = (req, res) => {
  try {
    // Get or create secret
    let secret = req.cookies?.csrfSecret;
    
    if (!secret) {
      secret = tokens.secretSync();
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('csrfSecret', secret, {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax', // Cross-domain support in production
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
      });
    }

    // Generate token
    const token = tokens.create(secret);

    res.json({ csrfToken: token });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to generate CSRF token'
    });
  }
};

module.exports = {
  csrfProtection,
  generateCsrfToken
};

