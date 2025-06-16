const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');
const User = require('../models/User');
const Job = require('../models/Job');

// @desc    Profil resmi yükleme
// @route   POST /api/upload/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir dosya yükleyin',
      });
    }

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Sadece JPEG, PNG ve GIF dosyaları yüklenebilir',
      });
    }

    // Dosya boyutu kontrolü (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu 2MB\'dan küçük olmalıdır',
      });
    }

    // Eski avatarı sil
    const user = await User.findById(req.user.id);
    if (user.avatar) {
      const oldAvatarPath = path.join(__dirname, '..', 'uploads', 'avatars', user.avatar);
      try {
        await fs.unlink(oldAvatarPath);
      } catch (error) {
        logger.error('Old avatar delete error:', error);
      }
    }

    // Kullanıcıyı güncelle
    user.avatar = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        avatar: req.file.filename,
      },
    });
  } catch (error) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken bir hata oluştu',
    });
  }
};

// @desc    CV yükleme
// @route   POST /api/upload/cv
// @access  Private
exports.uploadCV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir dosya yükleyin',
      });
    }

    // Dosya türü kontrolü
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Sadece PDF ve Word dosyaları yüklenebilir',
      });
    }

    // Dosya boyutu kontrolü (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu 5MB\'dan küçük olmalıdır',
      });
    }

    // Eski CV'yi sil
    const user = await User.findById(req.user.id);
    if (user.cv) {
      const oldCVPath = path.join(__dirname, '..', 'uploads', 'cvs', user.cv);
      try {
        await fs.unlink(oldCVPath);
      } catch (error) {
        logger.error('Old CV delete error:', error);
      }
    }

    // Kullanıcıyı güncelle
    user.cv = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        cv: req.file.filename,
      },
    });
  } catch (error) {
    logger.error('CV upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken bir hata oluştu',
    });
  }
};

// @desc    İş ilanı görseli yükleme
// @route   POST /api/upload/job-image
// @access  Private
exports.uploadJobImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen bir dosya yükleyin',
      });
    }

    // Dosya türü kontrolü
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Sadece JPEG ve PNG dosyaları yüklenebilir',
      });
    }

    // Dosya boyutu kontrolü (max 1MB)
    const maxSize = 1 * 1024 * 1024;
    if (req.file.size > maxSize) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu 1MB\'dan küçük olmalıdır',
      });
    }

    // İş ilanını güncelle
    const job = await Job.findById(req.body.jobId);
    if (!job) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    // Yetki kontrolü
    if (job.company.toString() !== req.user.id) {
      // Yüklenen dosyayı sil
      await fs.unlink(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Eski görseli sil
    if (job.image) {
      const oldImagePath = path.join(__dirname, '..', 'uploads', 'jobs', job.image);
      try {
        await fs.unlink(oldImagePath);
      } catch (error) {
        logger.error('Old job image delete error:', error);
      }
    }

    // İş ilanını güncelle
    job.image = req.file.filename;
    await job.save();

    res.status(200).json({
      success: true,
      data: {
        image: req.file.filename,
      },
    });
  } catch (error) {
    logger.error('Job image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken bir hata oluştu',
    });
  }
};

// @desc    Dosya silme
// @route   DELETE /api/upload/:type/:filename
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { type, filename } = req.params;

    // Dosya türü kontrolü
    const allowedTypes = ['avatar', 'cv', 'job-image'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz dosya türü',
      });
    }

    // Dosya yolunu belirle
    let filePath;
    let updateField;
    let model;

    switch (type) {
      case 'avatar':
        filePath = path.join(__dirname, '..', 'uploads', 'avatars', filename);
        updateField = 'avatar';
        model = User;
        break;
      case 'cv':
        filePath = path.join(__dirname, '..', 'uploads', 'cvs', filename);
        updateField = 'cv';
        model = User;
        break;
      case 'job-image':
        filePath = path.join(__dirname, '..', 'uploads', 'jobs', filename);
        updateField = 'image';
        model = Job;
        break;
    }

    // Dosyayı sil
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.error('File delete error:', error);
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı',
      });
    }

    // Veritabanını güncelle
    if (type === 'job-image') {
      await model.updateMany({ [updateField]: filename }, { $unset: { [updateField]: 1 } });
    } else {
      await model.updateOne({ _id: req.user.id }, { $unset: { [updateField]: 1 } });
    }

    res.status(200).json({
      success: true,
      message: 'Dosya başarıyla silindi',
    });
  } catch (error) {
    logger.error('File delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya silinirken bir hata oluştu',
    });
  }
}; 