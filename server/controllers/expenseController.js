const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Get all expenses with optional filters
// SECURITY: Always filter by userId from authenticated token
exports.getExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category, sourceType } = req.query;
    const query = { userId: req.user.id }; // CRITICAL: User data isolation

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Source type filter
    if (sourceType) {
      query.sourceType = sourceType;
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

// Get single expense
// SECURITY: Verify expense belongs to authenticated user
exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ 
      _id: req.params.id,
      userId: req.user.id // CRITICAL: User data isolation
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Create expense
// SECURITY: Set userId from authenticated token (never trust frontend)
exports.createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Convert date string to Date object if provided
    const expenseData = {
      ...req.body,
      userId: req.user.id
    };
    
    // Get timezone offset from request (if provided) or use 0 (UTC)
    const timezoneOffset = req.body.timezoneOffset ? parseInt(req.body.timezoneOffset) : 0;
    
    // If date is provided as string, convert to Date object
    if (expenseData.date && typeof expenseData.date === 'string') {
      // Handle date string format (YYYY-MM-DD)
      // Parse the date string and create a Date object at midnight in user's timezone
      const dateParts = expenseData.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        // Create date at midnight in user's timezone
        // The date string "2026-01-03" represents Jan 3 in user's local timezone
        // We need to store it so that when queried with timezone offset, it matches
        // If user selects Jan 3 in IST (UTC+5:30), we store it as Jan 3 00:00 IST = Jan 2 18:30 UTC
        // So we subtract the timezone offset to convert to UTC
        expenseData.date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        // Adjust for timezone: if user is ahead of UTC, subtract offset to get UTC equivalent
        expenseData.date = new Date(expenseData.date.getTime() - (timezoneOffset * 60 * 1000));
      } else {
        // Fallback to default parsing
        expenseData.date = new Date(expenseData.date);
        expenseData.date.setUTCHours(0, 0, 0, 0);
      }
    } else if (expenseData.date && !(expenseData.date instanceof Date)) {
      // If it's not a string and not a Date, try to convert it
      expenseData.date = new Date(expenseData.date);
      expenseData.date.setUTCHours(0, 0, 0, 0);
    } else if (!expenseData.date) {
      // If no date provided, use today at midnight in user's timezone
      const now = new Date();
      const userNow = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
      const year = userNow.getUTCFullYear();
      const month = userNow.getUTCMonth();
      const date = userNow.getUTCDate();
      const dateInUserTZ = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
      expenseData.date = new Date(dateInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
    }
    
    // Remove timezoneOffset from expenseData as it's not a field in the schema
    delete expenseData.timezoneOffset;

    // CRITICAL: Set userId from authenticated token, not from request body
    const expense = await Expense.create(expenseData);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// Update expense
// SECURITY: Verify expense belongs to authenticated user
exports.updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Remove userId and timezoneOffset from body if present
    const { userId, timezoneOffset: tzOffset, ...updateData } = req.body;
    
    // Get timezone offset from request (if provided) or use 0 (UTC)
    const timezoneOffset = tzOffset ? parseInt(tzOffset) : 0;
    
    // Convert date string to Date object if provided
    if (updateData.date && typeof updateData.date === 'string') {
      // Parse the date string and create a Date object at midnight in user's timezone
      const dateParts = updateData.date.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        // Create date at midnight in user's timezone, then convert to UTC for storage
        const dateInUserTZ = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        // Convert to UTC by subtracting the timezone offset
        updateData.date = new Date(dateInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
      } else {
        // Fallback to default parsing
        updateData.date = new Date(updateData.date);
        updateData.date.setUTCHours(0, 0, 0, 0);
      }
    } else if (updateData.date && !(updateData.date instanceof Date)) {
      // If it's not a string and not a Date, try to convert it
      updateData.date = new Date(updateData.date);
      updateData.date.setUTCHours(0, 0, 0, 0);
    }

    const expense = await Expense.findOneAndUpdate(
      { 
        _id: req.params.id,
        userId: req.user.id // CRITICAL: User data isolation
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Delete expense
// SECURITY: Verify expense belongs to authenticated user
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id // CRITICAL: User data isolation
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get unique categories
// SECURITY: Only return categories for authenticated user's expenses
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Expense.distinct('category', { 
      userId: req.user.id, // CRITICAL: User data isolation
      category: { $ne: '' } 
    });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get expenses history grouped by week and month
// SECURITY: Only return expenses for authenticated user
exports.getExpensesHistory = async (req, res, next) => {
  try {
    // Get all expenses for this user only
    const allExpenses = await Expense.find({ userId: req.user.id }).sort({ date: 1 }); // CRITICAL: User data isolation
    
    // Helper to get week period for a given date (Sunday to Saturday)
    const getWeekPeriod = (expenseDate) => {
      const expDate = new Date(expenseDate);
      expDate.setHours(0, 0, 0, 0);
      
      const dayOfWeek = expDate.getDay();
      const daysToSubtract = dayOfWeek;
      
      const weekStart = new Date(expDate);
      weekStart.setDate(expDate.getDate() - daysToSubtract);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Create a unique key for this week
      const weekKey = weekStart.toISOString().split('T')[0];
      
      return {
        weekStart,
        weekEnd,
        weekKey
      };
    };
    
    // Helper to get month period for a given date (calendar month)
    const getMonthPeriod = (expenseDate) => {
      const expDate = new Date(expenseDate);
      
      const monthStart = new Date(expDate.getFullYear(), expDate.getMonth(), 1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(expDate.getFullYear(), expDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      // Create a unique key for this month
      const monthKey = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
      
      return {
        monthStart,
        monthEnd,
        monthKey
      };
    };
    
    // Group expenses by week
    const weeklyGroups = {};
    allExpenses.forEach(expense => {
      const { weekStart, weekEnd, weekKey } = getWeekPeriod(expense.date);
      const dateRange = `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`;
      
      if (!weeklyGroups[weekKey]) {
        weeklyGroups[weekKey] = {
          weekKey,
          dateRange,
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          expenses: [],
          total: 0
        };
      }
      
      weeklyGroups[weekKey].expenses.push(expense);
      weeklyGroups[weekKey].total += expense.amount;
    });
    
    // Group expenses by month
    const monthlyGroups = {};
    allExpenses.forEach(expense => {
      const { monthStart, monthEnd, monthKey } = getMonthPeriod(expense.date);
      const monthLabel = `${monthStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
      
      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthLabel,
          monthStart: monthStart.toISOString(),
          monthEnd: monthEnd.toISOString(),
          expenses: [],
          total: 0
        };
      }
      
      monthlyGroups[monthKey].expenses.push(expense);
      monthlyGroups[monthKey].total += expense.amount;
    });
    
    // Convert to arrays and sort
    const weeklyArray = Object.values(weeklyGroups).sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));
    const monthlyArray = Object.values(monthlyGroups).sort((a, b) => new Date(b.monthStart) - new Date(a.monthStart));
    
    res.json({
      weekly: weeklyArray,
      monthly: monthlyArray
    });
  } catch (error) {
    next(error);
  }
};

