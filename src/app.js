const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();

// ============ MIDDLEWARES ============
// Security
app.use(helmet());

// CORS тохиргоо
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://mzeel.mn', 'https://admin.mzeel.mn']
    : '*',
  credentials: true
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Rate limiting - API хамгаалалт
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 хүсэлт/IP
  message: 'Хэт олон хүсэлт илгээлээ. 15 минутын дараа дахин оролдоно уу.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============ ROUTES ============
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/wallet', require('./routes/wallet.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/loans', require('./routes/loan.routes'));
app.use('/api/withdrawals', require('./routes/withdrawal.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// 404 хариулт
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Энэ endpoint олдсонгүй' 
  });
});

// Error handler (хамгийн сүүлд)
app.use(errorHandler);

module.exports = app;