const RoomExpense = require('../models/RoomExpense');
const Room = require('../models/Room');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Asia/Kolkata timezone offset: UTC+5:30 = 330 minutes
const IST_OFFSET = 330;

// Helper to get start of day in IST (midnight IST)
const getStartOfDayIST = () => {
  const now = new Date();
  const userNow = new Date(now.getTime() + (IST_OFFSET * 60 * 1000));
  const year = userNow.getUTCFullYear();
  const month = userNow.getUTCMonth();
  const date = userNow.getUTCDate();
  const startOfDayInIST = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  return new Date(startOfDayInIST.getTime() - (IST_OFFSET * 60 * 1000));
};

// Helper to get start of week in IST (Monday 00:00 IST)
const getStartOfWeekIST = () => {
  const now = new Date();
  const userNow = new Date(now.getTime() + (IST_OFFSET * 60 * 1000));
  const year = userNow.getUTCFullYear();
  const month = userNow.getUTCMonth();
  const date = userNow.getUTCDate();
  const dayOfWeek = userNow.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is start of week
  const weekStartDate = date - daysToSubtract;
  const weekStartInIST = new Date(Date.UTC(year, month, weekStartDate, 0, 0, 0, 0));
  return new Date(weekStartInIST.getTime() - (IST_OFFSET * 60 * 1000));
};

// Helper to get start of month in IST (1st of month 00:00 IST)
const getStartOfMonthIST = () => {
  const startOfToday = getStartOfDayIST();
  const userToday = new Date(startOfToday.getTime() + (IST_OFFSET * 60 * 1000));
  const year = userToday.getUTCFullYear();
  const month = userToday.getUTCMonth();
  const monthStartInIST = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  return new Date(monthStartInIST.getTime() - (IST_OFFSET * 60 * 1000));
};

// Create room expense
// SECURITY: Verify user is room member, set paidBy from authenticated token
exports.createRoomExpense = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { roomId, description, totalAmount, date, category } = req.body;

    // Verify user is a member of the room
    const room = await Room.findOne({
      _id: roomId,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    if (room.members.length === 0) {
      return res.status(400).json({ message: 'Room has no members' });
    }

    // Calculate equal split
    const shareAmount = totalAmount / room.members.length;

    // Create split details - expense creator gets status 'paid' with shareAmount 0
    const splitDetails = room.members.map(member => ({
      userId: member.userId,
      shareAmount: member.userId.toString() === userId ? 0 : shareAmount,
      paidAmount: 0,
      status: member.userId.toString() === userId ? 'paid' : 'pending'
    }));

    // Parse date or use today
    let expenseDate;
    if (date) {
      if (typeof date === 'string') {
        const dateParts = date.split('-');
        if (dateParts.length === 3) {
          const year = parseInt(dateParts[0], 10);
          const month = parseInt(dateParts[1], 10) - 1;
          const day = parseInt(dateParts[2], 10);
          expenseDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          expenseDate = new Date(expenseDate.getTime() - (IST_OFFSET * 60 * 1000));
        } else {
          expenseDate = new Date(date);
        }
      } else {
        expenseDate = new Date(date);
      }
    } else {
      expenseDate = getStartOfDayIST();
    }

    const expense = await RoomExpense.create({
      roomId,
      description: description.trim(),
      totalAmount,
      paidBy: userId,
      splitDetails,
      date: expenseDate,
      category: category ? category.trim() : ''
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// Get room expenses
// SECURITY: Verify user is room member
exports.getRoomExpenses = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = req.params.roomId;

    // Verify user is a member of the room
    const room = await Room.findOne({
      _id: roomId,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    const { startDate, endDate, category, paymentStatus } = req.query;
    const query = { roomId };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const startParts = startDate.split('-');
        if (startParts.length === 3) {
          const year = parseInt(startParts[0], 10);
          const month = parseInt(startParts[1], 10) - 1;
          const day = parseInt(startParts[2], 10);
          const startDateIST = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
          query.date.$gte = new Date(startDateIST.getTime() - (IST_OFFSET * 60 * 1000));
        } else {
          query.date.$gte = new Date(startDate);
        }
      }
      if (endDate) {
        const endParts = endDate.split('-');
        if (endParts.length === 3) {
          const year = parseInt(endParts[0], 10);
          const month = parseInt(endParts[1], 10) - 1;
          const day = parseInt(endParts[2], 10);
          const endDateIST = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
          query.date.$lte = new Date(endDateIST.getTime() - (IST_OFFSET * 60 * 1000));
        } else {
          query.date.$lte = new Date(endDate);
        }
      }
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    let expenses = await RoomExpense.find(query)
      .populate('paidBy', 'email')
      .sort({ date: -1 });

    // Payment status filter (client-side filtering since it's per user)
    if (paymentStatus) {
      expenses = expenses.filter(expense => {
        const userSplit = expense.splitDetails.find(
          split => split.userId.toString() === userId.toString()
        );
        if (!userSplit) return false;
        return userSplit.status === paymentStatus;
      });
    }

    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

// Update payment status for a split detail
// SECURITY: Only expense creator (paidBy) can update status
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const { memberUserId, status } = req.body;

    if (!['paid', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "paid" or "pending"' });
    }

    // Find expense and verify user is the creator (paidBy)
    const expense = await RoomExpense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only expense creator can update payment status' });
    }

    // Prevent updating payer's status
    if (memberUserId === userId) {
      return res.status(400).json({ message: 'Cannot update payment status for expense creator' });
    }

    // Update the split detail
    const splitDetail = expense.splitDetails.find(
      split => split.userId.toString() === memberUserId
    );

    if (!splitDetail) {
      return res.status(404).json({ message: 'Member not found in split details' });
    }

    splitDetail.status = status;
    // If marking as paid, set paidAmount to shareAmount
    if (status === 'paid') {
      splitDetail.paidAmount = splitDetail.shareAmount;
    } else {
      // If marking as pending, reset paidAmount to 0
      splitDetail.paidAmount = 0;
    }
    await expense.save();

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Update partial payment amount for a split detail
// SECURITY: Only expense creator (paidBy) can update payment amount
exports.updatePartialPayment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;
    const { memberUserId, paidAmount } = req.body;

    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: 'Paid amount must be a valid positive number' });
    }

    // Find expense and verify user is the creator (paidBy)
    const expense = await RoomExpense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only expense creator can update payment amount' });
    }

    // Prevent updating payer's amount
    if (memberUserId === userId) {
      return res.status(400).json({ message: 'Cannot update payment amount for expense creator' });
    }

    // Update the split detail
    const splitDetail = expense.splitDetails.find(
      split => split.userId.toString() === memberUserId
    );

    if (!splitDetail) {
      return res.status(404).json({ message: 'Member not found in split details' });
    }

    // Ensure paidAmount doesn't exceed shareAmount
    const finalPaidAmount = Math.min(amount, splitDetail.shareAmount);
    splitDetail.paidAmount = finalPaidAmount;
    
    // Update status based on paidAmount
    if (finalPaidAmount >= splitDetail.shareAmount) {
      splitDetail.status = 'paid';
      splitDetail.paidAmount = splitDetail.shareAmount; // Ensure exact match
    } else if (finalPaidAmount > 0) {
      splitDetail.status = 'pending'; // Partial payment, still pending
    } else {
      splitDetail.status = 'pending'; // No payment, pending
    }
    
    await expense.save();

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Delete room expense
// SECURITY: Only expense creator (paidBy) can delete expense
exports.deleteRoomExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const expenseId = req.params.id;

    // Find expense and verify user is the creator (paidBy)
    const expense = await RoomExpense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.paidBy.toString() !== userId) {
      return res.status(403).json({ message: 'Only expense creator can delete this expense' });
    }

    await RoomExpense.findByIdAndDelete(expenseId);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get room analytics
// SECURITY: Verify user is room member
exports.getRoomAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = req.params.roomId;

    // Verify user is a member of the room
    const room = await Room.findOne({
      _id: roomId,
      isActive: true,
      $or: [
        { createdBy: userId },
        { 'members.userId': userId }
      ]
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    const startOfToday = getStartOfDayIST();
    const endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000) - 1);
    
    const startOfWeek = getStartOfWeekIST();
    const endOfWeek = new Date(startOfWeek.getTime() + (7 * 24 * 60 * 60 * 1000) - 1);
    
    const startOfMonth = getStartOfMonthIST();
    const userMonthStart = new Date(startOfMonth.getTime() + (IST_OFFSET * 60 * 1000));
    const year = userMonthStart.getUTCFullYear();
    const month = userMonthStart.getUTCMonth();
    const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    const endOfMonth = new Date(lastDay.getTime() - (IST_OFFSET * 60 * 1000));

    // Get all expenses for the room
    const allExpenses = await RoomExpense.find({
      roomId,
      date: { $gte: startOfMonth }
    });

    // Calculate totals
    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    allExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date.getTime() + (IST_OFFSET * 60 * 1000));
      
      if (expense.date >= startOfToday && expense.date <= endOfToday) {
        todayTotal += expense.totalAmount;
      }
      if (expense.date >= startOfWeek && expense.date <= endOfWeek) {
        weekTotal += expense.totalAmount;
      }
      if (expense.date >= startOfMonth && expense.date <= endOfMonth) {
        monthTotal += expense.totalAmount;
      }
    });

    // Calculate user's paid vs owed amounts with net balance logic
    let userPaid = 0;
    let userOwed = 0;
    let othersOweUser = 0;

    allExpenses.forEach(expense => {
      if (expense.paidBy.toString() === userId.toString()) {
        // User paid this expense - reduce their pending by full amount paid
        userPaid += expense.totalAmount;
        userOwed -= expense.totalAmount; // Reduce pending when you pay for expense
        
        // Calculate how much others owe user from this expense
        expense.splitDetails.forEach(split => {
          if (split.userId.toString() !== userId.toString()) {
            const paidAmount = split.paidAmount || 0;
            othersOweUser += (split.shareAmount - paidAmount);
          }
        });
      } else {
        // User didn't pay this expense - check their share
        const userSplit = expense.splitDetails.find(
          split => split.userId.toString() === userId.toString()
        );
        if (userSplit && userSplit.status === 'pending') {
          const paidAmount = userSplit.paidAmount || 0;
          userOwed += (userSplit.shareAmount - paidAmount);
        }
      }
    });

    // Net balance: what user owes minus what others owe user
    const netBalance = userOwed - othersOweUser;

    res.json({
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
      userPaid,
      userOwed: userOwed > 0 ? userOwed : 0, // Show positive pending amount
      othersOweUser,
      netBalance // Positive = user owes, Negative = others owe user
    });
  } catch (error) {
    next(error);
  }
};

