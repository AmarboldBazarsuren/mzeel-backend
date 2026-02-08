const Withdrawal = require('../models/Withdrawal');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

// @desc    Мөнгө татах хүсэлт илгээх
// @route   POST /api/withdrawals
// @access  Private
exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankName, accountNumber, accountName } = req.body;
    const userId = req.user.id;

    // Хэтэвч шалгах
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet.hasBalance(amount)) {
      return errorResponse(res, 400, 'Хэтэвчний үлдэгдэл хүрэлцэхгүй байна');
    }

    // Татах хүсэлт үүсгэх
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount,
      fee: 0, // Төлбөргүй
      totalAmount: amount,
      bankName,
      accountNumber,
      accountName,
      status: 'pending'
    });

    // Хэтэвчээс мөнгө хасах (temporary hold)
    wallet.deductBalance(amount);
    await wallet.save();

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: 'withdrawal',
      amount,
      balanceBefore: wallet.balance + amount,
      balanceAfter: wallet.balance,
      status: 'pending',
      description: 'Мөнгө татах хүсэлт',
      withdrawalRequest: withdrawal._id
    });

    withdrawal.transaction = transaction._id;
    await withdrawal.save();

    logger.info(`Татах хүсэлт үүсгэгдлээ: ${withdrawal._id}, Amount: ${amount}`);

    successResponse(res, 201, 'Татах хүсэлт амжилттай илгээгдлээ', { 
      withdrawal,
      transaction 
    });

  } catch (error) {
    logger.error(`Withdrawal error: ${error.message}`);
    next(error);
  }
};

// @desc    Миний татах хүсэлтүүд
// @route   GET /api/withdrawals
// @access  Private
exports.getMyWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query)
      .populate('transaction')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    successResponse(res, 200, 'Миний татах хүсэлтүүд', {
      withdrawals,
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

// @desc    Татах хүсэлтийн дэлгэрэнгүй
// @route   GET /api/withdrawals/:id
// @access  Private
exports.getWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate('user', 'firstName lastName phone email')
      .populate('transaction')
      .populate('processedBy', 'firstName lastName');

    if (!withdrawal) {
      return errorResponse(res, 404, 'Татах хүсэлт олдсонгүй');
    }

    if (withdrawal.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Эрх хүрэхгүй байна');
    }

    successResponse(res, 200, 'Татах хүсэлтийн дэлгэрэнгүй', { withdrawal });

  } catch (error) {
    next(error);
  }
};

// @desc    Татах хүсэлт цуцлах
// @route   DELETE /api/withdrawals/:id
// @access  Private
exports.cancelWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return errorResponse(res, 404, 'Татах хүсэлт олдсонгүй');
    }

    if (withdrawal.user.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Эрх хүрэхгүй байна');
    }

    if (withdrawal.status !== 'pending') {
      return errorResponse(res, 400, 'Зөвхөн pending төлөвтэй хүсэлтийг цуцлах боломжтой');
    }

    // Мөнгийг буцааж хэтэвчинд нэмэх
    const wallet = await Wallet.findOne({ user: req.user.id });
    wallet.addBalance(withdrawal.totalAmount);
    await wallet.save();

    // Transaction шинэчлэх
    const transaction = await Transaction.findById(withdrawal.transaction);
    transaction.status = 'cancelled';
    await transaction.save();

    // Withdrawal шинэчлэх
    withdrawal.status = 'cancelled';
    await withdrawal.save();

    logger.info(`Татах хүсэлт цуцлагдлаа: ${withdrawal._id}`);

    successResponse(res, 200, 'Татах хүсэлт цуцлагдлаа', { withdrawal });

  } catch (error) {
    next(error);
  }
};

// @desc    Бүх татах хүсэлтүүд (Admin)
// @route   GET /api/withdrawals/admin/all
// @access  Private/Admin
exports.getAllWithdrawals = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const total = await Withdrawal.countDocuments(query);
    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'firstName lastName phone email')
      .populate('processedBy', 'firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Статистик
    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    successResponse(res, 200, 'Бүх татах хүсэлтүүд', {
      withdrawals,
      stats,
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

// @desc    Татах хүсэлт зөвшөөрөх (Admin)
// @route   PUT /api/withdrawals/:id/approve
// @access  Private/Admin
exports.approveWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return errorResponse(res, 404, 'Татах хүсэлт олдсонгүй');
    }

    if (withdrawal.status !== 'pending') {
      return errorResponse(res, 400, 'Зөвхөн pending төлөвтэй хүсэлтийг зөвшөөрөх боломжтой');
    }

    withdrawal.status = 'completed';
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    withdrawal.adminNotes = req.body.notes || '';
    await withdrawal.save();

    // Transaction шинэчлэх
    const transaction = await Transaction.findById(withdrawal.transaction);
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    await transaction.save();

    logger.info(`Татах хүсэлт зөвшөөрөгдлөө: ${withdrawal._id} by ${req.user.email}`);

    successResponse(res, 200, 'Татах хүсэлт амжилттай зөвшөөрөгдлөө', { withdrawal });

  } catch (error) {
    next(error);
  }
};

// @desc    Татах хүсэлт татгалзах (Admin)
// @route   PUT /api/withdrawals/:id/reject
// @access  Private/Admin
exports.rejectWithdrawal = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return errorResponse(res, 404, 'Татах хүсэлт олдсонгүй');
    }

    if (withdrawal.status !== 'pending') {
      return errorResponse(res, 400, 'Зөвхөн pending төлөвтэй хүсэлтийг татгалзах боломжтой');
    }

    // Мөнгийг буцааж хэтэвчинд нэмэх
    const wallet = await Wallet.findOne({ user: withdrawal.user });
    wallet.addBalance(withdrawal.totalAmount);
    await wallet.save();

    // Transaction шинэчлэх
    const transaction = await Transaction.findById(withdrawal.transaction);
    transaction.status = 'failed';
    transaction.failedReason = reason;
    await transaction.save();

    // Withdrawal шинэчлэх
    withdrawal.status = 'failed';
    withdrawal.failureReason = reason;
    withdrawal.processedBy = req.user.id;
    withdrawal.processedAt = new Date();
    await withdrawal.save();

    logger.info(`Татах хүсэлт татгалзагдлаа: ${withdrawal._id} by ${req.user.email}`);

    successResponse(res, 200, 'Татах хүсэлт татгалзагдлаа', { withdrawal });

  } catch (error) {
    next(error);
  }
};