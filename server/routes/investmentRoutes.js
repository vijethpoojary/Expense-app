const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const investmentController = require('../controllers/investmentController');

// Validation and sanitization rules
const investmentValidation = [
  body('investmentName')
    .trim()
    .notEmpty().withMessage('Investment name is required')
    .isLength({ max: 200 }).withMessage('Investment name must be less than 200 characters')
    .escape(), // Escape HTML entities
  body('amount')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number')
    .toFloat(), // Convert to float
  body('investmentType')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Investment type must be less than 100 characters')
    .escape() // Escape HTML entities
];

router.get('/', investmentController.getInvestments);
router.get('/types', investmentController.getInvestmentTypes);
router.get('/:id', investmentController.getInvestment);
router.post('/', investmentValidation, investmentController.createInvestment);
router.put('/:id', investmentValidation, investmentController.updateInvestment);
router.delete('/selected', investmentController.deleteSelectedInvestments);
router.delete('/all', investmentController.deleteAllInvestments);
router.delete('/:id', investmentController.deleteInvestment);

module.exports = router;

