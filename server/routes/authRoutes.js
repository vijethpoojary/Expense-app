const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Rate limiting for auth routes (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Custom password validation for strength requirements
const validatePassword = (value) => {
  if (!value) {
    throw new Error('Password is required');
  }
  
  // Minimum 8 characters
  if (value.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // At least one uppercase letter
  if (!/[A-Z]/.test(value)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  
  // At least one lowercase letter
  if (!/[a-z]/.test(value)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  
  // At least one number
  if (!/[0-9]/.test(value)) {
    throw new Error('Password must contain at least one number');
  }
  
  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    throw new Error('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }
  
  return true;
};

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .custom(validatePassword)
    .trim()
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;

