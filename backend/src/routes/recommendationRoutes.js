const express = require('express');
const router = express.Router();
const { getRecommendations, updateRecommendationStatus, getRecommendationSummary } = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getRecommendations);
router.get('/summary', getRecommendationSummary);
router.put('/:id/status', updateRecommendationStatus);

module.exports = router;
