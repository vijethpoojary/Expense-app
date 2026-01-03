const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const investmentController = require('../controllers/investmentController');

// Validation rules
const investmentValidation = [
  body('investmentName').trim().notEmpty().withMessage('Investment name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
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

