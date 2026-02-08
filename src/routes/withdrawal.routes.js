const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { withdrawalValidation } = require('../utils/validation');
const {
  createWithdrawal,
  getMyWithdrawals,
  getWithdrawal,
  cancelWithdrawal,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/withdrawalController');

// User routes
router.post('/', protect, withdrawalValidation, validate, createWithdrawal);
router.get('/', protect, getMyWithdrawals);
router.get('/:id', protect, getWithdrawal);
router.delete('/:id', protect, cancelWithdrawal);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllWithdrawals);
router.put('/:id/approve', protect, isAdmin, approveWithdrawal);
router.put('/:id/reject', protect, isAdmin, rejectWithdrawal);

module.exports = router;