const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const roomExpenseController = require('../controllers/roomExpenseController');

// Validation rules
const createExpenseValidation = [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
];

router.post('/', createExpenseValidation, roomExpenseController.createRoomExpense);
router.get('/:roomId/analytics', roomExpenseController.getRoomAnalytics);
router.get('/:roomId', roomExpenseController.getRoomExpenses);
router.put('/:id/status', roomExpenseController.updatePaymentStatus);

module.exports = router;

