const express = require('express');
const router = express.Router();
const { getReports, generateReport, getReportById, getForecast } = require('../controllers/reportController');
const { getAnomalies, resolveAnomaly } = require('../controllers/anomalyController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getReports);
router.post('/generate', authorize('admin', 'editor'), generateReport);
router.get('/forecast', getForecast);
router.get('/anomalies', getAnomalies);
router.put('/anomalies/:id/resolve', resolveAnomaly);
router.get('/:id', getReportById);

module.exports = router;
