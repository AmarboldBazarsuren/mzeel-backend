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
    required: true
  },
  
  // Зээлийн мэдээлэл
  requestedAmount: {
    type: Number,
    required: true,
    min: 10000
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
  
  // Төлөв
  status: {
    type: String,
    enum: [
      'pending_verification',  // Баталгаажуулалт хүлээж байна (3000₮ төлсөн)
      'under_review',          // Шалгаж байна
      'approved',              // Зөвшөөрөгдсөн (operator дүн оруулсан)
      'disbursed',             // Олгогдсон (хэтэвчинд орсон)
      'active',                // Идэвхтэй (эргэн төлж байгаа)
      'paid',                  // Төлөгдсөн
      'overdue',               // Хугацаа хэтэрсэн
      'defaulted',             // Төлөх чадваргүй
      'cancelled'              // Цуцлагдсан
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

// Зээлийн дугаар автоматаар үүсгэх
loanSchema.pre('save', async function(next) {
  if (!this.loanNumber) {
    const count = await mongoose.model('Loan').countDocuments();
    this.loanNumber = `MZ${new Date().getFullYear()}${String(count + 1).padStart(6, '0')}`;
  }
  
  // Нийт төлөх дүн тооцоолох
  if (this.approvedAmount && !this.totalRepayment) {
    this.totalRepayment = Math.round(this.approvedAmount * (1 + this.interestRate / 100));
    this.remainingAmount = this.totalRepayment;
  }
  
  next();
});

module.exports = mongoose.model('Loan', loanSchema);