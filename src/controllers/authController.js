const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// JWT Token үүсгэх
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Бүртгүүлэх
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { phone, email, password, firstName, lastName } = req.body;

    // Хэрэглэгч байгаа эсэх шалгах
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    
    if (existingUser) {
      return errorResponse(res, 400, 'Энэ утас эсвэл email аль хэдийн бүртгэлтэй байна');
    }

    // Хэрэглэгч үүсгэх
    const user = await User.create({
      phone,
      email,
      password,
      firstName,
      lastName
    });

    // Хэтэвч үүсгэх
    await Wallet.create({ user: user._id });

    // Token үүсгэх
    const token = generateToken(user._id);

    logger.info(`Шинэ хэрэглэгч бүртгэгдлээ: ${user.email}`);

    successResponse(res, 201, 'Амжилттай бүртгэгдлээ', {
      token,
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });

  } catch (error) {
    logger.error(`Register error: ${error.message}`);
    next(error);
  }
};

// @desc    Нэвтрэх
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    // Хэрэглэгч олох (password-тай хамт)
    const user = await User.findOne({ phone }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Утасны дугаар эсвэл нууц үг буруу');
    }

    // Нууц үг шалгах
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return errorResponse(res, 401, 'Утасны дугаар эсвэл нууц үг буруу');
    }

    // Идэвхгүй хэрэглэгч
    if (!user.isActive) {
      return errorResponse(res, 403, 'Таны эрх хаагдсан байна');
    }

    // Сүүлд нэвтэрсэн огноо шинэчлэх
    user.lastLogin = new Date();
    await user.save();

    // Token үүсгэх
    const token = generateToken(user._id);

    logger.info(`Хэрэглэгч нэвтэрлээ: ${user.email}`);

    successResponse(res, 200, 'Амжилттай нэвтэрлээ', {
      token,
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

// @desc    Одоогийн хэрэглэгчийн мэдээлэл авах
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    successResponse(res, 200, 'Хэрэглэгчийн мэдээлэл', {
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Нууц үг солих
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Одоогийн нууц үг шалгах
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return errorResponse(res, 401, 'Одоогийн нууц үг буруу байна');
    }

    // Шинэ нууц үг тохируулах
    user.password = newPassword;
    await user.save();

    logger.info(`Нууц үг солигдлоо: ${user.email}`);

    successResponse(res, 200, 'Нууц үг амжилттай солигдлоо');

  } catch (error) {
    next(error);
  }
};

// @desc    Гарах
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Client талд token устгана
    successResponse(res, 200, 'Амжилттай гарлаа');
  } catch (error) {
    next(error);
  }
};