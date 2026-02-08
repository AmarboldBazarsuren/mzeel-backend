const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Log to file
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Өгөгдөл олдсонгүй';
    error = { statusCode: 404, message };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const message = `Энэ ${field} аль хэдийн бүртгэлтэй байна`;
    error = { statusCode: 400, message };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { statusCode: 400, message };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token буруу байна';
    error = { statusCode: 401, message };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token-ий хугацаа дууссан';
    error = { statusCode: 401, message };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Серверийн алдаа гарлаа',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;