const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getDashboardSummary } = require('../controllers/dashboardController');

router.get('/summary', authenticate, getDashboardSummary);

module.exports = router;
