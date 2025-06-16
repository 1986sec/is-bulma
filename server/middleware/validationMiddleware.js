const { validationResult } = require('express-validator');

// Genel doğrulama ara yazılımı
const validate = (validations) => {
  return async (req, res, next) => {
    // Tüm doğrulamaları çalıştır
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Hataları kontrol et
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Hataları formatla
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }));

    return res.status(400).json({
      success: false,
      errors: formattedErrors,
    });
  };
};

// Kimlik doğrulama doğrulamaları
const authValidations = {
  register: [
    body('email')
      .isEmail()
      .withMessage('Geçerli bir e-posta adresi giriniz')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Şifre en az 6 karakter olmalıdır')
      .matches(/\d/)
      .withMessage('Şifre en az bir rakam içermelidir'),
    body('name')
      .trim()
      .isLength({ min: 2 })
      .withMessage('İsim en az 2 karakter olmalıdır'),
    body('type')
      .isIn(['employer', 'jobseeker'])
      .withMessage('Geçerli bir kullanıcı türü seçiniz'),
  ],
  login: [
    body('email')
      .isEmail()
      .withMessage('Geçerli bir e-posta adresi giriniz')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Şifre gereklidir'),
  ],
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('İsim en az 2 karakter olmalıdır'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Biyografi en fazla 500 karakter olabilir'),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Konum en az 2 karakter olmalıdır'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Yetenekler bir dizi olmalıdır'),
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Mevcut şifre gereklidir'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Yeni şifre en az 6 karakter olmalıdır')
      .matches(/\d/)
      .withMessage('Yeni şifre en az bir rakam içermelidir'),
  ],
};

// İş ilanı doğrulamaları
const jobValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Başlık 3-100 karakter arasında olmalıdır'),
    body('description')
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage('Açıklama 50-5000 karakter arasında olmalıdır'),
    body('type')
      .isIn(['full-time', 'part-time', 'contract', 'internship'])
      .withMessage('Geçerli bir iş türü seçiniz'),
    body('location')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Konum en az 2 karakter olmalıdır'),
    body('salary')
      .optional()
      .isNumeric()
      .withMessage('Maaş sayısal bir değer olmalıdır'),
    body('experience')
      .optional()
      .isIn(['entry', 'intermediate', 'senior', 'expert'])
      .withMessage('Geçerli bir deneyim seviyesi seçiniz'),
    body('skills')
      .isArray()
      .withMessage('Yetenekler bir dizi olmalıdır'),
  ],
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Başlık 3-100 karakter arasında olmalıdır'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 50, max: 5000 })
      .withMessage('Açıklama 50-5000 karakter arasında olmalıdır'),
    body('type')
      .optional()
      .isIn(['full-time', 'part-time', 'contract', 'internship'])
      .withMessage('Geçerli bir iş türü seçiniz'),
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Konum en az 2 karakter olmalıdır'),
    body('salary')
      .optional()
      .isNumeric()
      .withMessage('Maaş sayısal bir değer olmalıdır'),
    body('experience')
      .optional()
      .isIn(['entry', 'intermediate', 'senior', 'expert'])
      .withMessage('Geçerli bir deneyim seviyesi seçiniz'),
    body('skills')
      .optional()
      .isArray()
      .withMessage('Yetenekler bir dizi olmalıdır'),
  ],
};

// Mesaj doğrulamaları
const messageValidations = {
  send: [
    body('recipientId')
      .isMongoId()
      .withMessage('Geçerli bir alıcı ID\'si giriniz'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Mesaj 1-1000 karakter arasında olmalıdır'),
  ],
};

// Arama doğrulamaları
const searchValidations = {
  jobs: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Arama sorgusu en az 2 karakter olmalıdır'),
    query('type')
      .optional()
      .isIn(['full-time', 'part-time', 'contract', 'internship'])
      .withMessage('Geçerli bir iş türü seçiniz'),
    query('location')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Konum en az 2 karakter olmalıdır'),
    query('experience')
      .optional()
      .isIn(['entry', 'intermediate', 'senior', 'expert'])
      .withMessage('Geçerli bir deneyim seviyesi seçiniz'),
    query('salary')
      .optional()
      .isNumeric()
      .withMessage('Maaş sayısal bir değer olmalıdır'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sayfa numarası 1\'den büyük olmalıdır'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit 1-100 arasında olmalıdır'),
  ],
  users: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Arama sorgusu en az 2 karakter olmalıdır'),
    query('type')
      .optional()
      .isIn(['employer', 'jobseeker'])
      .withMessage('Geçerli bir kullanıcı türü seçiniz'),
    query('skills')
      .optional()
      .isArray()
      .withMessage('Yetenekler bir dizi olmalıdır'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Sayfa numarası 1\'den büyük olmalıdır'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit 1-100 arasında olmalıdır'),
  ],
};

module.exports = {
  validate,
  authValidations,
  jobValidations,
  messageValidations,
  searchValidations,
}; 