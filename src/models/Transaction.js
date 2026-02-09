const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: false // ✅ loan_extension-д wallet байхгүй
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'loan_disbursement', 'loan_payment', 'verification_fee', 'refund', 'loan_extension'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceBefore: {
    type: Number,
    required: false // ✅ loan_extension-д balanceBefore байхгүй
  },
  balanceAfter: {
    type: Number,
    required: false // ✅ loan_extension-д balanceAfter байхгүй
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: String,
  
  // QPay мэдээлэл (deposit-д)
  qpayInvoiceId: String,
  qpayQrCode: String,
  qpayDeeplink: String,
  qpayExpireAt: Date,
  
  // Татах хүсэлт (withdrawal-д)
  withdrawalRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Withdrawal'
  },
  
  // Зээл (loan-д)
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  
  metadata: mongoose.Schema.Types.Mixed,
  
  processedAt: Date,
  failedReason: String
}, {
  timestamps: true
});

// Index for queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);