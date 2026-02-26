const express = require('express');
const router = express.Router();
const { getAlerts, markAlertRead, markAllAlertsRead, resolveAlert, getAlertStats } = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.put('/read-all', markAllAlertsRead);
router.put('/:id/read', markAlertRead);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
