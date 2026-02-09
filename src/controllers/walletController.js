const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/helpers');
const qpayService = require('../services/qpayService');
const logger = require('../utils/logger');

// @desc    Хэтэвчийн мэдээлэл авах
// @route   GET /api/wallet
// @access  Private
exports.getWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.json({
        success: true,
        data: {
          wallet: {
            user: req.user._id,
            balance: 0,
            totalDeposit: 0,
            totalSpent: 0,
          },
        },
      });
    }

    // ✅ ШИНЭ: Зөвхөн deposit transaction-уудын нийлбэр
    const Transaction = require('../models/Transaction');
    const depositTransactions = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'deposit',
          status: 'completed',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    const actualTotalDeposit = depositTransactions.length > 0 
      ? depositTransactions[0].total 
      : 0;

    res.json({
      success: true,
      data: { 
        wallet: {
          ...wallet.toObject(),
          totalDeposit: actualTotalDeposit, // ✅ Зөвхөн deposit
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
// @desc    QPay invoice үүсгэх (Deposit)
// @route   POST /api/wallet/deposit
// @access  Private
exports.createDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 1000) {
      return errorResponse(res, 400, 'Хамгийн багадаа 1,000₮ цэнэглэх боломжтой');
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    // QPay invoice үүсгэх
    const invoice = await qpayService.createInvoice(amount, req.user.id);

    if (!invoice.success) {
      return errorResponse(res, 500, 'Invoice үүсгэхэд алдаа гарлаа');
    }

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      type: 'deposit',
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance, // Төлөгдөөгүй учраас өөрчлөхгүй
      status: 'pending',
      description: 'Хэтэвч цэнэглэх (QPay)',
      qpayInvoiceId: invoice.invoice_id,
      qpayQrCode: invoice.qr_image,
      qpayDeeplink: invoice.deeplink,
      qpayExpireAt: new Date(Date.now() + 30 * 60 * 1000) // 30 минут
    });

    logger.info(`Deposit invoice үүсгэгдлээ: ${transaction._id}`);

    successResponse(res, 201, 'QPay invoice үүсгэгдлээ', {
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        qrCode: transaction.qpayQrCode,
        deeplink: transaction.qpayDeeplink,
        expireAt: transaction.qpayExpireAt
      }
    });

  } catch (error) {
    logger.error(`Deposit error: ${error.message}`);
    next(error);
  }
};

// @desc    QPay payment шалгах (Webhook эсвэл manual check)
// @route   POST /api/wallet/check-payment/:transactionId
// @access  Private
exports.checkPayment = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.transactionId);

    if (!transaction) {
      return errorResponse(res, 404, 'Гүйлгээ олдсонгүй');
    }

    if (transaction.user.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Эрх хүрэхгүй байна');
    }

    if (transaction.status === 'completed') {
      return successResponse(res, 200, 'Төлбөр аль хэдийн төлөгдсөн', { transaction });
    }

    // QPay payment шалгах
    const paymentStatus = await qpayService.checkPayment(transaction.qpayInvoiceId);

    if (paymentStatus.paid) {
      // Хэтэвчинд мөнгө нэмэх
      const wallet = await Wallet.findById(transaction.wallet);
      wallet.addBalance(transaction.amount);
      await wallet.save();

      // Transaction шинэчлэх
      transaction.status = 'completed';
      transaction.balanceAfter = wallet.balance;
      transaction.processedAt = new Date();
      await transaction.save();

      logger.info(`Deposit амжилттай: ${transaction._id}, Amount: ${transaction.amount}`);

      return successResponse(res, 200, 'Төлбөр амжилттай төлөгдлөө', { 
        transaction,
        wallet 
      });
    }

    successResponse(res, 200, 'Төлбөр хүлээгдэж байна', { transaction });

  } catch (error) {
    next(error);
  }
};

// @desc    Хэтэвчний түүх
// @route   GET /api/wallet/history
// @access  Private
exports.getWalletHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ user: req.user.id });

    const total = await Transaction.countDocuments({ wallet: wallet._id });
    const transactions = await Transaction.find({ wallet: wallet._id })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    successResponse(res, 200, 'Хэтэвчний түүх', {
      wallet,
      transactions,
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