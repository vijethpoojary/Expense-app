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
  }
}, {
  timestamps: true
});

// Ensure only one salary record exists
salarySchema.statics.getCurrentSalary = async function() {
  let salary = await this.findOne().sort({ effectiveFrom: -1 });
  if (!salary) {
    // Create default salary if none exists
    salary = await this.create({ monthlySalary: 0, effectiveFrom: new Date() });
  }
  return salary;
};

module.exports = mongoose.model('Salary', salarySchema);

