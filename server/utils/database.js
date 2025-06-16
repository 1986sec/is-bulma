import mongoose from 'mongoose';
import { config } from './config.js';
import { logger } from './logger.js';

class Database {
  constructor() {
    this.uri = config.database.uri;
    this.options = config.database.options;
  }

  // Sequelize bağlantısını oluştur
  async connect() {
    try {
      await mongoose.connect(this.uri, this.options);
      logger.info('Veritabanı bağlantısı başarılı');
    } catch (error) {
      logger.error('Veritabanı bağlantı hatası:', {
        error: error.message,
      });
    }
  }

  // Bağlantı olaylarını dinle
  async testConnection() {
    try {
      await mongoose.connection.getClient().db.admin().ping();
      logger.info('Veritabanı bağlantısı test edildi');
      return true;
    } catch (error) {
      logger.error('Veritabanı bağlantı testi hatası:', {
        error: error.message,
      });
      return false;
    }
  }

  // Bağlantıyı kapat
  async closeConnection() {
    try {
      await mongoose.connection.close();
      logger.info('Veritabanı bağlantısı kapatıldı');
    } catch (error) {
      logger.error('Veritabanı bağlantısı kapatma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantıyı yeniden başlat
  async restartConnection() {
    try {
      await this.closeConnection();
      await this.connect();
      logger.info('Veritabanı bağlantısı yeniden başlatıldı');
    } catch (error) {
      logger.error('Veritabanı bağlantısı yeniden başlatma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı durumunu kontrol et
  async checkConnection() {
    try {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        await this.restartConnection();
      }
      return isConnected;
    } catch (error) {
      logger.error('Veritabanı bağlantı durumu kontrol hatası:', {
        error: error.message,
      });
      return false;
    }
  }

  // Bağlantı havuzu durumunu al
  getPoolStatus() {
    try {
      const status = {
        max: mongoose.connection.getClient().pool.max,
        min: mongoose.connection.getClient().pool.min,
        size: mongoose.connection.getClient().pool.size,
        available: mongoose.connection.getClient().pool.available,
        borrowed: mongoose.connection.getClient().pool.borrowed,
        pending: mongoose.connection.getClient().pool.pending,
      };

      logger.info('Veritabanı bağlantı havuzu durumu alındı:', status);
      return status;
    } catch (error) {
      logger.error('Veritabanı bağlantı havuzu durumu alma hatası:', {
        error: error.message,
      });
      return null;
    }
  }

  // Bağlantı havuzunu sıfırla
  async resetPool() {
    try {
      await mongoose.connection.getClient().pool.drain();
      await mongoose.connection.getClient().pool.clear();
      logger.info('Veritabanı bağlantı havuzu sıfırlandı');
    } catch (error) {
      logger.error('Veritabanı bağlantı havuzu sıfırlama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı havuzunu yeniden yapılandır
  async reconfigurePool(options) {
    try {
      await mongoose.connection.getClient().pool.drain();
      await mongoose.connection.getClient().pool.clear();
      mongoose.connection.getClient().pool.max = options.max || 5;
      mongoose.connection.getClient().pool.min = options.min || 0;
      mongoose.connection.getClient().pool.acquire = options.acquire || 30000;
      mongoose.connection.getClient().pool.idle = options.idle || 10000;
      logger.info('Veritabanı bağlantı havuzu yeniden yapılandırıldı:', options);
    } catch (error) {
      logger.error('Veritabanı bağlantı havuzu yeniden yapılandırma hatası:', {
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı havuzunu genişlet
  async expandPool(size) {
    try {
      const currentMax = mongoose.connection.getClient().pool.max;
      await this.reconfigurePool({
        max: currentMax + size,
        min: mongoose.connection.getClient().pool.min,
        acquire: mongoose.connection.getClient().pool.acquire,
        idle: mongoose.connection.getClient().pool.idle,
      });
      logger.info('Veritabanı bağlantı havuzu genişletildi:', { size });
    } catch (error) {
      logger.error('Veritabanı bağlantı havuzu genişletme hatası:', {
        size,
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı havuzunu daralt
  async shrinkPool(size) {
    try {
      const currentMax = mongoose.connection.getClient().pool.max;
      const newMax = Math.max(currentMax - size, mongoose.connection.getClient().pool.min);
      await this.reconfigurePool({
        max: newMax,
        min: mongoose.connection.getClient().pool.min,
        acquire: mongoose.connection.getClient().pool.acquire,
        idle: mongoose.connection.getClient().pool.idle,
      });
      logger.info('Veritabanı bağlantı havuzu daraltıldı:', { size });
    } catch (error) {
      logger.error('Veritabanı bağlantı havuzu daraltma hatası:', {
        size,
        error: error.message,
      });
      throw error;
    }
  }

  // Bağlantı havuzunu optimize et
  async optimizePool() {
    try {
      const status = this.getPoolStatus();
      if (!status) {
        throw new Error('Bağlantı havuzu durumu alınamadı');
      }

      const { size, available, borrowed, pending } = status;
      const utilization = (borrowed / size) * 100;
      const waitRatio = pending / (available + borrowed);

      let newMax = size;
      if (utilization > 80 && waitRatio > 0.5) {
        newMax = Math.min(size * 1.5, 20);
      } else if (utilization < 20 && size > 5) {
        newMax = Math.max(size * 0.8, 5);
      }

      if (newMax !== size) {
        await this.reconfigurePool({
          max: newMax,
          min: mongoose.connection.getClient().pool.min,
          acquire: mongoose.connection.getClient().pool.acquire,
          idle: mongoose.connection.getClient().pool.idle,
        });
        logger.info('Veritabanı bağlantı havuzu optimize edildi:', {
          oldSize: size,
          newSize: newMax,
          utilization,
          waitRatio,
        });
      }
    } catch (error) {
      logger.error('Veritabanı bağlantı havuzu optimizasyon hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const database = new Database();
export { database };
export default database; 