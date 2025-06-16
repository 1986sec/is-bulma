import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import config from './config.js';
import { logger } from './logger.js';
import { security } from './security.js';

class UploadManager {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      video: ['video/mp4', 'video/webm'],
      audio: ['audio/mpeg', 'audio/wav'],
    };
  }

  // Upload dizinini oluştur
  async createUploadDir() {
    try {
      await fs.promises.mkdir(this.uploadDir, { recursive: true });
      logger.info('Upload dizini oluşturuldu:', { path: this.uploadDir });
    } catch (error) {
      logger.error('Upload dizini oluşturma hatası:', {
        path: this.uploadDir,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya adı oluştur
  generateFileName(originalName) {
    try {
      const timestamp = Date.now();
      const random = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(originalName);
      const fileName = `${timestamp}-${random}${extension}`;
      logger.info('Dosya adı oluşturuldu:', { fileName });
      return fileName;
    } catch (error) {
      logger.error('Dosya adı oluşturma hatası:', {
        originalName,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya tipini kontrol et
  validateFileType(file, type) {
    try {
      const isValid = this.allowedTypes[type].includes(file.mimetype);
      logger.info('Dosya tipi kontrolü yapıldı:', {
        fileName: file.originalname,
        type,
        isValid,
      });
      return isValid;
    } catch (error) {
      logger.error('Dosya tipi kontrolü hatası:', {
        fileName: file.originalname,
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya boyutunu kontrol et
  validateFileSize(file) {
    try {
      const isValid = file.size <= this.maxFileSize;
      logger.info('Dosya boyutu kontrolü yapıldı:', {
        fileName: file.originalname,
        size: file.size,
        isValid,
      });
      return isValid;
    } catch (error) {
      logger.error('Dosya boyutu kontrolü hatası:', {
        fileName: file.originalname,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya yükleme
  async uploadFile(file, type) {
    try {
      // Dizin kontrolü
      await this.createUploadDir();

      // Dosya tipi kontrolü
      if (!this.validateFileType(file, type)) {
        throw new Error('Geçersiz dosya tipi');
      }

      // Dosya boyutu kontrolü
      if (!this.validateFileSize(file)) {
        throw new Error('Dosya boyutu çok büyük');
      }

      // Dosya adı oluştur
      const fileName = this.generateFileName(file.originalname);
      const filePath = path.join(this.uploadDir, fileName);

      // Dosyayı kaydet
      await fs.promises.writeFile(filePath, file.buffer);

      logger.info('Dosya yüklendi:', {
        fileName,
        type,
        size: file.size,
      });

      return {
        fileName,
        filePath,
        type,
        size: file.size,
      };
    } catch (error) {
      logger.error('Dosya yükleme hatası:', {
        fileName: file.originalname,
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya silme
  async deleteFile(fileName) {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.promises.unlink(filePath);
      logger.info('Dosya silindi:', { fileName });
      return true;
    } catch (error) {
      logger.error('Dosya silme hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya taşıma
  async moveFile(fileName, newPath) {
    try {
      const oldPath = path.join(this.uploadDir, fileName);
      const newFilePath = path.join(this.uploadDir, newPath);

      // Yeni dizini oluştur
      await fs.promises.mkdir(path.dirname(newFilePath), { recursive: true });

      // Dosyayı taşı
      await fs.promises.rename(oldPath, newFilePath);

      logger.info('Dosya taşındı:', {
        fileName,
        newPath,
      });

      return {
        fileName,
        newPath,
      };
    } catch (error) {
      logger.error('Dosya taşıma hatası:', {
        fileName,
        newPath,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya kopyalama
  async copyFile(fileName, newPath) {
    try {
      const oldPath = path.join(this.uploadDir, fileName);
      const newFilePath = path.join(this.uploadDir, newPath);

      // Yeni dizini oluştur
      await fs.promises.mkdir(path.dirname(newFilePath), { recursive: true });

      // Dosyayı kopyala
      await fs.promises.copyFile(oldPath, newFilePath);

      logger.info('Dosya kopyalandı:', {
        fileName,
        newPath,
      });

      return {
        fileName,
        newPath,
      };
    } catch (error) {
      logger.error('Dosya kopyalama hatası:', {
        fileName,
        newPath,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya bilgilerini al
  async getFileInfo(fileName) {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      const stats = await fs.promises.stat(filePath);

      logger.info('Dosya bilgileri alındı:', {
        fileName,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      });

      return {
        fileName,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.error('Dosya bilgileri alma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya listesi al
  async getFileList(dir = '') {
    try {
      const dirPath = path.join(this.uploadDir, dir);
      const files = await fs.promises.readdir(dirPath);

      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isDirectory: stats.isDirectory(),
          };
        })
      );

      logger.info('Dosya listesi alındı:', {
        dir,
        count: fileList.length,
      });

      return fileList;
    } catch (error) {
      logger.error('Dosya listesi alma hatası:', {
        dir,
        error: error.message,
      });
      throw error;
    }
  }

  // Dizin oluştur
  async createDirectory(dir) {
    try {
      const dirPath = path.join(this.uploadDir, dir);
      await fs.promises.mkdir(dirPath, { recursive: true });
      logger.info('Dizin oluşturuldu:', { dir });
      return true;
    } catch (error) {
      logger.error('Dizin oluşturma hatası:', {
        dir,
        error: error.message,
      });
      throw error;
    }
  }

  // Dizin sil
  async deleteDirectory(dir) {
    try {
      const dirPath = path.join(this.uploadDir, dir);
      await fs.promises.rmdir(dirPath, { recursive: true });
      logger.info('Dizin silindi:', { dir });
      return true;
    } catch (error) {
      logger.error('Dizin silme hatası:', {
        dir,
        error: error.message,
      });
      throw error;
    }
  }

  // Dizin temizle
  async clearDirectory(dir = '') {
    try {
      const dirPath = path.join(this.uploadDir, dir);
      const files = await fs.promises.readdir(dirPath);

      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(dirPath, file);
          const stats = await fs.promises.stat(filePath);

          if (stats.isDirectory()) {
            await this.deleteDirectory(path.join(dir, file));
          } else {
            await this.deleteFile(path.join(dir, file));
          }
        })
      );

      logger.info('Dizin temizlendi:', { dir });
      return true;
    } catch (error) {
      logger.error('Dizin temizleme hatası:', {
        dir,
        error: error.message,
      });
      throw error;
    }
  }

  // Dizin oluştur
  async createDirectory(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      logger.info('Dizin oluşturuldu:', { path: dirPath });
    } catch (error) {
      logger.error('Dizin oluşturma hatası:', {
        path: dirPath,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya adı oluştur
  generateFilename(originalname) {
    try {
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = path.extname(originalname);
      const sanitizedFilename = security.sanitizeFilename(
        path.basename(originalname, extension)
      );
      return `${sanitizedFilename}-${timestamp}-${randomString}${extension}`;
    } catch (error) {
      logger.error('Dosya adı oluşturma hatası:', {
        originalname,
        error: error.message,
      });
      throw error;
    }
  }

  // Depolama yapılandırması
  getStorageConfig(type) {
    try {
      const dirPath = path.join(this.uploadDir, type);
      this.createDirectory(dirPath);

      return multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, dirPath);
        },
        filename: (req, file, cb) => {
          const filename = this.generateFilename(file.originalname);
          cb(null, filename);
        },
      });
    } catch (error) {
      logger.error('Depolama yapılandırma hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya filtresi
  fileFilter(type) {
    return (req, file, cb) => {
      try {
        if (this.allowedTypes[type].includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              `Geçersiz dosya türü. İzin verilen türler: ${this.allowedTypes[
                type
              ].join(', ')}`
            ),
            false
          );
        }
      } catch (error) {
        logger.error('Dosya filtreleme hatası:', {
          type,
          mimetype: file.mimetype,
          error: error.message,
        });
        cb(error, false);
      }
    };
  }

  // Multer yapılandırması
  getMulterConfig(type) {
    try {
      return {
        storage: this.getStorageConfig(type),
        fileFilter: this.fileFilter(type),
        limits: {
          fileSize: this.maxFileSize,
        },
      };
    } catch (error) {
      logger.error('Multer yapılandırma hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Avatar yükleme
  uploadAvatar() {
    try {
      return multer(this.getMulterConfig('image'));
    } catch (error) {
      logger.error('Avatar yükleme yapılandırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // CV yükleme
  uploadCV() {
    try {
      return multer(this.getMulterConfig('document'));
    } catch (error) {
      logger.error('CV yükleme yapılandırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı resmi yükleme
  uploadJobImage() {
    try {
      return multer(this.getMulterConfig('image'));
    } catch (error) {
      logger.error('İş ilanı resmi yükleme yapılandırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya boyutu kontrolü
  checkFileSize(file) {
    try {
      if (file.size > this.maxFileSize) {
        throw new Error(
          `Dosya boyutu çok büyük. Maksimum boyut: ${
            this.maxFileSize / 1024 / 1024
          }MB`
        );
      }
      return true;
    } catch (error) {
      logger.error('Dosya boyutu kontrol hatası:', {
        size: file.size,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya türü kontrolü
  checkFileType(file, type) {
    try {
      if (!this.allowedTypes[type].includes(file.mimetype)) {
        throw new Error(
          `Geçersiz dosya türü. İzin verilen türler: ${this.allowedTypes[
            type
          ].join(', ')}`
        );
      }
      return true;
    } catch (error) {
      logger.error('Dosya türü kontrol hatası:', {
        mimetype: file.mimetype,
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya yolu oluştur
  getFilePath(type, filename) {
    try {
      return path.join(this.uploadDir, type, filename);
    } catch (error) {
      logger.error('Dosya yolu oluşturma hatası:', {
        type,
        filename,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya URL'i oluştur
  getFileUrl(type, filename) {
    try {
      return `/uploads/${type}/${filename}`;
    } catch (error) {
      logger.error('Dosya URL oluşturma hatası:', {
        type,
        filename,
        error: error.message,
      });
      throw error;
    }
  }
}

const upload = new UploadManager();
export { upload };
export default upload; 