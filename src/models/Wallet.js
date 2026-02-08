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

// Мөнгө нэмэх
walletSchema.methods.addBalance = function(amount) {
  this.balance += amount;
  this.totalDeposit += amount;
  this.lastTransactionAt = new Date();
};

// Мөнгө хасах
walletSchema.methods.deductBalance = function(amount) {
  if (this.balance < amount) {
    throw new Error('Хэтэвчний үлдэгдэл хүрэлцэхгүй байна');
  }
  this.balance -= amount;
  this.totalWithdrawal += amount;
  this.lastTransactionAt = new Date();
};

module.exports = mongoose.model('Wallet', walletSchema);