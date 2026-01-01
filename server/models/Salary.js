const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
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

// Ensure only one salary record exists
salarySchema.statics.getCurrentSalary = async function() {
  let salary = await this.findOne().sort({ effectiveFrom: -1 });
  if (!salary) {
    // Create default salary if none exists
    const now = new Date();
    salary = await this.create({ 
      monthlySalary: 0, 
      effectiveFrom: now,
      startDate: now,
      lastResetDate: now
    });
  }
  return salary;
};

module.exports = mongoose.model('Salary', salarySchema);

