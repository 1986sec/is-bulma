const Company = require('../models/company');
const Job = require('../models/job');
const logger = require('./logger');
const notification = require('./notification');
const cache = require('./cache');

class CompanyManager {
  constructor() {
    this.cacheDuration = 300; // 5 dakika
    this.defaultLimit = 10;
    this.maxLimit = 50;
  }

  // Şirket oluştur
  async createCompany(data) {
    try {
      const company = await Company.create(data);
      await this.clearCache();

      logger.info('Şirket oluşturuldu:', {
        companyId: company.id,
      });

      return company;
    } catch (error) {
      logger.error('Şirket oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket güncelle
  async updateCompany(id, data) {
    try {
      const company = await Company.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!company) {
        throw new Error('Şirket bulunamadı');
      }

      await this.clearCache(company.id);

      logger.info('Şirket güncellendi:', {
        companyId: company.id,
      });

      return company;
    } catch (error) {
      logger.error('Şirket güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket sil
  async deleteCompany(id) {
    try {
      const company = await Company.findByIdAndDelete(id);

      if (!company) {
        throw new Error('Şirket bulunamadı');
      }

      await this.clearCache(company.id);

      logger.info('Şirket silindi:', {
        companyId: company.id,
      });

      return company;
    } catch (error) {
      logger.error('Şirket silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket getir
  async getCompany(id) {
    try {
      const company = await Company.findById(id);

      if (!company) {
        throw new Error('Şirket bulunamadı');
      }

      logger.info('Şirket getirildi:', {
        companyId: company.id,
      });

      return company;
    } catch (error) {
      logger.error('Şirket getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket listesi
  async getCompanies(options = {}) {
    try {
      const cacheKey = `companies:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Şirket listesi önbellekten alındı:', {
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
        industry,
        location,
        size,
        status,
        search,
      } = options;

      const query = {};

      if (industry) query.industry = industry;
      if (location) query.location = location;
      if (size) query.size = size;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const companies = await Company.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await Company.countDocuments(query);

      const data = {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Şirket listesi alındı:', {
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Şirket listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Popüler şirketler
  async getPopularCompanies(options = {}) {
    try {
      const cacheKey = `companies:popular:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Popüler şirketler önbellekten alındı:', {
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-viewCount',
      } = options;

      const companies = await Company.find({ status: 'active' })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await Company.countDocuments({ status: 'active' });

      const data = {
        companies,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Popüler şirketler alındı:', {
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Popüler şirketler alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket istatistikleri
  async getCompanyStats(companyId = null) {
    try {
      const cacheKey = `companies:stats:${companyId || 'all'}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Şirket istatistikleri önbellekten alındı:', {
          companyId,
        });
        return cachedData;
      }

      const query = companyId ? { companyId } : {};

      const [
        total,
        active,
        inactive,
        verified,
      ] = await Promise.all([
        Company.countDocuments(query),
        Company.countDocuments({ ...query, status: 'active' }),
        Company.countDocuments({ ...query, status: 'inactive' }),
        Company.countDocuments({ ...query, verified: true }),
      ]);

      const stats = {
        total,
        active,
        inactive,
        verified,
        activeRate: total ? (active / total) * 100 : 0,
        inactiveRate: total ? (inactive / total) * 100 : 0,
        verifiedRate: total ? (verified / total) * 100 : 0,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Şirket istatistikleri alındı:', {
        companyId,
        stats,
      });

      return stats;
    } catch (error) {
      logger.error('Şirket istatistikleri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket durumunu güncelle
  async updateCompanyStatus(id, status) {
    try {
      const company = await Company.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      );

      if (!company) {
        throw new Error('Şirket bulunamadı');
      }

      await this.clearCache(company.id);

      logger.info('Şirket durumu güncellendi:', {
        companyId: company.id,
        status,
      });

      return company;
    } catch (error) {
      logger.error('Şirket durumu güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket doğrulama durumunu güncelle
  async updateCompanyVerification(id, verified) {
    try {
      const company = await Company.findByIdAndUpdate(
        id,
        { verified },
        { new: true },
      );

      if (!company) {
        throw new Error('Şirket bulunamadı');
      }

      await this.clearCache(company.id);

      logger.info('Şirket doğrulama durumu güncellendi:', {
        companyId: company.id,
        verified,
      });

      return company;
    } catch (error) {
      logger.error('Şirket doğrulama durumu güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket görüntülenme sayısını artır
  async incrementViewCount(id) {
    try {
      const company = await Company.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true },
      );

      if (!company) {
        throw new Error('Şirket bulunamadı');
      }

      logger.info('Şirket görüntülenme sayısı artırıldı:', {
        companyId: company.id,
        viewCount: company.viewCount,
      });

      return company;
    } catch (error) {
      logger.error('Şirket görüntülenme sayısı artırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbelleği temizle
  async clearCache(companyId = null) {
    try {
      const keys = ['companies:*'];
      if (companyId) {
        keys.push(`companies:${companyId}:*`);
      }

      await cache.del(keys);

      logger.debug('Şirket önbelleği temizlendi:', {
        companyId,
        keys,
      });
    } catch (error) {
      logger.error('Şirket önbelleği temizleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new CompanyManager(); 