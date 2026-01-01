const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const salaryController = require('../controllers/salaryController');

// Validation rules
const salaryValidation = [
  body('monthlySalary').isFloat({ min: 0 }).withMessage('Monthly salary must be a positive number')
];

router.get('/', salaryController.getSalary);
router.get('/stats', salaryController.getSalaryStats);
router.post('/', salaryValidation, salaryController.updateSalary);
router.post('/reset', salaryController.resetAll);

module.exports = router;

