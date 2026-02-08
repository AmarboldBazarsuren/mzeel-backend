const axios = require('axios');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.apiURL = process.env.SMS_API_URL;
    this.apiKey = process.env.SMS_API_KEY;
    this.sender = process.env.SMS_SENDER_NAME || 'MZEEL';
  }

  async sendSMS(phone, message) {
    try {
      // Mongolian SMS API integration
      // Жишээ нь: messagepro.mn, skytel.mn гэх мэт
      
      if (!this.apiURL || !this.apiKey) {
        logger.warn('SMS API тохируулагдаагүй байна');
        return { success: false, message: 'SMS service not configured' };
      }

      const response = await axios.post(this.apiURL, {
        from: this.sender,
        to: phone,
        text: message
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`SMS илгээгдлээ: ${phone}`);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      logger.error(`SMS илгээхэд алдаа: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verification code илгээх
  async sendVerificationCode(phone, code) {
    const message = `MZeel баталгаажуулах код: ${code}. Кодыг хэнд ч бүү хэлээрэй.`;
    return await this.sendSMS(phone, message);
  }

  // Зээл зөвшөөрөгдсөн мэдэгдэл
  async sendLoanApproval(phone, amount) {
    const message = `Таны зээлийн хүсэлт зөвшөөрөгдлөө. ${amount}₮ хүртэл зээл авах боломжтой.`;
    return await this.sendSMS(phone, message);
  }

  // Төлбөрийн сануулга
  async sendPaymentReminder(phone, amount, dueDate) {
    const message = `Сануулга: ${amount}₮ зээл ${dueDate} хүртэл төлөх шаардлагатай.`;
    return await this.sendSMS(phone, message);
  }
}

module.exports = new SMSService();