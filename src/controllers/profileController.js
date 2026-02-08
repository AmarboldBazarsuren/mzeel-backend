const Profile = require('../models/Profile');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Хувийн мэдээлэл үүсгэх/шинэчлэх
// @route   POST /api/profile
// @access  Private
exports.createOrUpdateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Profile байгаа эсэх шалгах
    let profile = await Profile.findOne({ user: userId });

    if (profile) {
      // Profile байвал алдаа буцаах (шинэчлэх боломжгүй)
      return errorResponse(res, 400, 'Хувийн мэдээллийг шинэчлэх боломжгүй');
    }

    // Шинэ profile үүсгэх
    profile = await Profile.create({
      user: userId,
      ...req.body
    });

    await profile.populate('user', 'firstName lastName email phone');

    logger.info(`Profile үүсгэгдлээ: User ${userId}`);

    successResponse(res, 201, 'Хувийн мэдээлэл амжилттай хадгалагдлаа', { profile });

  } catch (error) {
    logger.error(`Profile create error: ${error.message}`);
    next(error);
  }
};

// @desc    Хувийн мэдээлэл харах
// @route   GET /api/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'firstName lastName email phone')
      .populate('verifiedBy', 'firstName lastName');

    if (!profile) {
      return errorResponse(res, 404, 'Хувийн мэдээлэл олдсонгүй. Эхлээд бөглөнө үү.');
    }

    successResponse(res, 200, 'Хувийн мэдээлэл', { profile });

  } catch (error) {
    next(error);
  }
};

// @desc    Бүх profile-үүдийг авах (Admin)
// @route   GET /api/profile/all
// @access  Private/Admin
exports.getAllProfiles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Profile.countDocuments();
    const profiles = await Profile.find()
      .populate('user', 'firstName lastName email phone')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    successResponse(res, 200, 'Бүх profile', {
      profiles,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Profile баталгаажуулах (Admin)
// @route   PUT /api/profile/:id/verify
// @access  Private/Admin
exports.verifyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return errorResponse(res, 404, 'Profile олдсонгүй');
    }

    profile.isVerified = true;
    profile.verifiedAt = new Date();
    profile.verifiedBy = req.user.id;
    await profile.save();

    logger.info(`Profile баталгаажлаа: ${profile._id} by ${req.user.email}`);

    successResponse(res, 200, 'Profile амжилттай баталгаажлаа', { profile });

  } catch (error) {
    next(error);
  }
};