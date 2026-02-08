const axios = require('axios');
const logger = require('../utils/logger');

class QPay {
  constructor() {
    this.baseURL = process.env.QPAY_API_URL || 'https://merchant.qpay.mn/v2';
    this.username = process.env.QPAY_USERNAME;
    this.password = process.env.QPAY_PASSWORD;
    this.invoiceCode = process.env.QPAY_INVOICE_CODE;
    this.token = null;
    this.tokenExpiry = null;
  }

  // Token авах
  async getToken() {
    try {
      if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.token;
      }

      const response = await axios.post(`${this.baseURL}/auth/token`, {}, {
        auth: {
          username: this.username,
          password: this.password
        }
      });

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 цаг

      logger.info('QPay token авлаа');
      return this.token;

    } catch (error) {
      logger.error(`QPay token авахад алдаа: ${error.message}`);
      throw new Error('QPay холболт амжилтгүй');
    }
  }

  // Invoice үүсгэх
  async createInvoice(amount, userId) {
    try {
      const token = await this.getToken();

      const response = await axios.post(
        `${this.baseURL}/invoice`,
        {
          invoice_code: this.invoiceCode,
          sender_invoice_no: `MZEEL_${userId}_${Date.now()}`,
          invoice_receiver_code: userId.toString(),
          invoice_description: `MZeel хэтэвч цэнэглэх ${amount}₮`,
          amount: amount,
          callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/wallet/qpay-callback`
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info(`QPay invoice үүсгэгдлээ: ${response.data.invoice_id}`);

      return {
        success: true,
        invoice_id: response.data.invoice_id,
        qr_image: response.data.qr_image,
        qr_text: response.data.qr_text,
        deeplink: response.data.urls?.find(u => u.name === 'deeplink')?.link || null
      };

    } catch (error) {
      logger.error(`QPay invoice үүсгэхэд алдаа: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Payment шалгах
  async checkPayment(invoiceId) {
    try {
      const token = await this.getToken();

      const response = await axios.post(
        `${this.baseURL}/payment/check`,
        {
          object_type: 'INVOICE',
          object_id: invoiceId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const paid = response.data.rows?.some(row => row.payment_status === 'PAID');

      return {
        paid,
        data: response.data
      };

    } catch (error) {
      logger.error(`QPay payment шалгахад алдаа: ${error.message}`);
      return {
        paid: false,
        error: error.message
      };
    }
  }
}

module.exports = new QPay();