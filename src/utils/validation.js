const { body, param, query } = require('express-validator');

// Бүртгэл validation
exports.registerValidation = [
  body('phone')
    .matches(/^[0-9]{8}$/)
    .withMessage('Утасны дугаар 8 оронтой байх ёстой'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email хаяг буруу байна'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Нэр оруулна уу'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Овог оруулна уу')
];

// Нэвтрэх validation
exports.loginValidation = [
  body('phone')
    .matches(/^[0-9]{8}$/)
    .withMessage('Утасны дугаар 8 оронтой байх ёстой'),
  body('password')
    .notEmpty()
    .withMessage('Нууц үг оруулна уу')
];

// Profile validation
exports.profileValidation = [
  body('registerNumber')
    .matches(/^[А-ЯӨҮа-яөү]{2}[0-9]{8}$/)
    .withMessage('Регистрийн дугаар буруу (Жишээ: УБ12345678)'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Төрсөн өдөр буруу'),
  body('bankAccount.accountNumber')
    .isNumeric()
    .isLength({ min: 8, max: 20 })
    .withMessage('Дансны дугаар буруу')
];

// Зээл авах validation
exports.loanValidation = [
  body('amount')
    .isNumeric()
    .custom((value) => value >= 10000 && value <= 500000)
    .withMessage('Зээлийн дүн 10,000₮ - 500,000₮ хооронд байх ёстой'),
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Зээлийн зориулалт 200 тэмдэгтээс хэтрэхгүй')
];

// Мөнгө татах validation
exports.withdrawalValidation = [
  body('amount')
    .isNumeric()
    .custom((value) => value >= 1000)
    .withMessage('Хамгийн багадаа 1,000₮ татах боломжтой'),
  body('bankName')
    .notEmpty()
    .withMessage('Банкны нэр оруулна уу'),
  body('accountNumber')
    .isNumeric()
    .isLength({ min: 8, max: 20 })
    .withMessage('Дансны дугаар буруу'),
  body('accountName')
    .notEmpty()
    .withMessage('Дансны эзэмшигчийн нэр оруулна уу')
];

// ID parameter validation
exports.idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID буруу байна')
];