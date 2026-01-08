const Investment = require('../models/Investment');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { sanitizeMongoQuery, sanitizeString, sanitizeNumber } = require('../middleware/sanitize');

// Get all investments with optional filters
// SECURITY: Always filter by userId from authenticated token
exports.getInvestments = async (req, res, next) => {
  try {
    const { startDate, endDate, investmentType } = req.query;
    const query = { userId: req.user.id }; // CRITICAL: User data isolation

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Investment type filter - sanitize
    if (investmentType) {
      const sanitizedType = sanitizeString(investmentType, { maxLength: 100 });
      if (sanitizedType) {
        query.investmentType = sanitizedType;
      }
    }

    // Sanitize the entire query before execution
    const sanitizedQuery = sanitizeMongoQuery(query);
    const investments = await Investment.find(sanitizedQuery).sort({ date: -1 });
    res.json(investments);
  } catch (error) {
    next(error);
  }
};

// Get single investment
// SECURITY: Verify investment belongs to authenticated user
exports.getInvestment = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid investment ID format' });
    }
    
    const investmentId = new mongoose.Types.ObjectId(req.params.id);
    const investment = await Investment.findOne({ 
      _id: investmentId,
      userId: req.user.id // CRITICAL: User data isolation
    });
    
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json(investment);
  } catch (error) {
    next(error);
  }
};

// Create investment
// SECURITY: Set userId from authenticated token (never trust frontend)
exports.createInvestment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Sanitize and prepare investment data
    const investmentData = {
      investmentName: sanitizeString(req.body.investmentName, { maxLength: 200 }),
      amount: sanitizeNumber(req.body.amount, { min: 0 }),
      investmentType: req.body.investmentType ? sanitizeString(req.body.investmentType, { maxLength: 100 }) : '',
      date: req.body.date ? new Date(req.body.date) : new Date(),
      userId: req.user.id // CRITICAL: Set from authenticated token
    };
    
    const investment = await Investment.create(investmentData);
    res.status(201).json(investment);
  } catch (error) {
    next(error);
  }
};

// Update investment
// SECURITY: Verify investment belongs to authenticated user
exports.updateInvestment = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid investment ID format' });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Remove userId from body if present (prevent user from changing ownership)
    const { userId, ...updateData } = req.body;
    
    // Sanitize update data
    if (updateData.investmentName) {
      updateData.investmentName = sanitizeString(updateData.investmentName, { maxLength: 200 });
    }
    if (updateData.investmentType) {
      updateData.investmentType = sanitizeString(updateData.investmentType, { maxLength: 100 });
    }
    if (updateData.amount !== undefined) {
      updateData.amount = sanitizeNumber(updateData.amount, { min: 0 });
    }

    const investmentId = new mongoose.Types.ObjectId(req.params.id);
    const investment = await Investment.findOneAndUpdate(
      { 
        _id: investmentId,
        userId: req.user.id // CRITICAL: User data isolation
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    res.json(investment);
  } catch (error) {
    next(error);
  }
};

// Delete investment
// SECURITY: Verify investment belongs to authenticated user
exports.deleteInvestment = async (req, res, next) => {
  try {
    // Validate and sanitize ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid investment ID format' });
    }
    
    const investmentId = new mongoose.Types.ObjectId(req.params.id);
    const investment = await Investment.findOneAndDelete({ 
      _id: investmentId,
      userId: req.user.id // CRITICAL: User data isolation
    });
    
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete multiple investments by IDs
// SECURITY: Only delete investments that belong to authenticated user
exports.deleteSelectedInvestments = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of investment IDs to delete' });
    }

    // Validate and sanitize all ObjectIds
    const validIds = ids
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    
    if (validIds.length === 0) {
      return res.status(400).json({ message: 'No valid investment IDs provided' });
    }

    const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);
    
    // Delete only investments that belong to the authenticated user
    const result = await Investment.deleteMany({
      _id: { $in: validIds },
      userId: userIdObjectId // CRITICAL: User data isolation
    });

    res.json({
      message: `Successfully deleted ${result.deletedCount} investment(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// Delete all investments for authenticated user
// SECURITY: Only delete investments that belong to authenticated user
exports.deleteAllInvestments = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const userIdObjectId = new mongoose.Types.ObjectId(req.user.id);
    
    // Delete all investments for the authenticated user
    const result = await Investment.deleteMany({
      userId: userIdObjectId // CRITICAL: User data isolation
    });

    res.json({
      message: `Successfully deleted all ${result.deletedCount} investment(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
};

// Get unique investment types
// SECURITY: Only return types for authenticated user's investments
exports.getInvestmentTypes = async (req, res, next) => {
  try {
    const types = await Investment.distinct('investmentType', { 
      userId: req.user.id, // CRITICAL: User data isolation
      investmentType: { $ne: '' } 
    });
    res.json(types);
  } catch (error) {
    next(error);
  }
};

