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

    // CRITICAL: Set userId from authenticated token, not from request body
    const expense = await Expense.create({
      ...req.body,
      userId: req.user.id
    });
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

    // Remove userId from body if present (prevent user from changing ownership)
    const { userId, ...updateData } = req.body;

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

