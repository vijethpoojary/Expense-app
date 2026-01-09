const RoomExpense = require('../models/RoomExpense');
const Room = require('../models/Room');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { sanitizeString, sanitizeMongoQuery } = require('../middleware/sanitize');

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

// Helper to check if all members have paid (all splitDetails have status 'paid')
const areAllMembersPaid = (expense) => {
  if (!expense.splitDetails || expense.splitDetails.length === 0) {
    return false;
  }
  // Check if all split details have status 'paid'
  return expense.splitDetails.every(split => split.status === 'paid');
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
    
    // Validate and sanitize roomId
    if (!mongoose.Types.ObjectId.isValid(req.body.roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    
    const roomId = new mongoose.Types.ObjectId(req.body.roomId);
    const description = sanitizeString(req.body.description, { maxLength: 500 });
    
    // Validate and sanitize totalAmount
    let totalAmount;
    if (typeof req.body.totalAmount === 'number') {
      totalAmount = req.body.totalAmount;
    } else {
      totalAmount = parseFloat(req.body.totalAmount);
    }
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'Total amount must be a positive number' });
    }
    
    const date = req.body.date;
    const category = req.body.category ? sanitizeString(req.body.category, { maxLength: 100 }) : '';

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

    // Calculate equal split - each member owes their share to the payer
    const shareAmount = totalAmount / room.members.length;

    // Create split details - expense creator (payer) gets shareAmount 0, others owe their share
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
      
      // Validate parsed date
      if (isNaN(expenseDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    } else {
      expenseDate = getStartOfDayIST();
    }

    const expense = await RoomExpense.create({
      roomId,
      description: description, // Already sanitized
      totalAmount,
      paidBy: userId,
      splitDetails,
      date: expenseDate,
      category: category, // Already sanitized
      isArchived: false
    });

    // Check if all members are already paid (edge case: single member room)
    if (areAllMembersPaid(expense)) {
      expense.isArchived = true;
      await expense.save();
    }

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// Get room expenses
// SECURITY: Verify user is room member
exports.getRoomExpenses = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);

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
    const query = { roomId, isArchived: false }; // Exclude archived expenses by default

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
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID format' });
    }
    
    const userId = req.user.id;
    const expenseId = new mongoose.Types.ObjectId(req.params.id);
    
    // Validate memberUserId ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.body.memberUserId)) {
      return res.status(400).json({ message: 'Invalid member user ID format' });
    }
    
    const memberUserId = new mongoose.Types.ObjectId(req.body.memberUserId);
    const status = req.body.status;

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
    if (memberUserId.toString() === userId) {
      return res.status(400).json({ message: 'Cannot update payment status for expense creator' });
    }

    // Update the split detail
    const splitDetail = expense.splitDetails.find(
      split => split.userId.toString() === memberUserId.toString()
    );

    if (!splitDetail) {
      return res.status(404).json({ message: 'Member not found in split details' });
    }

    splitDetail.status = status;
    // If marking as paid, set paidAmount to shareAmount
    if (status === 'paid') {
      splitDetail.paidAmount = splitDetail.shareAmount;
    }
    // If marking as pending, keep paidAmount as is (don't reset to 0)
    // This allows partial payments to remain recorded
    await expense.save();

    // Check if all members are now paid, if so, archive the expense
    if (areAllMembersPaid(expense)) {
      expense.isArchived = true;
      await expense.save();
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Update partial payment amount for a split detail
// SECURITY: Only expense creator (paidBy) can update payment amount
// Can update either paidAmount or shareAmount (remaining amount)
exports.updatePartialPayment = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID format' });
    }
    
    const userId = req.user.id;
    const expenseId = new mongoose.Types.ObjectId(req.params.id);
    
    // Validate memberUserId ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.body.memberUserId)) {
      return res.status(400).json({ message: 'Invalid member user ID format' });
    }
    
    const memberUserId = new mongoose.Types.ObjectId(req.body.memberUserId);
    
    // Validate amounts
    let paidAmount = req.body.paidAmount;
    let shareAmount = req.body.shareAmount;
    
    if (paidAmount !== undefined) {
      paidAmount = typeof paidAmount === 'number' ? paidAmount : parseFloat(paidAmount);
      if (isNaN(paidAmount) || paidAmount < 0) {
        return res.status(400).json({ message: 'Paid amount must be a non-negative number' });
      }
    }
    
    if (shareAmount !== undefined) {
      shareAmount = typeof shareAmount === 'number' ? shareAmount : parseFloat(shareAmount);
      if (isNaN(shareAmount) || shareAmount <= 0) {
        return res.status(400).json({ message: 'Share amount must be a positive number' });
      }
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
    if (memberUserId.toString() === userId) {
      return res.status(400).json({ message: 'Cannot update payment amount for expense creator' });
    }

    // Update the split detail
    const splitDetail = expense.splitDetails.find(
      split => split.userId.toString() === memberUserId.toString()
    );

    if (!splitDetail) {
      return res.status(404).json({ message: 'Member not found in split details' });
    }

    // If shareAmount is provided, update the remaining amount (for editing how much they owe)
    if (shareAmount !== undefined && shareAmount !== null) {
      const newShareAmount = parseFloat(shareAmount);
      if (isNaN(newShareAmount) || newShareAmount < 0) {
        return res.status(400).json({ message: 'Share amount must be a valid positive number' });
      }
      splitDetail.shareAmount = newShareAmount;
    }

    // If paidAmount is provided, update the paid amount
    if (paidAmount !== undefined && paidAmount !== null) {
      const amount = parseFloat(paidAmount);
      if (isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: 'Paid amount must be a valid positive number' });
      }
      // Ensure paidAmount doesn't exceed shareAmount
      const finalPaidAmount = Math.min(amount, splitDetail.shareAmount);
      splitDetail.paidAmount = finalPaidAmount;
    }
    
    // Update status based on paidAmount and shareAmount
    if (splitDetail.paidAmount >= splitDetail.shareAmount) {
      splitDetail.status = 'paid';
      splitDetail.paidAmount = splitDetail.shareAmount; // Ensure exact match
    } else if (splitDetail.paidAmount > 0) {
      splitDetail.status = 'pending'; // Partial payment, still pending
    } else {
      splitDetail.status = 'pending'; // No payment, pending
    }
    
    await expense.save();

    // Check if all members are now paid, if so, archive the expense
    if (areAllMembersPaid(expense)) {
      expense.isArchived = true;
      await expense.save();
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

// Delete room expense
// SECURITY: Only expense creator (paidBy) can delete expense
exports.deleteRoomExpense = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID format' });
    }
    
    const userId = req.user.id;
    const expenseId = new mongoose.Types.ObjectId(req.params.id);

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

// Get individual debt breakdown per person
// SECURITY: Verify user is room member
exports.getDebtBreakdown = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);

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

    // Get all expenses for the room
    const allExpenses = await RoomExpense.find({ roomId });

    // Calculate individual debts: how much user owes to each person
    const debtBreakdown = {}; // { memberUserId: amount }
    
    // Initialize all members with 0 debt
    room.members.forEach(member => {
      const memberUserId = member.userId.toString();
      if (memberUserId !== userId.toString()) {
        debtBreakdown[memberUserId] = {
          userId: memberUserId,
          name: member.name,
          email: member.email,
          amount: 0
        };
      }
    });

    // Calculate debts from each expense
    allExpenses.forEach(expense => {
      const paidByUserId = expense.paidBy.toString();
      
      // Skip if user is the payer
      if (paidByUserId === userId.toString()) {
        return;
      }

      // Find user's split in this expense
      const userSplit = expense.splitDetails.find(
        split => split.userId.toString() === userId.toString()
      );
      
      if (userSplit) {
        const paidAmount = userSplit.paidAmount || 0;
        const remainingAmount = userSplit.shareAmount - paidAmount;
        
        // Add to debt breakdown for the payer
        if (debtBreakdown[paidByUserId]) {
          debtBreakdown[paidByUserId].amount += remainingAmount;
        }
      }
    });

    // Convert to array and calculate total
    const breakdownArray = Object.values(debtBreakdown);
    const totalPending = breakdownArray.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      breakdown: breakdownArray,
      totalPending
    });
  } catch (error) {
    next(error);
  }
};

// Get room analytics
// SECURITY: Verify user is room member
exports.getRoomAnalytics = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);

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

    // Get all expenses for the room (for totals - only current month)
    const monthExpenses = await RoomExpense.find({
      roomId,
      date: { $gte: startOfMonth }
    });
    
    // Get ALL expenses for the room (for balance calculation)
    const allExpenses = await RoomExpense.find({
      roomId
    });

    // Calculate totals
    let todayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;

    monthExpenses.forEach(expense => {
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

    // Calculate user's paid vs owed amounts - NO NETTING, each expense is isolated
    let userPaid = 0;
    let totalOwed = 0; // Total amount user owes to others (sum of all individual debts)

    allExpenses.forEach(expense => {
      const paidByUserId = expense.paidBy.toString();
      
      if (paidByUserId === userId.toString()) {
        // User paid this expense
        userPaid += expense.totalAmount;
      } else {
        // User didn't pay this expense - check their share (what they owe to the payer)
        const userSplit = expense.splitDetails.find(
          split => split.userId.toString() === userId.toString()
        );
        if (userSplit) {
          const paidAmount = userSplit.paidAmount || 0;
          const remainingAmount = userSplit.shareAmount - paidAmount;
          totalOwed += remainingAmount;
        }
      }
    });

    res.json({
      today: todayTotal,
      week: weekTotal,
      month: monthTotal,
      userPaid,
      userOwed: totalOwed > 0 ? totalOwed : 0 // Total pending amount (sum of all individual debts, no netting)
    });
  } catch (error) {
    next(error);
  }
};

// Get room expense history (all expenses including archived)
// SECURITY: Verify user is room member
exports.getRoomExpenseHistory = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);

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

    const { startDate, endDate, category, memberName } = req.query;
    const query = { roomId }; // Include both archived and non-archived

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
      .sort({ date: -1 }); // Sort by date descending (newest first)

    // Member name filter (filter by paidBy member name)
    if (memberName) {
      const memberIds = room.members
        .filter(member => 
          member.name.toLowerCase().includes(memberName.toLowerCase()) ||
          member.email.toLowerCase().includes(memberName.toLowerCase())
        )
        .map(member => member.userId.toString());
      
      expenses = expenses.filter(expense => {
        const paidByUserId = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
        return memberIds.includes(paidByUserId);
      });
    }

    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

// Reset all expenses for a room (delete all expenses)
// SECURITY: Only room creator can reset
exports.resetRoomExpenses = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
    
    const userId = req.user.id;
    const roomId = new mongoose.Types.ObjectId(req.params.roomId);

    // Verify user is the room creator
    const room = await Room.findOne({
      _id: roomId,
      createdBy: userId,
      isActive: true
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found or you are not the creator' });
    }

    // Delete all expenses for this room (both archived and non-archived)
    const result = await RoomExpense.deleteMany({ roomId });

    res.json({ 
      message: 'All expenses have been reset successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

