const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true // Index for efficient queries
  },
  investmentName: {
    type: String,
    required: [true, 'Investment name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  investmentType: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries with userId
investmentSchema.index({ userId: 1, date: -1 });
investmentSchema.index({ userId: 1, investmentType: 1 });

module.exports = mongoose.model('Investment', investmentSchema);

