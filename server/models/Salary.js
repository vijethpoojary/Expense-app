const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required'],
    ref: 'User',
    index: true, // Index for efficient queries
    unique: true // One salary record per user
  },
  monthlySalary: {
    type: Number,
    required: [true, 'Monthly salary is required'],
    min: [0, 'Salary must be positive']
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Get current salary for a specific user
salarySchema.statics.getCurrentSalary = async function(userId) {
  if (!userId) {
    throw new Error('UserId is required');
  }
  
  let salary = await this.findOne({ userId }).sort({ effectiveFrom: -1 });
  if (!salary) {
    // Create default salary if none exists
    const now = new Date();
    salary = await this.create({ 
      userId,
      monthlySalary: 0, 
      effectiveFrom: now,
      startDate: now,
      lastResetDate: now
    });
  }
  return salary;
};

module.exports = mongoose.model('Salary', salarySchema);

