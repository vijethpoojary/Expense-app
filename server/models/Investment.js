const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
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

// Index for efficient queries
investmentSchema.index({ date: -1 });
investmentSchema.index({ investmentType: 1 });

module.exports = mongoose.model('Investment', investmentSchema);

