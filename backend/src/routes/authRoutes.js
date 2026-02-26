const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, getUsers } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, loginSchema, registerSchema } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/users', authenticate, authorize('admin'), getUsers);

module.exports = router;
