const mongoose = require('mongoose');

const splitDetailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  shareAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['paid', 'pending'],
    default: 'pending'
  }
}, { _id: false });

const roomExpenseSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Room ID is required'],
    ref: 'Room',
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  totalAmount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  splitDetails: [splitDetailSchema],
  date: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
roomExpenseSchema.index({ roomId: 1, date: -1 });
roomExpenseSchema.index({ paidBy: 1 });
roomExpenseSchema.index({ 'splitDetails.userId': 1 });

module.exports = mongoose.model('RoomExpense', roomExpenseSchema);

