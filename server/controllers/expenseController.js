const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

// Get all expenses with optional filters
exports.getExpenses = async (req, res, next) => {
  try {
    const { startDate, endDate, category, sourceType } = req.query;
    const query = {};

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
exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Create expense
exports.createExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.create(req.body);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// Update expense
exports.updateExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
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
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get unique categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Expense.distinct('category', { category: { $ne: '' } });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Get expenses history grouped by week and month
exports.getExpensesHistory = async (req, res, next) => {
  try {
    // Get all expenses
    const allExpenses = await Expense.find({}).sort({ date: 1 });
    
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

