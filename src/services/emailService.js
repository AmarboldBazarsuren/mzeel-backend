const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: `"MZeel" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });

      logger.info(`Email илгээгдлээ: ${to}`);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      logger.error(`Email илгээхэд алдаа: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Welcome email
  async sendWelcomeEmail(email, name) {
    const html = `
      <h1>Тавтай морил, ${name}!</h1>
      <p>MZeel апп-д бүртгүүлсэнд баярлалаа.</p>
      <p>Та одоо зээл авах боломжтой боллоо.</p>
    `;
    return await this.sendEmail(email, 'MZeel-д тавтай морил', html);
  }

  // Зээл зөвшөөрөгдсөн
  async sendLoanApprovalEmail(email, name, amount) {
    const html = `
      <h1>Баяр хүргэе, ${name}!</h1>
      <p>Таны зээлийн хүсэлт зөвшөөрөгдлөө.</p>
      <p>Та ${amount.toLocaleString()}₮ хүртэл зээл авах боломжтой.</p>
    `;
    return await this.sendEmail(email, 'Зээл зөвшөөрөгдлөө', html);
  }
}

module.exports = new EmailService();