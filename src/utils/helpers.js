// Санамсаргүй код үүсгэх
exports.generateCode = (length = 6) => {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

// Зээлийн дугаар үүсгэх
exports.generateLoanNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `MZ${year}${random}`;
};

// Утасны дугаар форматлах (99123456 -> 99123456)
exports.formatPhone = (phone) => {
  return phone.replace(/[^0-9]/g, '').slice(-8);
};

// Регистрийн дугаар шалгах
exports.validateRegisterNumber = (regNum) => {
  const regex = /^[А-ЯӨҮа-яөү]{2}[0-9]{8}$/;
  return regex.test(regNum);
};

// Мөнгөн дүн форматлах
exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    minimumFractionDigits: 0
  }).format(amount);
};

// Огноо форматлах
exports.formatDate = (date) => {
  return new Date(date).toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Хугацаа тооцоолох (хоног)
exports.calculateDays = (startDate, endDate) => {
  const diff = new Date(endDate) - new Date(startDate);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Зээлийн хүү тооцоолох
exports.calculateInterest = (principal, rate, days) => {
  const dailyRate = rate / 100 / 365;
  return Math.round(principal * dailyRate * days);
};

// Успешful response
exports.successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message
  };
  
  if (data) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
};

// Error response
exports.errorResponse = (res, statusCode, message, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};