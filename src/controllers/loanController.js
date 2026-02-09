const Loan = require('../models/Loan');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Profile = require('../models/Profile');
const { successResponse, errorResponse, generateLoanNumber } = require('../utils/helpers');
const logger = require('../utils/logger');

// ===== ХҮҮ ТООЦОХ ФУНКЦҮҮД =====

// Зээлийн хүү тооцох функц
const calculateInterestRate = (termDays) => {
  if (termDays === 14) {
    return 2.8; // 14 хоног - 2.8%
  } else if (termDays === 30) {
    return 3.2; // 1 сар - 3.2%
  } else if (termDays === 90) {
    return 3.8; // 3 сар - 3.8%
  }
  return 3.2; // Default 1 сар
};

// Нийт төлөх дүн тооцох функц
const calculateTotalAmount = (principal, termDays) => {
  const interestRate = calculateInterestRate(termDays);
  const interest = Math.round(principal * (interestRate / 100));
  return {
    principal,
    interestRate,
    interest,
    totalAmount: principal + interest,
  };
};

// Хугацаа тооцох функц
const calculateDueDate = (startDate, termDays) => {
  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + termDays);
  return dueDate;
};

// @desc    Зээлийн мэдээлэл баталгаажуулах (3000₮ төлөх)
// @route   POST /api/loans/verify
// @access  Private
exports.verifyLoan = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const verificationFee = parseInt(process.env.VERIFICATION_FEE) || 3000;

    // Profile шалгах
    const profile = await Profile.findOne({ user: userId });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Эхлээд хувийн мэдээллээ бөглөнө үү'
      });
    }

    if (!profile.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Хувийн мэдээлэл баталгаажаагүй байна. Админ баталгаажуулах хүртэл хүлээнэ үү.'
      });
    }

    // Идэвхтэй зээл байгаа эсэх шалгах
    const activeLoans = await Loan.find({
      user: userId,
      status: { $in: ['pending_verification', 'under_review', 'approved', 'disbursed', 'active', 'overdue'] }
    });

    if (activeLoans.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Та идэвхтэй зээлтэй байна. Эхлээд төлөх шаардлагатай.'
      });
    }

    // Хэтэвч шалгах
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || !wallet.hasBalance(verificationFee)) {
      return res.status(400).json({
        success: false,
        message: `Хэтэвчний үлдэгдэл хүрэлцэхгүй байна. ${verificationFee}₮ цэнэглэнэ үү.`
      });
    }

    // Баталгаажуулалтын төлбөр төлөх
    wallet.deductBalance(verificationFee);
    await wallet.save();

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: 'verification_fee',
      amount: verificationFee,
      balanceBefore: wallet.balance + verificationFee,
      balanceAfter: wallet.balance,
      status: 'completed',
      description: 'Зээлийн мэдээлэл баталгаажуулах төлбөр',
      processedAt: new Date()
    });

    // Зээлийн хүсэлт үүсгэх
    const loan = await Loan.create({
      user: userId,
      requestedAmount: 0,
      verificationFee,
      verificationPaid: true,
      verificationPaidAt: new Date(),
      verificationTransaction: transaction._id,
      status: 'pending_verification',
      term: 30,
      interestRate: 5
    });

    console.log(`✅ Verification fee төлөгдлөө: User ${userId}, Loan ${loan._id}`);

    return res.status(201).json({
      success: true,
      message: 'Баталгаажуулалтын төлбөр амжилттай төлөгдлөө. Таны зээлийн мэдээллийг шалгаж байна.',
      data: {
        loan: {
          id: loan._id,
          loanNumber: loan.loanNumber,
          status: loan.status,
          verificationPaid: loan.verificationPaid,
          verificationPaidAt: loan.verificationPaidAt
        },
        transaction
      }
    });

  } catch (error) {
    console.error(`❌ Verification error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Зээлийн мэдээлэл баталгаажуулахад алдаа гарлаа'
    });
  }
};

// @desc    Зээл авах (approved болсны дараа)
// @route   POST /api/loans/request
// @access  Private
exports.requestLoan = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Зээлийн хүсэлт олох
    const loan = await Loan.findOne({
      user: userId,
      status: 'approved'
    });

    if (!loan) {
      return res.status(400).json({
        success: false,
        message: 'Зөвшөөрөгдсөн зээл олдсонгүй. Эхлээд баталгаажуулалт хийнэ үү.'
      });
    }

    // Дүн шалгах
    if (amount < 10000 || amount > loan.approvedAmount) {
      return res.status(400).json({
        success: false,
        message: `Зээлийн дүн 10,000₮ - ${loan.approvedAmount}₮ хооронд байх ёстой`
      });
    }

    // Хэтэвч авах
    const wallet = await Wallet.findOne({ user: userId });

    // Зээл олгох
    loan.disbursedAmount = amount;
    loan.totalRepayment = Math.round(amount * (1 + loan.interestRate / 100));
    loan.remainingAmount = loan.totalRepayment;
    loan.dueDate = new Date(Date.now() + loan.term * 24 * 60 * 60 * 1000);
    loan.status = 'disbursed';
    loan.disbursedAt = new Date();
    await loan.save();

    // Хэтэвчинд мөнгө нэмэх
    wallet.addBalance(amount);
    await wallet.save();

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: 'loan_disbursement',
      amount,
      balanceBefore: wallet.balance - amount,
      balanceAfter: wallet.balance,
      status: 'completed',
      description: `Зээл олгох - ${loan.loanNumber}`,
      loan: loan._id,
      processedAt: new Date()
    });

    console.log(`✅ Зээл олгогдлоо: ${loan.loanNumber}, Amount: ${amount}`);

    return res.status(200).json({
      success: true,
      message: 'Зээл амжилттай олгогдлоо',
      data: {
        loan,
        transaction,
        wallet
      }
    });

  } catch (error) {
    console.error(`❌ Loan request error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Зээл авахад алдаа гарлаа'
    });
  }
};

// @desc    Зөвшөөрсөн зээлээс мөнгө авах (termDays параметртай)
// @route   POST /api/loans/request-approved
// @access  Private
exports.requestApprovedLoan = async (req, res) => {
  try {
    const { amount, termDays = 30 } = req.body; // ✅ termDays параметр нэмэх
    const userId = req.user.id;

    // 1. Profile шалгах
    const profile = await Profile.findOne({ user: userId });
    if (!profile || !profile.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Хувийн мэдээлэл баталгаажаагүй байна'
      });
    }

    // 2. Зээлийн эрх шалгах
    if (profile.availableLoanLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн эрх байхгүй байна'
      });
    }

    if (amount > profile.availableLoanLimit) {
      return res.status(400).json({
        success: false,
        message: `Дээд хэмжээ: ${profile.availableLoanLimit}₮`
      });
    }

    if (amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Хамгийн багадаа 10,000₮ авах ёстой'
      });
    }

    // ✅ termDays validation
    if (![14, 30, 90].includes(termDays)) {
      return res.status(400).json({
        success: false,
        message: 'Хугацаа 14, 30, эсвэл 90 хоног байх ёстой'
      });
    }

    // ✅ Хүү болон нийт дүн тооцох
    const calculation = calculateTotalAmount(amount, termDays);
    const dueDate = calculateDueDate(new Date(), termDays);

    // 4. Шинэ зээл үүсгэх (pending_disbursement төлөвтэй)
    const loan = await Loan.create({
      user: userId,
      requestedAmount: amount,
      approvedAmount: amount,
      termDays, // ✅ ШИНЭ
      interestRate: calculation.interestRate, // ✅ ШИНЭ - хугацаанаас хамааруулсан хүү
      interest: calculation.interest, // ✅ ШИНЭ
      totalAmount: calculation.totalAmount, // ✅ ШИНЭ
      totalRepayment: calculation.totalAmount, // Хуучин field-тай compatibility
      remainingAmount: calculation.totalAmount,
      status: 'pending_disbursement',
      dueDate
    });

    console.log(`✅ Зээлийн хүсэлт үүсгэгдлээ: ${loan.loanNumber}, Amount: ${amount}, Term: ${termDays} days`);

    return res.status(201).json({
      success: true,
      message: 'Зээлийн хүсэлт илгээгдлээ. Админ зөвшөөрнө.',
      data: {
        loan: {
          ...loan.toObject(),
          calculation
        }
      }
    });

  } catch (error) {
    console.error(`❌ Request approved loan error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Зээл авахад алдаа гарлаа'
    });
  }
};

// @desc    Админ зээл олгох хүсэлтийг зөвшөөрөх
// @route   PUT /api/loans/:id/approve-disbursement
// @access  Private/Admin
exports.approveLoanDisbursement = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    if (loan.status !== 'pending_disbursement') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн pending_disbursement төлөвтэй зээлийг зөвшөөрч болно'
      });
    }

    // ✅ Хүү болон нийт дүн дахин тооцох (бататгаах)
    const calculation = calculateTotalAmount(
      loan.approvedAmount,
      loan.termDays || 30
    );

    // 1. Хэтэвчинд мөнгө нэмэх
    const wallet = await Wallet.findOne({ user: loan.user });
    wallet.addBalance(loan.approvedAmount);
    await wallet.save();

    // 2. Transaction үүсгэх
    await Transaction.create({
      user: loan.user,
      wallet: wallet._id,
      type: 'loan_disbursement',
      amount: loan.approvedAmount,
      balanceBefore: wallet.balance - loan.approvedAmount,
      balanceAfter: wallet.balance,
      status: 'completed',
      description: `Зээл олгох - ${loan.loanNumber}`,
      loan: loan._id,
      processedAt: new Date()
    });

    // 3. Зээлийн эрх багасгах
    const profile = await Profile.findOne({ user: loan.user });
    profile.availableLoanLimit -= loan.approvedAmount;
    await profile.save();

    // 4. Зээлийн төлөв өөрчлөх + хүү тооцоолол шинэчлэх
    loan.disbursedAmount = loan.approvedAmount;
    loan.interestRate = calculation.interestRate; // ✅ ШИНЭ
    loan.interest = calculation.interest; // ✅ ШИНЭ
    loan.totalAmount = calculation.totalAmount; // ✅ ШИНЭ
    loan.totalRepayment = calculation.totalAmount;
    loan.remainingAmount = calculation.totalAmount;
    loan.status = 'disbursed';
    loan.disbursedAt = new Date();
    
    // ✅ Due date тооцох
    if (!loan.dueDate) {
      loan.dueDate = calculateDueDate(loan.disbursedAt, loan.termDays || 30);
    }
    
    await loan.save();

    console.log(`✅ Зээл олгогдлоо: ${loan.loanNumber}, Amount: ${loan.approvedAmount}`);

    return res.status(200).json({
      success: true,
      message: 'Зээл амжилттай олгогдлоо',
      data: { loan }
    });

  } catch (error) {
    console.error(`❌ Approve disbursement error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || 'Зээл олгоход алдаа гарлаа'
    });
  }
};

// @desc    Миний зээлүүд
// @route   GET /api/loans/my-loans
// @access  Private
exports.getMyLoans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    
    if (req.query.status) {
      query.status = req.query.status;
    }

    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Статистик
    const stats = {
      total: await Loan.countDocuments({ user: req.user.id }),
      active: await Loan.countDocuments({ user: req.user.id, status: 'active' }),
      paid: await Loan.countDocuments({ user: req.user.id, status: 'paid' }),
      overdue: await Loan.countDocuments({ user: req.user.id, status: 'overdue' })
    };

    successResponse(res, 200, 'Миний зээлүүд', {
      loans,
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

// @desc    Зээлийн дэлгэрэнгүй
// @route   GET /api/loans/:id
// @access  Private
exports.getLoanDetails = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('user', 'firstName lastName phone email')
      .populate('approvedBy', 'firstName lastName')
      .populate('verificationTransaction');

    if (!loan) {
      return errorResponse(res, 404, 'Зээл олдсонгүй');
    }

    // Зөвхөн өөрийн зээл харах
    if (loan.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return errorResponse(res, 403, 'Эрх хүрэхгүй байна');
    }

    successResponse(res, 200, 'Зээлийн дэлгэрэнгүй', { loan });

  } catch (error) {
    next(error);
  }
};

// @desc    Зээл төлөх
// @route   POST /api/loans/:id/pay
// @access  Private
exports.payLoan = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return errorResponse(res, 404, 'Зээл олдсонгүй');
    }

    if (loan.user.toString() !== req.user.id) {
      return errorResponse(res, 403, 'Эрх хүрэхгүй байна');
    }

    if (loan.status !== 'disbursed' && loan.status !== 'active' && loan.status !== 'overdue') {
      return errorResponse(res, 400, 'Энэ зээлийг төлөх боломжгүй');
    }

    // Хэтэвч шалгах
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet.hasBalance(amount)) {
      return errorResponse(res, 400, 'Хэтэвчний үлдэгдэл хүрэлцэхгүй байна. Эхлээд хэтэвчээ цэнэглэнэ үү.');
    }

    // Төлөх дүн их байвал
    if (amount > loan.remainingAmount) {
      return errorResponse(res, 400, `Хэт их дүн оруулсан. Үлдэгдэл: ${loan.remainingAmount}₮`);
    }

    // Хэтэвчээс хасах
    wallet.balance -= amount;
    wallet.totalSpent += amount;
    wallet.lastTransactionAt = new Date();
    await wallet.save();

    // Зээл шинэчлэх
    loan.paidAmount += amount;
    loan.remainingAmount -= amount;

    if (loan.remainingAmount === 0) {
      loan.status = 'paid';
      loan.paidAt = new Date();
    } else {
      loan.status = 'active';
    }

    await loan.save();

    // Transaction үүсгэх
    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      type: 'loan_payment',
      amount,
      balanceBefore: wallet.balance + amount,
      balanceAfter: wallet.balance,
      status: 'completed',
      description: `Зээл төлөлт - ${loan.loanNumber}`,
      loan: loan._id,
      processedAt: new Date()
    });

    // Profile-ийн зээлийн эрх буцааж нэмэх
    if (loan.status === 'paid') {
      const profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile.availableLoanLimit += loan.disbursedAmount;
        await profile.save();
      }
    }

    logger.info(`Зээл төлөгдлөө: ${loan.loanNumber}, Amount: ${amount}`);

    successResponse(res, 200, 'Төлбөр амжилттай төлөгдлөө', {
      loan,
      transaction,
      wallet
    });

  } catch (error) {
    next(error);
  }
};

// ===== ШИНЭ: Зээл сунгах функц =====
// @desc    Зээл сунгах
// @route   POST /api/loans/:id/extend
// @access  Private
exports.extendLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    // Зээлийн эзэн эсэхийг шалгах
    if (loan.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Танд энэ зээлийг сунгах эрх байхгүй'
      });
    }

    // Зээлийн төлөв шалгах
    if (!['disbursed', 'active', 'overdue'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн идэвхтэй зээлийг сунгаж болно'
      });
    }

    // 14 хоногийн зээлийг сунгаж болохгүй
    if (loan.termDays === 14) {
      return res.status(400).json({
        success: false,
        message: '14 хоногийн зээлийг сунгах боломжгүй'
      });
    }

    // Сунгах хугацаа тооцох (анхны хугацаатай ижил)
    const extensionDays = loan.termDays || 30;
    
    // Хүүгийн дүн тооцох (зөвхөн үндсэн дүн дээр)
    const extensionInterest = Math.round(
      loan.disbursedAmount * (loan.interestRate / 100)
    );

    // Шинэ дуусах хугацаа тооцох
    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + extensionDays);

    // Loan-ийн мэдээлэл шинэчлэх
    loan.extensionCount = (loan.extensionCount || 0) + 1;
    loan.dueDate = newDueDate;
    loan.remainingAmount += extensionInterest;
    loan.totalAmount = (loan.totalAmount || loan.totalRepayment) + extensionInterest;
    loan.totalRepayment = loan.totalAmount; // Compatibility
    loan.lastExtendedAt = new Date();

    await loan.save();

    // Extension түүх хадгалах
    await Transaction.create({
      user: userId,
      wallet: (await Wallet.findOne({ user: userId }))?._id,
      type: 'loan_extension',
      amount: extensionInterest,
      status: 'completed',
      description: `Зээл сунгалт (${extensionDays} хоног): ${loan.loanNumber}`,
      loan: loan._id,
      processedAt: new Date()
    });

    console.log(`✅ Зээл сунгагдлаа: ${loan.loanNumber}, Extension: ${extensionDays} days, Interest: ${extensionInterest}`);

    res.json({
      success: true,
      message: `Зээл амжилттай ${extensionDays} хоногоор сунгагдлаа`,
      data: {
        loan,
        extensionDetails: {
          extensionDays,
          extensionInterest,
          newDueDate,
          newRemainingAmount: loan.remainingAmount,
        },
      },
    });
  } catch (error) {
    console.error('Extend loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Зээл сунгах явцад алдаа гарлаа',
    });
  }
};

// @desc    Бүх зээл (Admin)
// @route   GET /api/loans/admin/all
// @access  Private/Admin
exports.getAllLoans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const total = await Loan.countDocuments(query);
    const loans = await Loan.find(query)
      .populate('user', 'firstName lastName phone email')
      .populate('approvedBy', 'firstName lastName')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    // Статистик
    const stats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$disbursedAmount' }
        }
      }
    ]);

    successResponse(res, 200, 'Бүх зээл', {
      loans,
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

// @desc    Зээл зөвшөөрөх (Admin/Operator)
// @route   PUT /api/loans/:id/approve
// @access  Private/Admin
exports.approveLoan = async (req, res) => {
  try {
    const { approvedAmount } = req.body;
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    if (loan.status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн шалгаж байгаа зээлийг зөвшөөрч болно'
      });
    }

    // Validation - Зээлийн дүн шалгах
    if (!approvedAmount || approvedAmount < 10000 || approvedAmount > 5000000) {
      return res.status(400).json({
        success: false,
        message: 'Зээлийн дүн 10,000₮ - 5,000,000₮ хооронд байх ёстой'
      });
    }

    // Зээл зөвшөөрөх
    loan.approvedAmount = approvedAmount;
    loan.status = 'approved';
    loan.approvedAt = Date.now();
    loan.approvedBy = req.user.id;
    
    // Хүү + хугацаа тооцоолох
    loan.totalRepayment = Math.round(approvedAmount * (1 + loan.interestRate / 100));
    loan.remainingAmount = loan.totalRepayment;
    
    await loan.save();

    // Profile-д зээлийн эрх нэмэх
    const profile = await Profile.findOne({ user: loan.user });
    if (profile) {
      profile.availableLoanLimit = approvedAmount;
      await profile.save();
    }

    res.json({
      success: true,
      message: 'Зээл амжилттай зөвшөөрөгдлөө',
      data: { loan }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Зээл татгалзах (Admin)
// @route   PUT /api/loans/:id/reject
// @access  Private/Admin
exports.rejectLoan = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return errorResponse(res, 404, 'Зээл олдсонгүй');
    }

    loan.status = 'cancelled';
    loan.rejectionReason = reason;
    await loan.save();

    logger.info(`Зээл татгалзагдлаа: ${loan.loanNumber} by ${req.user.email}`);

    successResponse(res, 200, 'Зээл татгалзагдлаа', { loan });

  } catch (error) {
    next(error);
  }
};

// @desc    Шалгуулах хүсэлт үүсгэх
// @route   POST /api/loans/request-verification
// @access  Private
exports.requestVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const VERIFICATION_FEE = 3000;

    // 1. Wallet шалгах
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet || wallet.balance < VERIFICATION_FEE) {
      return res.status(400).json({
        success: false,
        message: 'Хэтэвчний үлдэгдэл хүрэлцэхгүй байна'
      });
    }

    // 2. Хэдийнэ шалгуулж байгаа эсэхийг шалгах
    const existingRequest = await Loan.findOne({
      user: userId,
      status: 'pending_verification',
      verificationPaid: true
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Таны хүсэлт аль хэдийн шалгагдаж байна'
      });
    }

    // 3. Төлбөр хийх
    wallet.balance -= VERIFICATION_FEE;
    wallet.totalSpent += VERIFICATION_FEE;
    await wallet.save();

    // 4. Transaction үүсгэх
    await Transaction.create({
      user: userId,
      wallet: wallet._id,
      type: 'loan_verification_fee',
      amount: VERIFICATION_FEE,
      status: 'completed',
      description: 'Зээлийн мэдээлэл шалгуулах төлбөр',
      processedAt: new Date()
    });

    // 5. Loan request үүсгэх
    const loanRequest = await Loan.create({
      user: userId,
      status: 'pending_verification',
      verificationPaid: true,
      verificationPaidAt: new Date(),
      requestedAmount: 0,
      purpose: 'Зээлийн эрх авах',
      term: 30
    });

    res.json({
      success: true,
      message: 'Төлбөр амжилттай хийгдлээ. Таны хүсэлт админд илгээгдлээ.',
      data: {
        loanRequest,
        remainingBalance: wallet.balance
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    ADMIN: Зээл шалгуулах хүсэлтүүд
// @route   GET /api/loans/verification-pending
// @access  Private/Admin
exports.getPendingVerificationLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const loans = await Loan.find({
      status: 'pending_verification',
      verificationPaid: true
    })
      .populate('user', 'firstName lastName email phone')
      .sort({ verificationPaidAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments({
      status: 'pending_verification',
      verificationPaid: true
    });

    res.json({
      success: true,
      data: {
        loans,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    ADMIN: Шалгалт эхлүүлэх
// @route   PUT /api/loans/:id/start-review
// @access  Private/Admin
exports.startLoanReview = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Зээл олдсонгүй'
      });
    }

    if (loan.status !== 'pending_verification') {
      return res.status(400).json({
        success: false,
        message: 'Зөвхөн pending_verification төлөвтэй зээлийг шалгаж болно'
      });
    }

    loan.status = 'under_review';
    loan.reviewStartedAt = new Date();
    loan.reviewedBy = req.user.id;
    await loan.save();

    res.json({
      success: true,
      message: 'Шалгалт эхэллээ',
      data: { loan }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;