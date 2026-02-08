const rateLimit = require('express-rate-limit');

// Ерөнхий rate limiter
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100,
  message: {
    success: false,
    message: 'Хэт олон хүсэлт илгээлээ. 15 минутын дараа дахин оролдоно уу.'
  }
});

// ✅ Нэвтрэх rate limiter (ИДЭВХГҮЙ БОЛГОСОН)
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 🔓 1000 болгосон (өмнө нь 5 байсан)
  message: {
    success: false,
    message: 'Хэт олон оролдлого. 15 минутын дараа дахин оролдоно уу.'
  }
});

// Зээл авах rate limiter
exports.loanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 цаг
  max: 3,
  message: {
    success: false,
    message: '1 цагт 3-аас илүү зээлийн хүсэлт илгээж болохгүй'
  }
});