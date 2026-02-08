const smsService = require('./smsService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  // Notification илгээх (SMS + Email)
  async send(user, type, data) {
    try {
      switch (type) {
        case 'welcome':
          await emailService.sendWelcomeEmail(user.email, user.firstName);
          break;

        case 'loan_approved':
          await smsService.sendLoanApproval(user.phone, data.amount);
          await emailService.sendLoanApprovalEmail(user.email, user.firstName, data.amount);
          break;

        case 'payment_reminder':
          await smsService.sendPaymentReminder(user.phone, data.amount, data.dueDate);
          break;

        default:
          logger.warn(`Unknown notification type: ${type}`);
      }

      logger.info(`Notification илгээгдлээ: ${type} to ${user.email}`);

    } catch (error) {
      logger.error(`Notification алдаа: ${error.message}`);
    }
  }
}

module.exports = new NotificationService();