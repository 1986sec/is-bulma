import fs from 'fs';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import config from '../config.js';
import { logger } from './logger.js';

class FileManager {
  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    this.imageSizes = {
      thumbnail: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
    };

    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(this.uploadDir, file.fieldname);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: this.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Desteklenmeyen dosya türü'));
        }
      },
    });
  }

  // Dosya yükle
  async uploadFile(file, field) {
    try {
      if (!file) {
        throw new Error('Dosya bulunamadı');
      }

      if (!this.allowedTypes.includes(file.mimetype)) {
        throw new Error('Desteklenmeyen dosya türü');
      }

      if (file.size > this.maxFileSize) {
        throw new Error('Dosya boyutu çok büyük');
      }

      const dir = path.join(this.uploadDir, field);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
      const filepath = path.join(dir, filename);

      await fs.promises.writeFile(filepath, file.buffer);

      logger.info('Dosya yükleme başarılı:', {
        field,
        filename,
        size: file.size,
        mimetype: file.mimetype,
      });

      return {
        filename,
        path: filepath,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      logger.error('Dosya yükleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Resim yükle
  async uploadImage(file, field) {
    try {
      if (!file) {
        throw new Error('Dosya bulunamadı');
      }

      if (!file.mimetype.startsWith('image/')) {
        throw new Error('Desteklenmeyen dosya türü');
      }

      if (file.size > this.maxFileSize) {
        throw new Error('Dosya boyutu çok büyük');
      }

      const dir = path.join(this.uploadDir, field);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
      const filepath = path.join(dir, filename);

      const image = sharp(file.buffer);
      const metadata = await image.metadata();

      const sizes = {};
      for (const [size, dimensions] of Object.entries(this.imageSizes)) {
        const sizeFilename = `${path.parse(filename).name}-${size}${path.extname(filename)}`;
        const sizePath = path.join(dir, sizeFilename);

        await image
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center',
          })
          .toFile(sizePath);

        sizes[size] = {
          filename: sizeFilename,
          path: sizePath,
          width: dimensions.width,
          height: dimensions.height,
        };
      }

      logger.info('Resim yükleme başarılı:', {
        field,
        filename,
        size: file.size,
        mimetype: file.mimetype,
        metadata,
        sizes,
      });

      return {
        filename,
        path: filepath,
        size: file.size,
        mimetype: file.mimetype,
        metadata,
        sizes,
      };
    } catch (error) {
      logger.error('Resim yükleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya sil
  async deleteFile(filepath) {
    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Dosya bulunamadı');
      }

      await fs.promises.unlink(filepath);

      logger.info('Dosya silme başarılı:', {
        filepath,
      });
    } catch (error) {
      logger.error('Dosya silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Resim sil
  async deleteImage(filepath) {
    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Dosya bulunamadı');
      }

      const dir = path.dirname(filepath);
      const filename = path.basename(filepath);
      const name = path.parse(filename).name;

      const files = await fs.promises.readdir(dir);
      const imageFiles = files.filter(file => file.startsWith(name));

      await Promise.all(
        imageFiles.map(file => fs.promises.unlink(path.join(dir, file))),
      );

      logger.info('Resim silme başarılı:', {
        filepath,
        files: imageFiles,
      });
    } catch (error) {
      logger.error('Resim silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya taşı
  async moveFile(source, destination) {
    try {
      if (!fs.existsSync(source)) {
        throw new Error('Kaynak dosya bulunamadı');
      }

      const dir = path.dirname(destination);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.rename(source, destination);

      logger.info('Dosya taşıma başarılı:', {
        source,
        destination,
      });
    } catch (error) {
      logger.error('Dosya taşıma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya kopyala
  async copyFile(source, destination) {
    try {
      if (!fs.existsSync(source)) {
        throw new Error('Kaynak dosya bulunamadı');
      }

      const dir = path.dirname(destination);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.copyFile(source, destination);

      logger.info('Dosya kopyalama başarılı:', {
        source,
        destination,
      });
    } catch (error) {
      logger.error('Dosya kopyalama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya yeniden adlandır
  async renameFile(oldPath, newPath) {
    try {
      if (!fs.existsSync(oldPath)) {
        throw new Error('Dosya bulunamadı');
      }

      const dir = path.dirname(newPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await fs.promises.rename(oldPath, newPath);

      logger.info('Dosya yeniden adlandırma başarılı:', {
        oldPath,
        newPath,
      });
    } catch (error) {
      logger.error('Dosya yeniden adlandırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya bilgilerini getir
  async getFileInfo(filepath) {
    try {
      if (!fs.existsSync(filepath)) {
        throw new Error('Dosya bulunamadı');
      }

      const stats = await fs.promises.stat(filepath);

      logger.info('Dosya bilgileri alındı:', {
        filepath,
        stats,
      });

      return {
        path: filepath,
        name: path.basename(filepath),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    } catch (error) {
      logger.error('Dosya bilgileri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dizin içeriğini listele
  async listDirectory(dirpath) {
    try {
      if (!fs.existsSync(dirpath)) {
        throw new Error('Dizin bulunamadı');
      }

      const files = await fs.promises.readdir(dirpath);
      const fileInfos = await Promise.all(
        files.map(file => this.getFileInfo(path.join(dirpath, file))),
      );

      logger.info('Dizin içeriği listelendi:', {
        dirpath,
        count: files.length,
      });

      return fileInfos;
    } catch (error) {
      logger.error('Dizin içeriği listeleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const fileManager = new FileManager();
export { fileManager };
export default fileManager; 