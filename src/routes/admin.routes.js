// mzeel-backend/src/routes/admin.routes.js

const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  getUserWallet,
  getPendingProfiles,
  getProfileDetails,
  getProfileByUserId,
  verifyProfile,
  rejectProfile,
  getPendingVerificationLoans,
  startLoanReview,
  getPendingDisbursementLoans
} = require('../controllers/adminController');
const {
  getAllLoans,
  getLoanDetails,
  approveLoan,
  rejectLoan,
  disburseLoan
} = require('../controllers/loanController');
const {
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require('../controllers/withdrawalController');

// ✅ ТҮР protect болон adminOnly-ийг энд шууд бичих
const protect = async (req, res, next) => {
  // Энэ хэсгийг одоогоор хоосон үлдээнэ
  next();
};

const adminOnly = (req, res, next) => {
  // Энэ хэсгийг одоогоор хоосон үлдээнэ
  next();
};

// Бүх route-ууд админ хандалттай
router.use(protect, adminOnly);

// ===== DASHBOARD =====
router.get('/dashboard', getDashboard);

// ===== USERS =====
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/users/:id/wallet', getUserWallet);

// ===== PROFILES =====
router.get('/profiles/pending', getPendingProfiles);
router.get('/profiles/:id', getProfileDetails);
router.get('/profiles/user/:userId', getProfileByUserId);
router.put('/profiles/:id/verify', verifyProfile);
router.put('/profiles/:id/reject', rejectProfile);

// ===== LOANS =====
router.get('/loans/pending-verification', getPendingVerificationLoans);
router.get('/loans/pending-disbursement', getPendingDisbursementLoans);
router.get('/loans/all', getAllLoans);
router.get('/loans/:id', getLoanDetails);
router.put('/loans/:id/start-review', startLoanReview);
router.put('/loans/:id/approve', approveLoan);
router.put('/loans/:id/reject', rejectLoan);
router.put('/loans/:id/disburse', disburseLoan);

// ===== WITHDRAWALS =====
router.get('/withdrawals/pending', getPendingWithdrawals);
router.put('/withdrawals/:id/approve', approveWithdrawal);
router.put('/withdrawals/:id/reject', rejectWithdrawal);

module.exports = router;