// Backend: scripts/seed-test-user.js
// Ажиллуулах: node scripts/seed-test-user.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB холбох
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mzeel';

async function seedTestUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB холбогдлоо');

    const db = mongoose.connection.db;

    // 1. Хуучин test user устгах
    await db.collection('users').deleteOne({ phone: '77777777' });
    await db.collection('users').deleteOne({ email: 'test3000@mzeel.mn' });
    console.log('🗑️  Хуучин test user устгагдлаа');

    // 2. Шинэ user үүсгэх
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const testUser = await db.collection('users').insertOne({
      phone: '77777777',
      email: 'test3000@mzeel.mn',
      password: hashedPassword,
      firstName: 'Тест',
      lastName: 'Хэрэглэгч',
      role: 'user',
      isVerified: true, // Email баталгаажсан
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const userId = testUser.insertedId;
    console.log(`✅ User үүсгэгдлээ: ${userId}`);

    // 3. Хэтэвч үүсгэх - 3000₮ мөнгөтэй
    await db.collection('wallets').deleteMany({ user: userId });
    
    await db.collection('wallets').insertOne({
      user: userId,
      balance: 3000,
      totalDeposit: 3000,
      totalWithdrawal: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Хэтэвч үүсгэгдлээ: 3,000₮');

    // 4. Мэдээлэл харуулах
    console.log('\n' + '='.repeat(60));
    console.log('📱 ТЕСТ ХЭРЭГЛЭГЧ ҮҮСГЭГДЛЭЭ');
    console.log('='.repeat(60));
    console.log('📱 Утас:       77777777');
    console.log('📧 Email:      test3000@mzeel.mn');
    console.log('🔑 Нууц үг:    Test@123');
    console.log('💰 Хэтэвч:     3,000₮');
    console.log('✅ Төлөв:      Идэвхтэй');
    console.log('\n📝 ДАРААХ АЛХМУУД:');
    console.log('   1. App-д нэвтэрч profile бөглөнө');
    console.log('   2. 3,000₮ зээлийн мэдээлэл шалгуулах төлнө');
    console.log('   3. Admin панелд "Зээл шалгуулах" хэсэгт гарна');
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    console.log('✅ MongoDB салгагдлаа');
    process.exit(0);

  } catch (error) {
    console.error('❌ АЛДАА:', error);
    process.exit(1);
  }
}

seedTestUser();