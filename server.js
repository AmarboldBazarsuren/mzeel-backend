require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Database холболт
connectDB();

const server = app.listen(PORT, () => {
  logger.info(`🚀 MZeel Backend амжилттай эхэллээ`);
  logger.info(`📍 Port: ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
  logger.info(`⏰ ${new Date().toLocaleString('mn-MN')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM хүлээж авлаа. Серверийг зогсоож байна...');
  server.close(() => {
    logger.info('Процесс дууслаа');
  });
});