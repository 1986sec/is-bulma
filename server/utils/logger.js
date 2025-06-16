import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LoggerManager {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.createLogDir();

    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'is-bulma' },
      transports: [
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    }

    this.logger.on('error', (error) => {
      console.error('Logger error:', error);
    });
  }

  // Log dizini oluştur
  createLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Log dizini oluşturma hatası:', error);
    }
  }

  // Hata logla
  error(message, meta = {}) {
    try {
      this.logger.error(message, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Uyarı logla
  warn(message, meta = {}) {
    try {
      this.logger.warn(message, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Bilgi logla
  info(message, meta = {}) {
    try {
      this.logger.info(message, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Debug logla
  debug(message, meta = {}) {
    try {
      this.logger.debug(message, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // HTTP isteği logla
  http(message, meta = {}) {
    try {
      this.logger.http(message, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Veritabanı işlemi logla
  db(message, meta = {}) {
    try {
      this.logger.info(`[DB] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // API isteği logla
  api(message, meta = {}) {
    try {
      this.logger.info(`[API] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Önbellek işlemi logla
  cache(message, meta = {}) {
    try {
      this.logger.info(`[CACHE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // E-posta işlemi logla
  email(message, meta = {}) {
    try {
      this.logger.info(`[EMAIL] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya işlemi logla
  file(message, meta = {}) {
    try {
      this.logger.info(`[FILE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Güvenlik işlemi logla
  security(message, meta = {}) {
    try {
      this.logger.info(`[SECURITY] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Performans işlemi logla
  performance(message, meta = {}) {
    try {
      this.logger.info(`[PERFORMANCE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // İş işlemi logla
  job(message, meta = {}) {
    try {
      this.logger.info(`[JOB] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Kullanıcı işlemi logla
  user(message, meta = {}) {
    try {
      this.logger.info(`[USER] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Şirket işlemi logla
  company(message, meta = {}) {
    try {
      this.logger.info(`[COMPANY] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Başvuru işlemi logla
  application(message, meta = {}) {
    try {
      this.logger.info(`[APPLICATION] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Mesaj işlemi logla
  message(message, meta = {}) {
    try {
      this.logger.info(`[MESSAGE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Bildirim işlemi logla
  notification(message, meta = {}) {
    try {
      this.logger.info(`[NOTIFICATION] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Arama işlemi logla
  search(message, meta = {}) {
    try {
      this.logger.info(`[SEARCH] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // İstatistik işlemi logla
  stats(message, meta = {}) {
    try {
      this.logger.info(`[STATS] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Ödeme işlemi logla
  payment(message, meta = {}) {
    try {
      this.logger.info(`[PAYMENT] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya yükleme işlemi logla
  upload(message, meta = {}) {
    try {
      this.logger.info(`[UPLOAD] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya indirme işlemi logla
  download(message, meta = {}) {
    try {
      this.logger.info(`[DOWNLOAD] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya silme işlemi logla
  delete(message, meta = {}) {
    try {
      this.logger.info(`[DELETE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya taşıma işlemi logla
  move(message, meta = {}) {
    try {
      this.logger.info(`[MOVE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya kopyalama işlemi logla
  copy(message, meta = {}) {
    try {
      this.logger.info(`[COPY] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya yeniden adlandırma işlemi logla
  rename(message, meta = {}) {
    try {
      this.logger.info(`[RENAME] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya oluşturma işlemi logla
  create(message, meta = {}) {
    try {
      this.logger.info(`[CREATE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya güncelleme işlemi logla
  update(message, meta = {}) {
    try {
      this.logger.info(`[UPDATE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya okuma işlemi logla
  read(message, meta = {}) {
    try {
      this.logger.info(`[READ] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya yazma işlemi logla
  write(message, meta = {}) {
    try {
      this.logger.info(`[WRITE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya listeleme işlemi logla
  list(message, meta = {}) {
    try {
      this.logger.info(`[LIST] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya arama işlemi logla
  find(message, meta = {}) {
    try {
      this.logger.info(`[FIND] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya filtreleme işlemi logla
  filter(message, meta = {}) {
    try {
      this.logger.info(`[FILTER] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya sıralama işlemi logla
  sort(message, meta = {}) {
    try {
      this.logger.info(`[SORT] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }

  // Dosya sayfalama işlemi logla
  paginate(message, meta = {}) {
    try {
      this.logger.info(`[PAGINATE] ${message}`, meta);
    } catch (error) {
      console.error('Loglama hatası:', error);
    }
  }
}

const logger = new LoggerManager();
export { logger };
export default logger; 