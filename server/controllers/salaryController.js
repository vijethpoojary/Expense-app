const Salary = require('../models/Salary');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Helper function to calculate week period (Sunday to Saturday)
const getCurrentWeekPeriod = (currentDate) => {
  const current = new Date(currentDate);
  current.setHours(0, 0, 0, 0);
  
  // Get the day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = current.getDay();
  
  // Calculate days to subtract to get to Sunday (start of week)
  const daysToSubtract = dayOfWeek;
  
  const weekStart = new Date(current);
  weekStart.setDate(current.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

// Helper function to calculate month period (first day to last day of calendar month)
const getCurrentMonthPeriod = (currentDate) => {
  const current = new Date(currentDate);
  
  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  
  const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);
  
  return { monthStart, monthEnd };
};

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

    const { monthlySalary } = req.body;
    const now = new Date();
    
    // Get current salary
    let currentSalary = await Salary.getCurrentSalary();
    
    // Update or create salary record
    if (currentSalary && currentSalary._id) {
      // Update existing
      if (monthlySalary !== undefined) {
        currentSalary.monthlySalary = monthlySalary;
      }
      await currentSalary.save();
    } else {
      // Create new
      currentSalary = await Salary.create({
        monthlySalary: monthlySalary || 0,
        effectiveFrom: now,
        startDate: now,
        lastResetDate: now
      });
    }

    res.json(currentSalary);
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
    
    // Get current week period (Sunday to Saturday)
    const { weekStart, weekEnd } = getCurrentWeekPeriod(now);
    
    // Get current month period (first day to last day of calendar month)
    const { monthStart, monthEnd } = getCurrentMonthPeriod(now);
    
    // Calculate total expenses since last reset (for monthly salary calculation)
    const totalExpensesSinceReset = await Expense.aggregate([
      {
        $match: {
          sourceType: 'salary',
          date: { $gte: salary.lastResetDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate salary expenses for today
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

    // Calculate salary expenses for current week (rolling from startDate)
    const salaryExpensesThisWeek = await Expense.aggregate([
      {
        $match: {
          sourceType: 'salary',
          date: { $gte: weekStart, $lte: weekEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate salary expenses for current month (from startDate month)
    const salaryExpensesThisMonth = await Expense.aggregate([
      {
        $match: {
          sourceType: 'salary',
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalSinceReset = totalExpensesSinceReset[0]?.total || 0;
    const usedToday = salaryExpensesToday[0]?.total || 0;
    const usedThisWeek = salaryExpensesThisWeek[0]?.total || 0;
    const usedThisMonth = salaryExpensesThisMonth[0]?.total || 0;
    
    // Monthly Salary = Current Salary - Total Expenses Since Last Reset
    const monthlySalaryDisplay = Math.max(0, salary.monthlySalary - totalSinceReset);
    const remaining = monthlySalaryDisplay; // Same as monthly salary display

    res.json({
      monthlySalary: salary.monthlySalary, // Original salary amount
      monthlySalaryDisplay, // Salary minus expenses since reset
      remaining, // Same as monthlySalaryDisplay
      usedToday,
      usedThisWeek,
      usedThisMonth
    });
  } catch (error) {
    next(error);
  }
};

// Reset all (salary and tracking)
exports.resetAll = async (req, res, next) => {
  try {
    const salary = await Salary.getCurrentSalary();
    const now = new Date();
    
    // Reset salary to 0 and update reset date
    salary.monthlySalary = 0;
    salary.lastResetDate = now;
    await salary.save();

    res.json({ 
      message: 'All data reset successfully',
      salary: salary 
    });
  } catch (error) {
    next(error);
  }
};

