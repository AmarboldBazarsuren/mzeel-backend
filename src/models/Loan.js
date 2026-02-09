const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  loanNumber: {
    type: String,
    unique: true,
    required: false // pre-save hook-оор автоматаар үүснэ
  },
  
  // ===== Зээлийн мэдээлэл =====
  requestedAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  approvedAmount: {
    type: Number,
    default: 0
  },
  disbursedAmount: {
    type: Number,
    default: 0
  },
  
  // ===== ХҮҮ БОЛОН ХУГАЦАА (ШИНЭ) =====
  termDays: {
    type: Number,
    default: 30, // 14, 30, эсвэл 90
    enum: [14, 30, 90],
  },
  interestRate: {
    type: Number,
    default: 3.2, // Percentage (2.8, 3.2, 3.8)
  },
  interest: {
    type: Number,
    default: 0, // Тооцоолсон хүүгийн дүн
  },
  totalAmount: {
    type: Number,
    default: 0, // Нийт төлөх = principal + interest (ШИНЭ)
  },
  
  // ===== Хуучин field (compatibility) =====
  term: {
    type: Number,
    default: 30,
    required: true
  },
  
  // ===== Төлбөрийн мэдээлэл =====
  totalRepayment: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  
  // ===== СУНГАЛТ (ШИНЭ) =====
  extensionCount: {
    type: Number,
    default: 0, // Хэдэн удаа сунгасан
  },
  lastExtendedAt: {
    type: Date, // Сүүлд сунгасан огноо
  },
  
  // ===== Төлөв =====
  status: {
    type: String,
    enum: [
      'pending_verification',  
      'under_review',
      'approved',
      'pending_disbursement', 
      'disbursed',
      'active',
      'paid',
      'overdue',
      'defaulted',
      'cancelled'
    ],
    default: 'pending_verification'
  },
  
  // ===== Огноо =====
  applicationDate: {
    type: Date,
    default: Date.now
  },
  verificationPaidAt: Date,
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disbursedAt: Date,
  dueDate: Date,
  paidAt: Date,
  reviewStartedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // ===== Баталгаажуулалтын төлбөр =====
  verificationFee: {
    type: Number,
    default: 3000
  },
  verificationPaid: {
    type: Boolean,
    default: false
  },
  verificationTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  
  // ===== Тайлбар =====
  purpose: String,
  adminNotes: String,
  rejectionReason: String,
  
}, {
  timestamps: true
});

// ===== INDEXES =====
loanSchema.index({ user: 1, status: 1 });
loanSchema.index({ loanNumber: 1 });
loanSchema.index({ dueDate: 1 });
loanSchema.index({ status: 1, verificationPaid: 1 });

// ===== PRE-SAVE HOOK =====
loanSchema.pre('save', async function() {
  // Зээлийн дугаар байхгүй бол үүсгэх
  if (!this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `MZ${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Нийт төлөх дүн тооцоолох (зөвхөн approvedAmount байвал)
  if (this.approvedAmount > 0 && !this.totalRepayment && !this.totalAmount) {
    this.totalRepayment = Math.round(this.approvedAmount * (1 + this.interestRate / 100));
    this.totalAmount = this.totalRepayment; // ШИНЭ field
    this.remainingAmount = this.totalRepayment;
  }
});

// ===== VIRTUAL FIELDS =====

// Зээл сунгах боломжтой эсэх
loanSchema.virtual('isExtendable').get(function () {
  // Зөвхөн 1 сар болон 3 сарын зээлийг сунгаж болно
  return (
    this.termDays !== 14 &&
    ['disbursed', 'active', 'overdue'].includes(this.status)
  );
});

// Ensure virtuals are included in JSON
loanSchema.set('toJSON', { virtuals: true });
loanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Loan', loanSchema);