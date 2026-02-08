// Backend: src/database/seeders/seed-verified-user-with-money.js
// Ажиллуулах: node src/database/seeders/seed-verified-user-with-money.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mzeel';

async function seedVerifiedUserWithMoney() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB холбогдлоо');

    const db = mongoose.connection.db;

    // 1. Хуучин test user устгах
    await db.collection('users').deleteOne({ phone: '88888888' });
    await db.collection('users').deleteOne({ email: 'verified@test.mn' });
    await db.collection('profiles').deleteOne({ registerNumber: 'УБ88888888' });
    console.log('🗑️  Хуучин өгөгдөл устгагдлаа');

    // 2. Шинэ user үүсгэх
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const testUser = await db.collection('users').insertOne({
      phone: '88888888',
      email: 'verified@test.mn',
      password: hashedPassword,
      firstName: 'Баталгаа',
      lastName: 'Жсан',
      role: 'user',
      isVerified: true,
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

    // 4. БАТАЛГААЖСАН Profile үүсгэх
    const profile = await db.collection('profiles').insertOne({
      user: userId,
      
      // Үндсэн мэдээлэл
      registerNumber: 'УБ88888888',
      dateOfBirth: new Date('1995-06-20'),
      gender: 'male',
      
      // Хаяг
      address: {
        city: 'Улаанбаатар',
        district: 'Сүхбаатар дүүрэг',
        khoroo: '1-р хороо',
        street: 'Бага тойруу, 5-р байр'
      },
      
      // Яаралтай холбоо барих
      emergencyContact: {
        name: 'Болд Жсан',
        relationship: 'Ах',
        phone: '99112233'
      },
      
      // Ажлын мэдээлэл
      employment: {
        status: 'employed',
        companyName: 'Тест ХХК',
        position: 'Менежер',
        monthlyIncome: 2000000
      },
      
      // Банкны данс
      bankAccount: {
        bankName: 'Хаан банк',
        accountNumber: '5001112233',
        accountName: 'Жсан Баталгаа'
      },
      
      // Зургууд - Placeholder URLs
      idCardFront: 'https://via.placeholder.com/400x250/4A90E2/ffffff?text=ID+Front',
      idCardBack: 'https://via.placeholder.com/400x250/4A90E2/ffffff?text=ID+Back',
      selfiePhoto: 'https://via.placeholder.com/400x400/50C878/ffffff?text=Selfie',
      
      // ✅ БАТАЛГААЖСАН төлөв
      isVerified: true,
      verifiedAt: new Date(),
      verificationStatus: 'approved',
      availableLoanLimit: 0, // Админ зээл зөвшөөрөхөд нэмэгдэнэ
      
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const profileId = profile.insertedId;
    console.log(`✅ БАТАЛГААЖСАН Profile үүсгэгдлээ: ${profileId}`);

    // 5. Мэдээлэл харуулах
    console.log('\n' + '='.repeat(70));
    console.log('🎉 БАТАЛГААЖСАН ТЕСТ ХЭРЭГЛЭГЧ ҮҮСГЭГДЛЭЭ');
    console.log('='.repeat(70));
    
    console.log('\n📱 НЭВТРЭХ МЭДЭЭЛЭЛ:');
    console.log('   Утас:      88888888');
    console.log('   Email:     verified@test.mn');
    console.log('   Нууц үг:   Test@123');
    console.log('   💰 Хэтэвч:  3,000₮');
    
    console.log('\n👤 ХУВИЙН МЭДЭЭЛЭЛ:');
    console.log('   Нэр:       Жсан Баталгаа');
    console.log('   Регистр:   УБ88888888');
    console.log('   Төрсөн:    1995-06-20');
    console.log('   Хүйс:      Эрэгтэй');
    
    console.log('\n🏠 ХАЯГ:');
    console.log('   Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо');
    console.log('   Бага тойруу, 5-р байр');
    
    console.log('\n📞 ЯАРАЛТАЙ ХОЛБОО:');
    console.log('   Болд Жсан (Ах) - 99112233');
    
    console.log('\n💼 АЖЛЫН МЭДЭЭЛЭЛ:');
    console.log('   Тест ХХК');
    console.log('   Менежер');
    console.log('   Сарын орлого: 2,000,000₮');
    
    console.log('\n🏦 БАНКНЫ ДАНС:');
    console.log('   Хаан банк - 5001112233');
    console.log('   Жсан Баталгаа');
    
    console.log('\n✅ ТӨЛӨВ:');
    console.log('   Profile: БАТАЛГААЖСАН ✓');
    console.log('   Зээлийн эрх: 0₮ (Админ зөвшөөрөх хэрэгтэй)');
    
    console.log('\n📝 ДАРААХ АЛХМУУД:');
    console.log('   1. App-аар нэвтрэх (88888888 / Test@123)');
    console.log('   2. Зээлийн мэдээлэл шалгуулах (3,000₮ төлнө)');
    console.log('   3. Admin panel → "Зээл шалгуулах" → Шалгалт эхлүүлэх');
    console.log('   4. Admin panel → "Зээлүүд" → Зөвшөөрөх (дүн оруулах)');
    console.log('   5. App-д зээл авах товч идэвхжинэ');
    console.log('='.repeat(70) + '\n');

    await mongoose.disconnect();
    console.log('✅ MongoDB салгагдлаа\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ АЛДАА:', error);
    process.exit(1);
  }
}

seedVerifiedUserWithMoney();