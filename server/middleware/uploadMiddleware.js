const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Yükleme dizinlerini oluştur
const createUploadDirs = () => {
  const dirs = ['avatars', 'cvs', 'jobs'];
  dirs.forEach((dir) => {
    const dirPath = path.join(__dirname, '..', 'uploads', dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
};

// Dosya adı oluştur
const generateFilename = (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  return uniqueSuffix + path.extname(file.originalname);
};

// Depolama yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    switch (file.fieldname) {
      case 'avatar':
        uploadPath = path.join(__dirname, '..', 'uploads', 'avatars');
        break;
      case 'cv':
        uploadPath = path.join(__dirname, '..', 'uploads', 'cvs');
        break;
      case 'image':
        uploadPath = path.join(__dirname, '..', 'uploads', 'jobs');
        break;
      default:
        return cb(new Error('Geçersiz dosya türü'));
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file));
  },
});

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // Dosya türü kontrolü
  const allowedTypes = {
    avatar: ['image/jpeg', 'image/png', 'image/gif'],
    cv: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    image: ['image/jpeg', 'image/png'],
  };

  const allowedMimeTypes = allowedTypes[file.fieldname];

  if (!allowedMimeTypes) {
    return cb(new Error('Geçersiz dosya türü'));
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Desteklenmeyen dosya formatı'));
  }

  cb(null, true);
};

// Dosya boyutu limitleri
const limits = {
  avatar: 2 * 1024 * 1024, // 2MB
  cv: 5 * 1024 * 1024, // 5MB
  image: 1 * 1024 * 1024, // 1MB
};

// Multer yapılandırması
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (req, file) => {
      return limits[file.fieldname] || 1 * 1024 * 1024; // Varsayılan 1MB
    },
  },
});

// Hata işleme
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu çok büyük',
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Dosya yükleme hatası',
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

// Yükleme dizinlerini oluştur
createUploadDirs();

module.exports = {
  upload,
  handleUploadError,
}; 