const Salary = require('../models/Salary');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// SECURITY: All salary operations must be scoped to authenticated user's data

// Helper function to calculate week period (Sunday to Saturday)
const getCurrentWeekPeriod = (year, month, date, timezoneOffset = 0) => {
  // Create a date for today at midnight in user's timezone (as UTC date)
  const todayInUserTZ = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  
  // To get the correct day of week in user's timezone, we need to create a date
  // that when converted to user's local time gives us the right day
  // Create a date string in ISO format and parse it to get proper day calculation
  const tempDate = new Date(todayInUserTZ.getTime() + (timezoneOffset * 60 * 1000));
  const dayOfWeek = tempDate.getUTCDay();
  
  // Calculate days to subtract to get to Sunday (start of week)
  const daysToSubtract = dayOfWeek;
  
  // Get Sunday (start of week) at midnight in user's timezone
  const weekStartInUserTZ = new Date(todayInUserTZ);
  weekStartInUserTZ.setUTCDate(todayInUserTZ.getUTCDate() - daysToSubtract);
  
  // Get Saturday (end of week) at 23:59:59.999 in user's timezone
  const weekEndInUserTZ = new Date(weekStartInUserTZ);
  weekEndInUserTZ.setUTCDate(weekStartInUserTZ.getUTCDate() + 6);
  weekEndInUserTZ.setUTCHours(23, 59, 59, 999);
  
  // Convert to UTC for database queries (subtract the offset to get UTC)
  const weekStartUTC = new Date(weekStartInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
  const weekEndUTC = new Date(weekEndInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
  
  return { weekStart: weekStartUTC, weekEnd: weekEndUTC };
};

// Helper function to calculate month period (first day to last day of calendar month)
const getCurrentMonthPeriod = (year, month, timezoneOffset = 0) => {
  // Create month start (1st day) at midnight in user's timezone
  const monthStartInUserTZ = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  
  // Get last day of month at 23:59:59.999 in user's timezone
  const monthEndInUserTZ = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
  
  // Convert to UTC for database queries
  const monthStartUTC = new Date(monthStartInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
  const monthEndUTC = new Date(monthEndInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
  
  return { monthStart: monthStartUTC, monthEnd: monthEndUTC };
};

// Get current salary
// SECURITY: Only return salary for authenticated user
exports.getSalary = async (req, res, next) => {
  try {
    const salary = await Salary.getCurrentSalary(req.user.id); // CRITICAL: User data isolation
    res.json(salary);
  } catch (error) {
    next(error);
  }
};

// Update or create salary
// SECURITY: Only update/create salary for authenticated user
exports.updateSalary = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { monthlySalary } = req.body;
    const now = new Date();
    
    // Get current salary for this user
    let currentSalary = await Salary.getCurrentSalary(req.user.id); // CRITICAL: User data isolation
    
    // Update or create salary record
    if (currentSalary && currentSalary._id) {
      // Update existing
      if (monthlySalary !== undefined) {
        currentSalary.monthlySalary = monthlySalary;
      }
      await currentSalary.save();
    } else {
      // Create new (shouldn't happen due to getCurrentSalary, but just in case)
      currentSalary = await Salary.create({
        userId: req.user.id, // CRITICAL: User data isolation
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
// SECURITY: Only return stats for authenticated user's data
exports.getSalaryStats = async (req, res, next) => {
  try {
    const salary = await Salary.getCurrentSalary(req.user.id); // CRITICAL: User data isolation
    
    // Get timezone offset from request (in minutes, e.g., +330 for IST, -300 for EST)
    // If not provided, use UTC (0)
    const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : 0;
    
    // Get current time in UTC
    const now = new Date();
    
    // Get current date/time in user's timezone by adjusting UTC time
    const userNow = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
    
    // Get start of today in user's timezone (midnight local time)
    // Create a date representing midnight in user's timezone
    const year = userNow.getUTCFullYear();
    const month = userNow.getUTCMonth();
    const date = userNow.getUTCDate();
    
    // This represents midnight in user's timezone, now convert to UTC for database query
    const startOfTodayInUserTZ = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
    const startOfTodayUTC = new Date(startOfTodayInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
    
    // Get current week period (Sunday to Saturday) in user's timezone
    const { weekStart, weekEnd } = getCurrentWeekPeriod(year, month, date, timezoneOffset);
    
    // Get current month period (first day to last day of calendar month) in user's timezone
    const { monthStart, monthEnd } = getCurrentMonthPeriod(year, month, timezoneOffset);
    
    // Calculate total expenses since last reset (for monthly salary calculation)
    const totalExpensesSinceReset = await Expense.aggregate([
      {
        $match: {
          userId: req.user.id, // CRITICAL: User data isolation
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

    // Calculate salary expenses for today (using UTC-adjusted date)
    const salaryExpensesToday = await Expense.aggregate([
      {
        $match: {
          userId: req.user.id, // CRITICAL: User data isolation
          sourceType: 'salary',
          date: { $gte: startOfTodayUTC }
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
          userId: req.user.id, // CRITICAL: User data isolation
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
          userId: req.user.id, // CRITICAL: User data isolation
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
    
    // Monthly Salary Display = Current Salary - Total Expenses Since Last Reset
    const monthlySalaryDisplay = Math.max(0, salary.monthlySalary - totalSinceReset);
    
    // Remaining This Month = Current Salary - Current Month's Expenses
    const remaining = Math.max(0, salary.monthlySalary - usedThisMonth);

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
// SECURITY: Only reset salary for authenticated user
exports.resetAll = async (req, res, next) => {
  try {
    const salary = await Salary.getCurrentSalary(req.user.id); // CRITICAL: User data isolation
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

