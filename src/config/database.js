const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    logger.info(`✅ MongoDB холбогдсон: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);

    // Connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB алдаа: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB салсан');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB холболт хаагдлаа');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ MongoDB холболт амжилтгүй: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;