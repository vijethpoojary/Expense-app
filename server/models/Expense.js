const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true // Index for efficient queries
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  sourceType: {
    type: String,
    enum: ['salary', 'other'],
    default: 'salary'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries with userId
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, sourceType: 1 });
expenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

