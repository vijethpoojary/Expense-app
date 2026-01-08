const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const expenseController = require('../controllers/expenseController');

// Validation and sanitization rules
const expenseValidation = [
  body('itemName')
    .trim()
    .notEmpty().withMessage('Item name is required')
    .isLength({ max: 200 }).withMessage('Item name must be less than 200 characters')
    .escape(), // Escape HTML entities
  body('amount')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number')
    .toFloat(), // Convert to float
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters')
    .escape(), // Escape HTML entities
  body('sourceType')
    .optional()
    .isIn(['salary', 'other']).withMessage('Source type must be salary or other')
];

router.get('/', expenseController.getExpenses);
router.get('/categories', expenseController.getCategories);
router.get('/history', expenseController.getExpensesHistory);
router.get('/:id', expenseController.getExpense);
router.post('/', expenseValidation, expenseController.createExpense);
router.put('/:id', expenseValidation, expenseController.updateExpense);
router.delete('/selected', expenseController.deleteSelectedExpenses);
router.delete('/all', expenseController.deleteAllExpenses);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

