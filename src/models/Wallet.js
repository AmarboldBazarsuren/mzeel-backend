const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposit: {
    type: Number,
    default: 0
  },
  totalWithdrawal: {
    type: Number,
    default: 0
  },
  // ✅ ШИНЭ: Нийт зарцуулалт (шимтгэл, verification fee гэх мэт)
  totalSpent: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'MNT'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastTransactionAt: Date
}, {
  timestamps: true
});

// Үлдэгдэл шалгах
walletSchema.methods.hasBalance = function(amount) {
  return this.balance >= amount;
};

// ✅ ШИНЭЧИЛСЭН: Мөнгө нэмэх (deposit, loan disbursement)
walletSchema.methods.addBalance = function(amount) {
  this.balance += amount;
  this.totalDeposit += amount;
  this.lastTransactionAt = new Date();
};

// ✅ ШИНЭЧИЛСЭН: Мөнгө хасах (loan payment, withdrawal гэх мэт)
walletSchema.methods.deductBalance = function(amount) {
  if (this.balance < amount) {
    throw new Error('Хэтэвчний үлдэгдэл хүрэлцэхгүй байна');
  }
  this.balance -= amount;
  this.totalWithdrawal += amount;
  this.lastTransactionAt = new Date();
};

// ✅ ШИНЭ: Зарцуулалт нэмэх (шимтгэл, verification fee)
walletSchema.methods.deductFee = function(amount) {
  if (this.balance < amount) {
    throw new Error('Хэтэвчний үлдэгдэл хүрэлцэхгүй байна');
  }
  this.balance -= amount;
  this.totalSpent += amount;
  this.lastTransactionAt = new Date();
};

// ✅ ШИНЭ: Зээл төлөх (үлдэгдэл багасна, гэхдээ totalWithdrawal биш totalSpent-д орно)
walletSchema.methods.payLoan = function(amount) {
  if (this.balance < amount) {
    throw new Error('Хэтэвчний үлдэгдэл хүрэлцэхгүй байна');
  }
  this.balance -= amount;
  this.totalSpent += amount; // Зээл төлөлт = зарцуулалт
  this.lastTransactionAt = new Date();
};

module.exports = mongoose.model('Wallet', walletSchema);