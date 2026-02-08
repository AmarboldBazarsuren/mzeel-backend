// src/database/seeders/testUserSeeder.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Wallet = require('../../models/Wallet');
const Profile = require('../../models/Profile');
const Loan = require('../../models/Loan');
const logger = require('../../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI;

const seedTestUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB холбогдлоо');

    // ✅ Тест хэрэглэгч үүсгэх
    const testUserData = {
      phone: '88888888',
      email: 'test@mzeel.mn',
      password: 'Test@123',
      firstName: 'Тест',
      lastName: 'Хэрэглэгч',
      role: 'user',
      isVerified: true,
      isActive: true
    };

    // Хуучин test user-г устгах
    await User.deleteOne({ email: testUserData.email });
    await User.deleteOne({ phone: testUserData.phone });

    // Шинэ user үүсгэх
    const testUser = await User.create(testUserData);
    logger.info(`✅ Тест user үүсгэгдлээ: ${testUser.email}`);

    // ✅ Хэтэвч үүсгэх (500,000₮ мөнгөтэй)
    const wallet = await Wallet.create({
      user: testUser._id,
      balance: 500000,
      totalDeposit: 500000,
      totalWithdrawal: 0
    });
    logger.info(`✅ Хэтэвч үүсгэгдлээ: ${wallet.balance}₮`);

    // ✅ Profile үүсгэх (баталгаажсан)
    const profile = await Profile.create({
      user: testUser._id,
      registerNumber: 'УБ99999999',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      emergencyContact: {
        name: 'Тест Хүн',
        relationship: 'Ах',
        phone: '99999999'
      },
      address: {
        city: 'Улаанбаатар',
        district: 'Сүхбаатар',
        khoroo: '1'
      },
      education: {
        level: 'bachelor'
      },
      employment: {
        status: 'employed',
        companyName: 'Тест компани',
        position: 'Менежер',
        monthlyIncome: 2000000
      },
      bankAccount: {
        bankName: 'Хаан банк',
        accountNumber: '1234567890',
        accountName: 'Хэрэглэгч Тест'
      },
      isVerified: true,
      verifiedAt: new Date()
    });
    logger.info(`✅ Profile үүсгэгдлээ (баталгаажсан)`);

    // ✅ Зээлийн эрх үүсгэх (approved төлөвтэй зээл)
    const loan = await Loan.create({
      user: testUser._id,
      loanNumber: `MZ${new Date().getFullYear()}TEST01`,
      requestedAmount: 500000,
      approvedAmount: 500000,
      interestRate: 5,
      term: 30,
      status: 'approved',
      verificationFee: 3000,
      verificationPaid: true,
      verificationPaidAt: new Date(),
      approvedAt: new Date(),
      adminNotes: 'Тест user - автоматаар зөвшөөрөгдсөн'
    });
    logger.info(`✅ Зээл үүсгэгдлээ: ${loan.loanNumber} - Approved (500,000₮)`);

    // ✅ Мэдээлэл хэвлэх
    console.log('\n' + '='.repeat(50));
    console.log('ТЕСТ ХЭРЭГЛЭГЧ МЭДЭЭЛЭЛ');
    console.log('='.repeat(50));
    console.log(`📱 Утас: ${testUser.phone}`);
    console.log(`📧 Email: ${testUser.email}`);
    console.log(`🔑 Нууц үг: Test@123`);
    console.log(`💰 Хэтэвч: ${wallet.balance.toLocaleString()}₮`);
    console.log(`✅ Profile: Баталгаажсан`);
    console.log(`💳 Зээлийн эрх: ${loan.approvedAmount.toLocaleString()}₮`);
    console.log(`📄 Зээлийн дугаар: ${loan.loanNumber}`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);

  } catch (error) {
    logger.error(`❌ Алдаа: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedTestUser();