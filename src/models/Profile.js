const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Хувийн мэдээлэл
  registerNumber: {
    type: String,
    required: [true, 'Регистрийн дугаар оруулна уу'],
    unique: true,
    match: [/^[А-ЯӨҮа-яөү]{2}[0-9]{8}$/, 'Регистрийн дугаар буруу']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Төрсөн өдөр оруулна уу']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  
  // Холбоо барих мэдээлэл
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Холбоо барих хүний нэр оруулна уу']
    },
    relationship: String,
    phone: {
      type: String,
      required: [true, 'Холбоо барих дугаар оруулна уу']
    }
  },

  // Гэрийн хаяг
  address: {
    city: {
      type: String,
      required: [true, 'Хот/Аймаг оруулна уу']
    },
    district: {
      type: String,
      required: [true, 'Дүүрэг/Сум оруулна уу']
    },
    khoroo: String,
    street: String,
    apartment: String,
    detail: String
  },

  // ✅ ЗАСВАРЛАСАН: Боловсрол - required: false
  education: {
    level: {
      type: String,
      enum: ['middle', 'high', 'vocational', 'bachelor', 'master', 'phd'],
      required: false, // ✅ Заавал биш болгов
      default: 'high'
    },
    school: String,
    graduationYear: Number
  },

  // ✅ ЗАСВАРЛАСАН: Ажлын мэдээлэл - required: false
  employment: {
    status: {
      type: String,
      enum: ['employed', 'self-employed', 'unemployed', 'student', 'retired'],
      required: false, // ✅ Заавал биш болгов
      default: 'employed'
    },
    companyName: String,
    position: String,
    monthlyIncome: {
      type: Number,
      min: 0,
      default: 0
    },
    workPhone: String,
    startDate: Date
  },

  // Дансны мэдээлэл
  bankAccount: {
    bankName: {
      type: String,
      required: [true, 'Банкны нэр оруулна уу']
    },
    accountNumber: {
      type: String,
      required: [true, 'Дансны дугаар оруулна уу']
    },
    accountName: {
      type: String,
      required: [true, 'Дансны эзэмшигчийн нэр оруулна уу']
    }
  },

  // Зургууд - заавал биш
  idCardFront: {
    type: String,
    required: false
  },
  idCardBack: {
    type: String,
    required: false
  },
  selfiePhoto: {
    type: String,
    required: false
  },

  // Зээлийн дээд эрх
  availableLoanLimit: {
    type: Number,
    default: 0,
    min: 0
  },

  // Баталгаажуулалт
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Verification status
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Rejection мэдээлэл
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: String,
  
}, {
  timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);