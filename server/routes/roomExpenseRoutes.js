const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const roomExpenseController = require('../controllers/roomExpenseController');

// Validation and sanitization rules
const createExpenseValidation = [
  body('roomId')
    .notEmpty().withMessage('Room ID is required')
    .custom((value) => {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid room ID format');
      }
      return true;
    }),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
    .escape(), // Escape HTML entities
  body('totalAmount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number')
    .toFloat(), // Convert to float
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Category must be less than 100 characters')
    .escape() // Escape HTML entities
];

router.post('/', createExpenseValidation, roomExpenseController.createRoomExpense);

// Specific routes with /reset, /analytics, etc. must come before generic /:roomId and /:id routes
router.delete('/:roomId/reset', roomExpenseController.resetRoomExpenses);
router.get('/:roomId/analytics', roomExpenseController.getRoomAnalytics);
router.get('/:roomId/debt-breakdown', roomExpenseController.getDebtBreakdown);
router.get('/:roomId/history', roomExpenseController.getRoomExpenseHistory);
router.get('/:roomId', roomExpenseController.getRoomExpenses);

// Routes with /status and /partial-payment must come before generic /:id route
router.put('/:id/status', roomExpenseController.updatePaymentStatus);
router.put('/:id/partial-payment', roomExpenseController.updatePartialPayment);
router.delete('/:id', roomExpenseController.deleteRoomExpense);

module.exports = router;

