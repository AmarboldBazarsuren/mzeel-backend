const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const {
  getDashboard,
  getAllUsers,
  getUserDetails,
  toggleUserStatus,
  getUserWallet,
  // ✅ ШИНЭ: Profile
  getPendingProfiles,
  getProfileDetails,
  verifyProfile,
  rejectProfile,
  // ✅ ШИНЭ: Loan verification
  getPendingVerificationLoans,
  startLoanReview,
} = require('../controllers/adminController');

router.use(protect, isAdmin); // Бүх route-д admin шаардлагатай

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/users/:id/wallet', getUserWallet);

// ✅ ШИНЭ: Profile баталгаажуулалт
router.get('/profiles/pending', getPendingProfiles);
router.get('/profiles/:id', getProfileDetails);
router.put('/profiles/:id/verify', verifyProfile);
router.put('/profiles/:id/reject', rejectProfile);

// ✅ ШИНЭ: Зээлийн мэдээлэл шалгуулах хүсэлтүүд
router.get('/loans/pending-verification', getPendingVerificationLoans);
router.put('/loans/:id/start-review', startLoanReview);








module.exports = router;