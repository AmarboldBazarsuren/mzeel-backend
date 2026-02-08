const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Token шалгах
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Header-с token авах
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Token байхгүй бол
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Нэвтрэх шаардлагатай. Token байхгүй байна.'
      });
    }

    // Token баталгаажуулах
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Хэрэглэгч олох
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    // Идэвхгүй хэрэглэгч
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Таны эрх хаагдсан байна. Админтай холбогдоно уу.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token буруу эсвэл хугацаа дууссан',
      error: error.message
    });
  }
};
// Одоо байгаа protect функцийн дараа нэмэх

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Зөвхөн админ хандах эрхтэй'
    });
  }
};
// Role шалгах
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `${req.user.role} хэрэглэгч энэ үйлдлийг хийх эрхгүй`
      });
    }
    next();
  };
};

// Admin эсэхийг шалгах
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'operator') {
    return res.status(403).json({
      success: false,
      message: 'Зөвхөн админ болон оператор хандах боломжтой'
    });
  }
  next();
};