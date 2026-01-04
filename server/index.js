const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (public)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (public)
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes (require authentication)
const { authenticate } = require('./middleware/auth');
app.use('/api/expenses', authenticate, require('./routes/expenseRoutes'));
app.use('/api/salary', authenticate, require('./routes/salaryRoutes'));
app.use('/api/investments', authenticate, require('./routes/investmentRoutes'));
app.use('/api/analytics', authenticate, require('./routes/analyticsRoutes'));
app.use('/api/rooms', authenticate, require('./routes/roomRoutes'));
app.use('/api/room-expenses', authenticate, require('./routes/roomExpenseRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

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

