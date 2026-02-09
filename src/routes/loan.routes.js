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
  approveLoanDisbursement,
  extendLoan, // ✅ ШИНЭ
  requestVerification,
  getPendingVerificationLoans,
  startLoanReview
} = require('../controllers/loanController');

// ===== USER ROUTES =====

// Зээлийн мэдээлэл шалгуулах хүсэлт үүсгэх
router.post('/request-verification', protect, requestVerification);

// Зээлийн баталгаажуулалт
router.post('/verify', protect, loanLimiter, verifyLoan);

// Зээл авах (хуучин систем)
router.post('/request', protect, loanValidation, validate, requestLoan);

// Зээл авах (шинэ систем - зөвшөөрсөн эрхээс)
router.post('/request-approved', protect, requestApprovedLoan);

// Миний зээлүүд
router.get('/my-loans', protect, getMyLoans);

// Зээлийн дэлгэрэнгүй
router.get('/:id', protect, getLoanDetails);

// Зээл төлөх
router.post('/:id/pay', protect, payLoan);

// ✅ ШИНЭ: Зээл сунгах
router.post('/:id/extend', protect, extendLoan);

// ===== ADMIN ROUTES =====

// Шалгуулах хүсэлтүүд
router.get('/verification-pending', protect, isAdmin, getPendingVerificationLoans);

// Шалгалт эхлүүлэх
router.put('/:id/start-review', protect, isAdmin, startLoanReview);

// Бүх зээл
router.get('/admin/all', protect, isAdmin, getAllLoans);

// Зээл зөвшөөрөх
router.put('/:id/approve', protect, isAdmin, approveLoan);

// Зээл олгохыг зөвшөөрөх
router.put('/:id/approve-disbursement', protect, isAdmin, approveLoanDisbursement);

// Зээл татгалзах
router.put('/:id/reject', protect, isAdmin, rejectLoan);

module.exports = router;