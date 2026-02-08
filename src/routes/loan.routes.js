const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { loanValidation } = require('../utils/validation');
const { loanLimiter } = require('../middlewares/rateLimit');
const {
  verifyLoan,
  requestLoan,
  requestApprovedLoan,
  getMyLoans,
  getLoanDetails,
  payLoan,
  getAllLoans,
  approveLoan,
  rejectLoan,
  approveLoanDisbursement
} = require('../controllers/loanController');

// User routes
router.post('/request-verification', protect);

router.post('/verify', protect, loanLimiter, verifyLoan);
router.post('/request', protect, loanValidation, validate, requestLoan);
router.post('/request-approved', protect, requestApprovedLoan);
router.get('/my-loans', protect, getMyLoans);
router.get('/:id', protect, getLoanDetails);
router.post('/:id/pay', protect, payLoan);

// Admin routes
router.get('/verification-pending', protect,);

router.get('/admin/all', protect, isAdmin, getAllLoans);
router.put('/:id/approve', protect, isAdmin, approveLoan);
router.put('/:id/approve-disbursement', protect, isAdmin, approveLoanDisbursement);
router.put('/:id/reject', protect, isAdmin, rejectLoan);

module.exports = router;