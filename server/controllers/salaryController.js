const Salary = require('../models/Salary');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Get current salary
exports.getSalary = async (req, res, next) => {
  try {
    const salary = await Salary.getCurrentSalary();
    res.json(salary);
  } catch (error) {
    next(error);
  }
};

// Update or create salary
exports.updateSalary = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { monthlySalary, effectiveFrom } = req.body;
    
    // Create new salary record
    const salary = await Salary.create({
      monthlySalary,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date()
    });

    res.json(salary);
  } catch (error) {
    next(error);
  }
};

// Get salary statistics
exports.getSalaryStats = async (req, res, next) => {
  try {
    const salary = await Salary.getCurrentSalary();
    const now = new Date();
    
    // Get start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get start of week (Monday)
    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfToday.getDay();
    const diff = startOfToday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate salary expenses (only sourceType = 'salary')
    const salaryExpensesToday = await Expense.aggregate([
      {
        $match: {
          sourceType: 'salary',
          date: { $gte: startOfToday }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const salaryExpensesThisWeek = await Expense.aggregate([
      {
        $match: {
          sourceType: 'salary',
          date: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const salaryExpensesThisMonth = await Expense.aggregate([
      {
        $match: {
          sourceType: 'salary',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const usedToday = salaryExpensesToday[0]?.total || 0;
    const usedThisWeek = salaryExpensesThisWeek[0]?.total || 0;
    const usedThisMonth = salaryExpensesThisMonth[0]?.total || 0;
    const remaining = Math.max(0, salary.monthlySalary - usedThisMonth);

    res.json({
      monthlySalary: salary.monthlySalary,
      remaining,
      usedToday,
      usedThisWeek,
      usedThisMonth
    });
  } catch (error) {
    next(error);
  }
};

