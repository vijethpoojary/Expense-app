const Investment = require('../models/Investment');
const { validationResult } = require('express-validator');

// Get all investments with optional filters
exports.getInvestments = async (req, res, next) => {
  try {
    const { startDate, endDate, investmentType } = req.query;
    const query = {};

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
exports.getInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findById(req.params.id);
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json(investment);
  } catch (error) {
    next(error);
  }
};

// Create investment
exports.createInvestment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const investment = await Investment.create(req.body);
    res.status(201).json(investment);
  } catch (error) {
    next(error);
  }
};

// Update investment
exports.updateInvestment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const investment = await Investment.findByIdAndUpdate(
      req.params.id,
      req.body,
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
exports.deleteInvestment = async (req, res, next) => {
  try {
    const investment = await Investment.findByIdAndDelete(req.params.id);
    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get unique investment types
exports.getInvestmentTypes = async (req, res, next) => {
  try {
    const types = await Investment.distinct('investmentType', { investmentType: { $ne: '' } });
    res.json(types);
  } catch (error) {
    next(error);
  }
};

