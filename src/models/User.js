const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: [true, 'Утасны дугаар оруулна уу'],
    unique: true,
    match: [/^[0-9]{8}$/, 'Утасны дугаар буруу байна']
  },
  email: {
    type: String,
    required: [true, 'Email хаяг оруулна уу'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email хаяг буруу байна']
  },
  password: {
    type: String,
    required: [true, 'Нууц үг оруулна уу'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'Нэр оруулна уу'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Овог оруулна уу'],
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'operator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  verificationCode: String,
  verificationCodeExpire: Date
}, {
  timestamps: true
});

// Password хэшлэх
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password харьцуулах
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Full name буцаах
userSchema.virtual('fullName').get(function() {
  return `${this.lastName} ${this.firstName}`;
});

module.exports = mongoose.model('User', userSchema);