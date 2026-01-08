const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

// Security Headers with Helmet
// Configure Helmet for production with CORS compatibility
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for CORS compatibility
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resources
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://expense-app-omega-wine.vercel.app',
    'https://app.vijeth.fun'
  ],
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Limit request size

// Input sanitization middleware (must be after body parsing)
const { sanitizeQuery } = require('./middleware/sanitize');
app.use(sanitizeQuery);

// Health check route (public)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// CSRF token endpoint (public - needed before authentication)
const { generateCsrfToken } = require('./middleware/csrf');
app.get('/api/csrf-token', generateCsrfToken);

// Auth routes (public)
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes (require authentication + CSRF protection)
const { authenticate } = require('./middleware/auth');
const { csrfProtection } = require('./middleware/csrf');

// Apply CSRF protection to all state-changing routes
app.use('/api/expenses', authenticate, csrfProtection, require('./routes/expenseRoutes'));
app.use('/api/salary', authenticate, csrfProtection, require('./routes/salaryRoutes'));
app.use('/api/investments', authenticate, csrfProtection, require('./routes/investmentRoutes'));
app.use('/api/analytics', authenticate, csrfProtection, require('./routes/analyticsRoutes'));
app.use('/api/rooms', authenticate, csrfProtection, require('./routes/roomRoutes'));
app.use('/api/room-expenses', authenticate, csrfProtection, require('./routes/roomExpenseRoutes'));

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
});

// Error handling middleware (must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

