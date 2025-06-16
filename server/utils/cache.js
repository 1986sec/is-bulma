import NodeCache from 'node-cache';
import { logger } from './logger.js';

class CacheManager {
  constructor() {
    this.client = new Redis(config.redis);
    this.defaultTTL = 300; // 5 dakika
    this.maxTTL = 86400; // 24 saat

    this.client.on('error', (error) => {
      logger.error('Redis bağlantı hatası:', {
        error: error.message,
      });
    });

    this.client.on('connect', () => {
      logger.info('Redis bağlantısı başarılı');
    });
  }

  // Önbelleğe veri ekle
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const data = JSON.stringify(value);
      const result = await this.client.set(key, data, 'EX', Math.min(ttl, this.maxTTL));

      logger.debug('Önbelleğe veri eklendi:', {
        key,
        ttl,
      });

      return result;
    } catch (error) {
      logger.error('Önbelleğe veri ekleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekten veri al
  async get(key) {
    try {
      const data = await this.client.get(key);

      if (!data) {
        logger.debug('Önbellekte veri bulunamadı:', {
          key,
        });
        return null;
      }

      const value = JSON.parse(data);

      logger.debug('Önbellekten veri alındı:', {
        key,
      });

      return value;
    } catch (error) {
      logger.error('Önbellekten veri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekten veri sil
  async del(key) {
    try {
      const result = await this.client.del(key);

      logger.debug('Önbellekten veri silindi:', {
        key,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekten veri silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekten veri sil (pattern)
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);

        logger.debug('Önbellekten veriler silindi:', {
          pattern,
          count: keys.length,
        });

        return result;
      }

      logger.debug('Önbellekte veri bulunamadı:', {
        pattern,
      });

      return 0;
    } catch (error) {
      logger.error('Önbellekten veri silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri var mı kontrol et
  async exists(key) {
    try {
      const result = await this.client.exists(key);

      logger.debug('Önbellekte veri kontrolü yapıldı:', {
        key,
        exists: result === 1,
      });

      return result === 1;
    } catch (error) {
      logger.error('Önbellekte veri kontrolü hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini güncelle
  async expire(key, ttl) {
    try {
      const result = await this.client.expire(key, Math.min(ttl, this.maxTTL));

      logger.debug('Önbellekte veri süresi güncellendi:', {
        key,
        ttl,
      });

      return result === 1;
    } catch (error) {
      logger.error('Önbellekte veri süresi güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini getir
  async ttl(key) {
    try {
      const ttl = await this.client.ttl(key);

      logger.debug('Önbellekte veri süresi alındı:', {
        key,
        ttl,
      });

      return ttl;
    } catch (error) {
      logger.error('Önbellekte veri süresi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini kaldır
  async persist(key) {
    try {
      const result = await this.client.persist(key);

      logger.debug('Önbellekte veri süresi kaldırıldı:', {
        key,
      });

      return result === 1;
    } catch (error) {
      logger.error('Önbellekte veri süresi kaldırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini artır
  async incr(key) {
    try {
      const result = await this.client.incr(key);

      logger.debug('Önbellekte veri süresi artırıldı:', {
        key,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekte veri süresi artırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini azalt
  async decr(key) {
    try {
      const result = await this.client.decr(key);

      logger.debug('Önbellekte veri süresi azaltıldı:', {
        key,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekte veri süresi azaltma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini artır (belirli miktar)
  async incrBy(key, increment) {
    try {
      const result = await this.client.incrby(key, increment);

      logger.debug('Önbellekte veri süresi artırıldı:', {
        key,
        increment,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekte veri süresi artırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini azalt (belirli miktar)
  async decrBy(key, decrement) {
    try {
      const result = await this.client.decrby(key, decrement);

      logger.debug('Önbellekte veri süresi azaltıldı:', {
        key,
        decrement,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekte veri süresi azaltma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini artır (float)
  async incrByFloat(key, increment) {
    try {
      const result = await this.client.incrbyfloat(key, increment);

      logger.debug('Önbellekte veri süresi artırıldı:', {
        key,
        increment,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekte veri süresi artırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbellekte veri süresini azalt (float)
  async decrByFloat(key, decrement) {
    try {
      const result = await this.client.decrbyfloat(key, decrement);

      logger.debug('Önbellekte veri süresi azaltıldı:', {
        key,
        decrement,
        value: result,
      });

      return result;
    } catch (error) {
      logger.error('Önbellekte veri süresi azaltma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const cache = new CacheManager();
export { cache };
export default cache; 