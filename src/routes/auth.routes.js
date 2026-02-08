const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { registerValidation, loginValidation } = require('../utils/validation');
const { authLimiter } = require('../middlewares/rateLimit');
const {
  register,
  login,
  getMe,
  changePassword,
  logout
} = require('../controllers/authController');

// Public routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;