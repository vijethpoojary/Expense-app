const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const expenseController = require('../controllers/expenseController');

// Validation rules
const expenseValidation = [
  body('itemName').trim().notEmpty().withMessage('Item name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('sourceType').optional().isIn(['salary', 'other']).withMessage('Source type must be salary or other')
];

router.get('/', expenseController.getExpenses);
router.get('/categories', expenseController.getCategories);
router.get('/history', expenseController.getExpensesHistory);
router.get('/:id', expenseController.getExpense);
router.post('/', expenseValidation, expenseController.createExpense);
router.put('/:id', expenseValidation, expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;

