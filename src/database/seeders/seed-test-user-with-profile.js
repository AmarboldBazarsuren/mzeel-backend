// Backend: scripts/seed-test-user-with-profile.js
// Ажиллуулах: node scripts/seed-test-user-with-profile.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB холбох
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mzeel';

async function seedTestUserWithProfile() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB холбогдлоо');

    const db = mongoose.connection.db;

    // 1. Хуучин test user устгах
    await db.collection('users').deleteOne({ phone: '77777777' });
    await db.collection('users').deleteOne({ email: 'test3000@mzeel.mn' });
    await db.collection('profiles').deleteOne({ registerNumber: 'УБ99887766' });
    console.log('🗑️  Хуучин өгөгдөл устгагдлаа');

    // 2. Шинэ user үүсгэх
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const testUser = await db.collection('users').insertOne({
      phone: '77777777',
      email: 'test3000@mzeel.mn',
      password: hashedPassword,
      firstName: 'Бат',
      lastName: 'Дорж',
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

    // 4. Profile үүсгэх - БҮГДИЙГ НЬ БӨГЛӨСӨН
    const profile = await db.collection('profiles').insertOne({
      user: userId,
      
      // Үндсэн мэдээлэл
      registerNumber: 'УБ99887766',
      dateOfBirth: new Date('1995-05-15'),
      gender: 'male',
      
      // Хаяг
      address: {
        city: 'Улаанбаатар',
        district: 'Баянзүрх дүүрэг',
        khoroo: '5-р хороо',
        street: 'Барилгачдын талбай, 3-р байр'
      },
      
      // Яаралтай холбоо барих
      emergencyContact: {
        name: 'Сүхбаатар Дорж',
        relationship: 'Эцэг',
        phone: '99001122'
      },
      
      // Ажлын мэдээлэл
      employment: {
        status: 'employed',
        companyName: 'Монгол Телеком ХХК',
        position: 'Програм хангамжийн инженер',
        monthlyIncome: 2500000
      },
      
      // Банкны данс
      bankAccount: {
        bankName: 'Хаан банк',
        accountNumber: '5001234567',
        accountName: 'Дорж Бат'
      },
      
      // Зургууд - Placeholder URLs (эсвэл base64)
      idCardFront: 'https://via.placeholder.com/400x250/4A90E2/ffffff?text=ID+Card+Front',
      idCardBack: 'https://via.placeholder.com/400x250/4A90E2/ffffff?text=ID+Card+Back',
      selfiePhoto: 'https://via.placeholder.com/400x400/50C878/ffffff?text=Selfie+Photo',
      
      // Төлөв
      isVerified: false, // АДМИН баталгаажуулаагүй
      verificationStatus: 'pending',
      
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const profileId = profile.insertedId;
    console.log(`✅ Profile үүсгэгдлээ: ${profileId}`);

    // 5. Мэдээлэл харуулах
    console.log('\n' + '='.repeat(70));
    console.log('🎉 БҮРЭН БӨГЛӨГДСӨН ТЕСТ ХЭРЭГЛЭГЧ ҮҮСГЭГДЛЭЭ');
    console.log('='.repeat(70));
    
    console.log('\n📱 НЭВТРЭХ МЭДЭЭЛЭЛ:');
    console.log('   Утас:      00000000');
    console.log('   Email:     test3000@mzeeel.mn');
    console.log('   Нууц үг:   Test@123');
    console.log('   💰 Хэтэвч:  3,000₮');
    
    console.log('\n👤 ХУВИЙН МЭДЭЭЛЭЛ:');
    console.log('   Нэр:       Дорж Бат');
    console.log('   Регистр:   УБ99887766');
    console.log('   Төрсөн:    1995-05-15');
    console.log('   Хүйс:      Эрэгтэй');
    
    console.log('\n🏠 ХАЯГ:');
    console.log('   Улаанбаатар, Баянзүрх дүүрэг, 5-р хороо');
    console.log('   Барилгачдын талбай, 3-р байр');
    
    console.log('\n📞 ЯАРАЛТАЙ ХОЛБОО:');
    console.log('   Сүхбаатар Дорж (Эцэг) - 99001122');
    
    console.log('\n💼 АЖЛЫН МЭДЭЭЛЭЛ:');
    console.log('   Монгол Телеком ХХК');
    console.log('   Програм хангамжийн инженер');
    console.log('   Сарын орлого: 2,500,000₮');
    
    console.log('\n🏦 БАНКНЫ ДАНС:');
    console.log('   Хаан банк - 5001234567');
    console.log('   Дорж Бат');
    
    console.log('\n📸 БАРИМТ БИЧИГ:');
    console.log('   ✅ Иргэний үнэмлэх (урд)');
    console.log('   ✅ Иргэний үнэмлэх (ард)');
    console.log('   ✅ Selfie зураг');
    
    console.log('\n📝 ДАРААХ АЛХМУУД:');
    console.log('   1. Admin панел → "📋 Profile шалгах"');
    console.log('   2. Дорж Бат profile-ийг шалгаад баталгаажуулна');
    console.log('   3. App-аар нэвтрэх → Зээлийн мэдээлэл шалгуулах (3,000₮ төлнө)');
    console.log('   4. Admin панел → "💳 Зээл шалгуулах" хэсэгт гарна');
    console.log('='.repeat(70) + '\n');

    await mongoose.disconnect();
    console.log('✅ MongoDB салгагдлаа\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ АЛДАА:', error);
    process.exit(1);
  }
}

seedTestUserWithProfile();