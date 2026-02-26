const express = require('express');
const router = express.Router();
const { getCostOverview, getCostBySubscription, getTopExpensiveResources, getCostByTags, getDailyCosts } = require('../controllers/costController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/overview', getCostOverview);
router.get('/by-subscription', getCostBySubscription);
router.get('/top-resources', getTopExpensiveResources);
router.get('/by-tags', getCostByTags);
router.get('/daily', getDailyCosts);

module.exports = router;
