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
    // ✅ ЗАСВАРЛАСАН: required: false (pre-save hook-оор автоматаар үүснэ)
    required: false
  },
  
  // Зээлийн мэдээлэл
  requestedAmount: {
    type: Number,
    // ✅ ЗАСВАРЛАСАН: required: false, min: 0 (verification үед 0 байна)
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
  
  interestRate: {
    type: Number,
    default: 5, // 5% хүү
    min: 0
  },
  
  term: {
    type: Number,
    default: 30, // 30 хоног
    required: true
  },
  
  // Төлбөрийн мэдээлэл
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
  
  // ✅ ЗАСВАРЛАСАН: Төлөв - verification_pending -> pending_verification
  status: {
    type: String,
    enum: [
      'pending_verification',  // ✅ Зөв нэр
      'under_review',
      'approved',
      'disbursed',
      'active',
      'paid',
      'overdue',
      'defaulted',
      'cancelled'
    ],
    default: 'pending_verification'
  },
  
  // Огноо
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
  
  // Баталгаажуулалтын төлбөр
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
  
  // Тайлбар
  purpose: String,
  adminNotes: String,
  rejectionReason: String,
  
}, {
  timestamps: true
});

// ✅ ЗАСВАРЛАСАН: next() устгасан - async function-д шаардлагагүй
loanSchema.pre('save', async function() {
  // Зээлийн дугаар байхгүй бол үүсгэх
  if (!this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `MZ${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Нийт төлөх дүн тооцоолох (зөвхөн approvedAmount байвал)
  if (this.approvedAmount > 0 && !this.totalRepayment) {
    this.totalRepayment = Math.round(this.approvedAmount * (1 + this.interestRate / 100));
    this.remainingAmount = this.totalRepayment;
  }
});

module.exports = mongoose.model('Loan', loanSchema);