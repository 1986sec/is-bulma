import mongoose from 'mongoose';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import fs from 'fs';

class Database {
  constructor() {
    this.uri = config.database.uri;
    this.options = config.database.options;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 saniye
  }

  // Veritabanına bağlan
  async connect() {
    try {
      await this._connectWithRetry();
      this._setupEventListeners();
      this._setupProcessHandlers();
      logger.info('Veritabanı bağlantısı başarılı');
    } catch (error) {
      logger.error('Veritabanı bağlantı hatası:', {
        error: error.message,
        attempts: this.retryAttempts,
      });
      throw error;
    }
  }

  // Yeniden deneme ile bağlantı
  async _connectWithRetry() {
    while (this.retryAttempts < this.maxRetries) {
      try {
        await mongoose.connect(this.uri, this.options);
        this.retryAttempts = 0;
        return;
      } catch (error) {
        this.retryAttempts++;
        logger.warn(`Veritabanı bağlantı denemesi ${this.retryAttempts}/${this.maxRetries} başarısız:`, {
          error: error.message,
        });

        if (this.retryAttempts === this.maxRetries) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  // Event listener'ları ayarla
  _setupEventListeners() {
    mongoose.connection.on('error', (error) => {
      logger.error('Veritabanı bağlantı hatası:', {
        error: error.message,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Veritabanı bağlantısı kesildi');
      this._handleDisconnect();
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Veritabanı bağlantısı yeniden kuruldu');
    });
  }

  // Process handler'ları ayarla
  _setupProcessHandlers() {
    process.on('SIGINT', this._handleGracefulShutdown.bind(this));
    process.on('SIGTERM', this._handleGracefulShutdown.bind(this));
  }

  // Bağlantı kesildiğinde yeniden bağlanmayı dene
  async _handleDisconnect() {
    try {
      await this._connectWithRetry();
    } catch (error) {
      logger.error('Veritabanı yeniden bağlanma hatası:', {
        error: error.message,
      });
    }
  }

  // Graceful shutdown
  async _handleGracefulShutdown() {
    try {
      await mongoose.connection.close();
      logger.info('Veritabanı bağlantısı kapatıldı');
      process.exit(0);
    } catch (error) {
      logger.error('Veritabanı bağlantısı kapatma hatası:', {
        error: error.message,
      });
      process.exit(1);
    }
  }

  // Veritabanı bağlantısını kapat
  async disconnect() {
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

  // Veritabanı durumunu kontrol et
  async checkConnection() {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      logger.debug('Veritabanı durumu:', {
        state: states[state],
      });

      return state === 1;
    } catch (error) {
      logger.error('Veritabanı durumu kontrol hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı istatistiklerini al
  async getStats() {
    try {
      const stats = await mongoose.connection.db.stats();

      logger.debug('Veritabanı istatistikleri alındı:', {
        stats,
      });

      return stats;
    } catch (error) {
      logger.error('Veritabanı istatistikleri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı koleksiyonlarını listele
  async listCollections() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();

      logger.debug('Veritabanı koleksiyonları listelendi:', {
        count: collections.length,
      });

      return collections;
    } catch (error) {
      logger.error('Veritabanı koleksiyonları listeleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı koleksiyonunu oluştur
  async createCollection(name, options = {}) {
    try {
      await mongoose.connection.db.createCollection(name, options);

      logger.info('Veritabanı koleksiyonu oluşturuldu:', {
        name,
        options,
      });
    } catch (error) {
      logger.error('Veritabanı koleksiyonu oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı koleksiyonunu sil
  async dropCollection(name) {
    try {
      await mongoose.connection.db.dropCollection(name);

      logger.info('Veritabanı koleksiyonu silindi:', {
        name,
      });
    } catch (error) {
      logger.error('Veritabanı koleksiyonu silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı indeksini oluştur
  async createIndex(collection, index, options = {}) {
    try {
      await mongoose.connection.db.collection(collection).createIndex(index, options);

      logger.info('Veritabanı indeksi oluşturuldu:', {
        collection,
        index,
        options,
      });
    } catch (error) {
      logger.error('Veritabanı indeksi oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı indeksini sil
  async dropIndex(collection, index) {
    try {
      await mongoose.connection.db.collection(collection).dropIndex(index);

      logger.info('Veritabanı indeksi silindi:', {
        collection,
        index,
      });
    } catch (error) {
      logger.error('Veritabanı indeksi silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı indekslerini listele
  async listIndexes(collection) {
    try {
      const indexes = await mongoose.connection.db.collection(collection).indexes();

      logger.debug('Veritabanı indeksleri listelendi:', {
        collection,
        count: indexes.length,
      });

      return indexes;
    } catch (error) {
      logger.error('Veritabanı indeksleri listeleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı yedeği al
  async backup(path) {
    try {
      const collections = await this.listCollections();
      const backup = {};

      for (const collection of collections) {
        const name = collection.name;
        const documents = await mongoose.connection.db.collection(name).find().toArray();
        backup[name] = documents;
      }

      await fs.promises.writeFile(path, JSON.stringify(backup, null, 2));

      logger.info('Veritabanı yedeği alındı:', {
        path,
      });
    } catch (error) {
      logger.error('Veritabanı yedeği alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Veritabanı yedeğini geri yükle
  async restore(path) {
    try {
      const backup = JSON.parse(await fs.promises.readFile(path, 'utf8'));

      for (const [name, documents] of Object.entries(backup)) {
        await mongoose.connection.db.collection(name).insertMany(documents);
      }

      logger.info('Veritabanı yedeği geri yüklendi:', {
        path,
      });
    } catch (error) {
      logger.error('Veritabanı yedeği geri yükleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const database = new Database();
export { database };
export default database; 