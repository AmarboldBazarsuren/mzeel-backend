require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const logger = require('../../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI;

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB холбогдлоо');

    // Admin хэрэглэгч байгаа эсэх шалгах
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      logger.info('Admin аль хэдийн байна');
      process.exit(0);
    }

    // Admin үүсгэх
    const admin = await User.create({
      phone: '99999999',
      email: process.env.ADMIN_EMAIL || 'admin@mzeel.mn',
      password: process.env.ADMIN_PASSWORD || 'Admin@12345',
      firstName: 'Admin',
      lastName: 'MZeel',
      role: 'admin',
      isVerified: true,
      isActive: true
    });

    // Wallet үүсгэх
    await Wallet.create({ user: admin._id });

    logger.info('✅ Admin амжилттай үүсгэгдлээ');
    logger.info(`Email: ${admin.email}`);
    logger.info(`Password: ${process.env.ADMIN_PASSWORD || 'Admin@12345'}`);

    process.exit(0);

  } catch (error) {
    logger.error(`Алдаа: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();