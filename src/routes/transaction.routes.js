const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const {
  getTransactions,
  getTransaction,
  getAllTransactions
} = require('../controllers/transactionController');

// User routes
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransaction);

// Admin routes
router.get('/admin/all', protect, isAdmin, getAllTransactions);

module.exports = router;