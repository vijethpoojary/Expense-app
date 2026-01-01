const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/', analyticsController.getAnalytics);
router.get('/monthly', analyticsController.getMonthlySummary);

module.exports = router;

