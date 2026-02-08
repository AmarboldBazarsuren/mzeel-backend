// Backend: src/controllers/adminController.js

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Profile = require('../models/Profile');
const { successResponse, errorResponse } = require('../utils/helpers');

// @desc    Dashboard статистик
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboard = async (req, res, next) => {
  try {
    // Хэрэглэгчдийн тоо
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    // Зээлийн статистик
    const totalLoans = await Loan.countDocuments();
    const pendingLoans = await Loan.countDocuments({ status: 'pending_verification' });
    const activeLoans = await Loan.countDocuments({ status: { $in: ['disbursed', 'active'] } });
    const overdueLoans = await Loan.countDocuments({ status: 'overdue' });

    // Мөнгөн статистик
    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalDisbursed: { $sum: '$disbursedAmount' },
          totalRepayment: { $sum: '$totalRepayment' },
          totalPaid: { $sum: '$paidAmount' }
        }
      }
    ]);

    // Татах хүсэлт
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    const withdrawalStats = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);

    // Хэтэвчийн нийт үлдэгдэл
    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: '$balance' },
          totalDeposit: { $sum: '$totalDeposit' },
          totalWithdrawal: { $sum: '$totalWithdrawal' }
        }
      }
    ]);

    // Сүүлийн 7 хоногийн гүйлгээ
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTransactions = await Transaction.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    successResponse(res, 200, 'Dashboard статистик', {
      users: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers
      },
      loans: {
        total: totalLoans,
        pending: pendingLoans,
        active: activeLoans,
        overdue: overdueLoans,
        disbursed: loanStats[0]?.totalDisbursed || 0,
        repayment: loanStats[0]?.totalRepayment || 0,
        paid: loanStats[0]?.totalPaid || 0
      },
      withdrawals: {
        pending: pendingWithdrawals,
        pendingAmount: withdrawalStats[0]?.totalAmount || 0
      },
      wallets: {
        totalBalance: walletStats[0]?.totalBalance || 0,
        totalDeposit: walletStats[0]?.totalDeposit || 0,
        totalWithdrawal: walletStats[0]?.totalWithdrawal || 0
      },
      recentActivity: recentTransactions
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Бүх хэрэглэгчид
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: 'i' } },
        { lastName: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    successResponse(res, 200, 'Бүх хэрэглэгчид', {
      users,
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

// @desc    Хэрэглэгч идэвхгүй болгох/идэвхжүүлэх
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 404, 'Хэрэглэгч олдсонгүй');
    }

    user.isActive = !user.isActive;
    await user.save();

    successResponse(res, 200, `Хэрэглэгч ${user.isActive ? 'идэвхжүүллээ' : 'идэвхгүй боллоо'}`, { user });

  } catch (error) {
    next(error);
  }
};

// @desc    Хэрэглэгчийн дэлгэрэнгүй
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return errorResponse(res, 404, 'Хэрэглэгч олдсонгүй');
    }

    const wallet = await Wallet.findOne({ user: user._id });
    const loans = await Loan.find({ user: user._id }).sort('-createdAt').limit(5);
    const transactions = await Transaction.find({ user: user._id }).sort('-createdAt').limit(10);

    successResponse(res, 200, 'Хэрэглэгчийн дэлгэрэнгүй', {
      user,
      wallet,
      loans,
      transactions
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Хэрэглэгчийн хэтэвчний мэдээлэл авах
// @route   GET /api/admin/users/:id/wallet
// @access  Private/Admin
exports.getUserWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.id });

    if (!wallet) {
      return errorResponse(res, 404, 'Хэтэвч олдсонгүй');
    }

    successResponse(res, 200, 'Хэтэвчний мэдээлэл', { wallet });

  } catch (error) {
    next(error);
  }
};

// ✅ ШИНЭ: Баталгаажуулалт хүлээгдэж буй profile-үүд
// @route   GET /api/admin/profiles/pending
// @access  Private/Admin
exports.getPendingProfiles = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const profiles = await Profile.find({ 
      isVerified: false,
      verificationStatus: { $ne: 'rejected' } // Татгалзагдсан profile-үүдийг харуулахгүй
    })
      .populate('user', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Profile.countDocuments({ 
      isVerified: false,
      verificationStatus: { $ne: 'rejected' }
    });

    successResponse(res, 200, 'Амжилттай', {
      profiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

// ✅ ШИНЭ: Profile дэлгэрэнгүй + зургууд
// @route   GET /api/admin/profiles/:id
// @access  Private/Admin
exports.getProfileDetails = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'firstName lastName email phone');

    if (!profile) {
      return errorResponse(res, 404, 'Profile олдсонгүй');
    }

    successResponse(res, 200, 'Амжилттай', { profile });

  } catch (error) {
    next(error);
  }
};

// ✅ ЗАСВАРЛАСАН: Profile баталгаажуулах - req.body хоосон байсныг засав
// @route   PUT /api/admin/profiles/:id/verify
// @access  Private/Admin
exports.verifyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return errorResponse(res, 404, 'Profile олдсонгүй');
    }

    if (profile.isVerified) {
      return errorResponse(res, 400, 'Profile аль хэдийн баталгаажсан байна');
    }

    // ✅ Profile баталгаажуулах
    profile.isVerified = true;
    profile.verifiedAt = new Date();
    profile.verifiedBy = req.user.id;
    profile.verificationStatus = 'approved';
    await profile.save();

    successResponse(res, 200, 'Profile амжилттай баталгаажлаа', { profile });

  } catch (error) {
    next(error);
  }
};

// ✅ Profile татгалзах
// @route   PUT /api/admin/profiles/:id/reject
// @access  Private/Admin
exports.rejectProfile = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return errorResponse(res, 400, 'Татгалзах шалтгаанаа бичнэ үү');
    }

    const profile = await Profile.findById(req.params.id);

    if (!profile) {
      return errorResponse(res, 404, 'Profile олдсонгүй');
    }

    // Profile татгалзах
    profile.isVerified = false;
    profile.verificationStatus = 'rejected';
    profile.rejectedAt = new Date();
    profile.rejectedBy = req.user.id;
    profile.rejectionReason = reason;
    await profile.save();

    successResponse(res, 200, 'Profile татгалзагдлаа');

  } catch (error) {
    next(error);
  }
};

// ✅ ШИНЭ: Зээлийн мэдээлэл шалгуулах хүсэлтүүд (3000₮ төлсөн)
// @route   GET /api/admin/loans/pending-verification
// @access  Private/Admin
exports.getPendingVerificationLoans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Loan.countDocuments({ status: 'pending_verification' });
    const loans = await Loan.find({ status: 'pending_verification' })
      .populate('user', 'firstName lastName phone email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    successResponse(res, 200, 'Зээлийн мэдээлэл шалгуулах хүсэлтүүд', {
      loans,
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

// ✅ ШИНЭ: Зээлийг "under_review" төлөвт шилжүүлэх
// @route   PUT /api/admin/loans/:id/start-review
// @access  Private/Admin
exports.startLoanReview = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return errorResponse(res, 404, 'Зээл олдсонгүй');
    }

    if (loan.status !== 'pending_verification') {
      return errorResponse(res, 400, 'Зөвхөн "pending_verification" төлөвтэй зээлийг шалгаж эхэлж болно');
    }

    loan.status = 'under_review';
    await loan.save();

    successResponse(res, 200, 'Зээлийн шалгалт эхэллээ', { loan });

  } catch (error) {
    next(error);
  }
};