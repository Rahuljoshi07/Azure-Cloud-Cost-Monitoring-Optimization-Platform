const express = require('express');
const router = express.Router();
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, budgetSchema } = require('../middleware/validation');

router.use(authenticate);

router.get('/', getBudgets);
router.post('/', authorize('admin', 'editor'), validate(budgetSchema), createBudget);
router.put('/:id', authorize('admin', 'editor'), updateBudget);
router.delete('/:id', authorize('admin'), deleteBudget);

module.exports = router;
