const Investment = require('../models/Investment');
const { validationResult } = require('express-validator');

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

    // Investment type filter
    if (investmentType) {
      query.investmentType = investmentType;
    }

    const investments = await Investment.find(query).sort({ date: -1 });
    res.json(investments);
  } catch (error) {
    next(error);
  }
};

// Get single investment
// SECURITY: Verify investment belongs to authenticated user
exports.getInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findOne({ 
      _id: req.params.id,
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

    // CRITICAL: Set userId from authenticated token, not from request body
    const investment = await Investment.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(investment);
  } catch (error) {
    next(error);
  }
};

// Update investment
// SECURITY: Verify investment belongs to authenticated user
exports.updateInvestment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Remove userId from body if present (prevent user from changing ownership)
    const { userId, ...updateData } = req.body;

    const investment = await Investment.findOneAndUpdate(
      { 
        _id: req.params.id,
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
    const investment = await Investment.findOneAndDelete({ 
      _id: req.params.id,
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

