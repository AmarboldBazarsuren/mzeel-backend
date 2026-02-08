const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { profileValidation } = require('../utils/validation');
const {
  createOrUpdateProfile,
  getProfile,
  getAllProfiles,
  verifyProfile
} = require('../controllers/profileController');

// User routes
router.post('/', protect, profileValidation, validate, createOrUpdateProfile);
router.get('/', protect, getProfile);

// Admin routes
router.get('/all', protect, isAdmin, getAllProfiles);
router.put('/:id/verify', protect, isAdmin, verifyProfile);

module.exports = router;