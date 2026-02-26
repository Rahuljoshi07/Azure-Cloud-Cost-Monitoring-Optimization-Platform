const express = require('express');
const router = express.Router();
const { getResources, getResourceById, getResourceTypes } = require('../controllers/resourceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getResources);
router.get('/types', getResourceTypes);
router.get('/:id', getResourceById);

module.exports = router;
