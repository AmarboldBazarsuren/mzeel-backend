const Transaction = require('../models/Transaction');
const { successResponse, errorResponse } = require('../utils/helpers');

// @desc    Бүх гүйлгээ авах
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('loan', 'loanNumber status')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    successResponse(res, 200, 'Гүйлгээний түүх', {
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

// @desc    Нэг гүйлгээ авах
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'firstName lastName phone email')
      .populate('wallet')
      .populate('loan');

    if (!transaction) {
      return errorResponse(res, 404, 'Гүйлгээ олдсонгүй');
    }

    // Зөвхөн өөрийн гүйлгээг харах
    if (transaction.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Эрх хүрэхгүй байна');
    }

    successResponse(res, 200, 'Гүйлгээний мэдээлэл', { transaction });

  } catch (error) {
    next(error);
  }
};

// @desc    Бүх гүйлгээ (Admin)
// @route   GET /api/transactions/admin/all
// @access  Private/Admin
exports.getAllTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName phone email')
      .populate('wallet')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Статистик
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    successResponse(res, 200, 'Бүх гүйлгээ', {
      transactions,
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