const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const {
  getDashboard,
  getAllUsers,
  getUserDetails,
  toggleUserStatus
} = require('../controllers/adminController');

router.use(protect, isAdmin); // Бүх route-д admin шаардлагатай

router.get('/dashboard', getDashboard);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;