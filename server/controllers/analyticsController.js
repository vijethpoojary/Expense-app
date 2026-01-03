const Expense = require('../models/Expense');
const Investment = require('../models/Investment');
const mongoose = require('mongoose');

// SECURITY: All analytics operations must be scoped to authenticated user's data

// Get comprehensive analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    // Convert userId string to ObjectId for MongoDB queries
    const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);
    
    // Get timezone offset from request (if provided) or use 0 (UTC)
    const timezoneOffset = req.query.timezoneOffset ? parseInt(req.query.timezoneOffset) : 0;
    
    // Get current time in UTC
    const now = new Date();
    
    // Get current date/time in user's timezone by adjusting UTC time
    const userNow = new Date(now.getTime() + (timezoneOffset * 60 * 1000));
    
    // Get start of today in user's timezone (midnight local time)
    const year = userNow.getUTCFullYear();
    const month = userNow.getUTCMonth();
    const date = userNow.getUTCDate();
    
    // Create date at midnight in user's timezone, then convert to UTC for database query
    const startOfTodayInUserTZ = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
    const startOfToday = new Date(startOfTodayInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
    
    // Get start of week (Sunday to Saturday) in user's timezone
    const dayOfWeek = userNow.getUTCDay();
    const daysToSubtract = dayOfWeek; // Sunday = 0, so subtract 0 days for Sunday
    const weekStartInUserTZ = new Date(Date.UTC(year, month, date - daysToSubtract, 0, 0, 0, 0));
    const startOfWeek = new Date(weekStartInUserTZ.getTime() - (timezoneOffset * 60 * 1000));
    
    // Get start of month in user's timezone
    const monthStartInUserTZ = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const startOfMonth = new Date(monthStartInUserTZ.getTime() - (timezoneOffset * 60 * 1000));

    // Overall Expenses (all source types)
    const overallToday = await Expense.aggregate([
      { $match: { userId: userIdObjectId, date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const overallWeek = await Expense.aggregate([
      { $match: { userId: userIdObjectId, date: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const overallMonth = await Expense.aggregate([
      { $match: { userId: userIdObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Salary Expenses (only sourceType = 'salary')
    const salaryToday = await Expense.aggregate([
      { $match: { userId: userIdObjectId, sourceType: 'salary', date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const salaryWeek = await Expense.aggregate([
      { $match: { userId: userIdObjectId, sourceType: 'salary', date: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const salaryMonth = await Expense.aggregate([
      { $match: { userId: userIdObjectId, sourceType: 'salary', date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Other Expenses (sourceType = 'other')
    const otherToday = await Expense.aggregate([
      { $match: { userId: userIdObjectId, sourceType: 'other', date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const otherWeek = await Expense.aggregate([
      { $match: { userId: userIdObjectId, sourceType: 'other', date: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const otherMonth = await Expense.aggregate([
      { $match: { userId: userIdObjectId, sourceType: 'other', date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Investment Analytics
    const investmentToday = await Investment.aggregate([
      { $match: { userId: userIdObjectId, date: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const investmentWeek = await Investment.aggregate([
      { $match: { userId: userIdObjectId, date: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const investmentMonth = await Investment.aggregate([
      { $match: { userId: userIdObjectId, date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      expenses: {
        overall: {
          today: overallToday[0]?.total || 0,
          week: overallWeek[0]?.total || 0,
          month: overallMonth[0]?.total || 0
        },
        salary: {
          today: salaryToday[0]?.total || 0,
          week: salaryWeek[0]?.total || 0,
          month: salaryMonth[0]?.total || 0
        },
        other: {
          today: otherToday[0]?.total || 0,
          week: otherWeek[0]?.total || 0,
          month: otherMonth[0]?.total || 0
        }
      },
      investments: {
        today: investmentToday[0]?.total || 0,
        week: investmentWeek[0]?.total || 0,
        month: investmentMonth[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly summary
exports.getMonthlySummary = async (req, res, next) => {
  try {
    // Convert userId string to ObjectId for MongoDB queries
    const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth();
    
    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    // Expenses by category
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          userId: userIdObjectId, // CRITICAL: User data isolation
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Expenses by source type
    const expensesBySource = await Expense.aggregate([
      {
        $match: {
          userId: userIdObjectId, // CRITICAL: User data isolation
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$sourceType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Investments by type
    const investmentsByType = await Investment.aggregate([
      {
        $match: {
          userId: userIdObjectId, // CRITICAL: User data isolation
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$investmentType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Daily breakdown
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          userId: userIdObjectId, // CRITICAL: User data isolation
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyInvestments = await Investment.aggregate([
      {
        $match: {
          userId: userIdObjectId, // CRITICAL: User data isolation
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period: { year: targetYear, month: targetMonth + 1 },
      expensesByCategory,
      expensesBySource,
      investmentsByType,
      dailyExpenses,
      dailyInvestments
    });
  } catch (error) {
    next(error);
  }
};

