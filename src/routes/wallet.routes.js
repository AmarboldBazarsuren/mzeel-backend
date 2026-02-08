const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getWallet,
  createDeposit,
  checkPayment,
  getWalletHistory
} = require('../controllers/walletController');

router.get('/', protect, getWallet);
router.post('/deposit', protect, createDeposit);
router.post('/check-payment/:transactionId', protect, checkPayment);
router.get('/history', protect, getWalletHistory);

module.exports = router;