const Job = require('../models/job');
const logger = require('./logger');
const notification = require('./notification');
const cache = require('./cache');

class JobManager {
  constructor() {
    this.cacheDuration = 300; // 5 dakika
    this.defaultLimit = 10;
    this.maxLimit = 50;
  }

  // İş ilanı oluştur
  async createJob(data) {
    try {
      const job = await Job.create(data);
      await this.clearCache();

      logger.info('İş ilanı oluşturuldu:', {
        jobId: job.id,
        companyId: job.companyId,
      });

      return job;
    } catch (error) {
      logger.error('İş ilanı oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı güncelle
  async updateJob(id, data) {
    try {
      const job = await Job.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!job) {
        throw new Error('İş ilanı bulunamadı');
      }

      await this.clearCache(job.companyId);

      logger.info('İş ilanı güncellendi:', {
        jobId: job.id,
        companyId: job.companyId,
      });

      return job;
    } catch (error) {
      logger.error('İş ilanı güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı sil
  async deleteJob(id) {
    try {
      const job = await Job.findByIdAndDelete(id);

      if (!job) {
        throw new Error('İş ilanı bulunamadı');
      }

      await this.clearCache(job.companyId);

      logger.info('İş ilanı silindi:', {
        jobId: job.id,
        companyId: job.companyId,
      });

      return job;
    } catch (error) {
      logger.error('İş ilanı silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı getir
  async getJob(id) {
    try {
      const job = await Job.findById(id);

      if (!job) {
        throw new Error('İş ilanı bulunamadı');
      }

      logger.info('İş ilanı getirildi:', {
        jobId: job.id,
        companyId: job.companyId,
      });

      return job;
    } catch (error) {
      logger.error('İş ilanı getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı listesi
  async getJobs(options = {}) {
    try {
      const cacheKey = `jobs:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('İş ilanı listesi önbellekten alındı:', {
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
        companyId,
        category,
        location,
        type,
        status,
        search,
      } = options;

      const query = {};

      if (companyId) query.companyId = companyId;
      if (category) query.category = category;
      if (location) query.location = location;
      if (type) query.type = type;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { requirements: { $regex: search, $options: 'i' } },
        ];
      }

      const jobs = await Job.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit))
        .populate('companyId', 'name logo');

      const total = await Job.countDocuments(query);

      const data = {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('İş ilanı listesi alındı:', {
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('İş ilanı listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket iş ilanları
  async getCompanyJobs(companyId, options = {}) {
    try {
      const cacheKey = `jobs:company:${companyId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Şirket iş ilanları önbellekten alındı:', {
          companyId,
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
        status,
      } = options;

      const query = { companyId };
      if (status) query.status = status;

      const jobs = await Job.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit));

      const total = await Job.countDocuments(query);

      const data = {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Şirket iş ilanları alındı:', {
        companyId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Şirket iş ilanları alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önerilen iş ilanları
  async getRecommendedJobs(userId, options = {}) {
    try {
      const cacheKey = `jobs:recommended:${userId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Önerilen iş ilanları önbellekten alındı:', {
          userId,
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
      } = options;

      // Kullanıcının profil bilgilerine göre önerilen iş ilanları
      const user = await User.findById(userId);
      const query = {
        status: 'active',
        $or: [
          { category: { $in: user.skills } },
          { location: user.location },
          { type: user.preferredJobType },
        ],
      };

      const jobs = await Job.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit))
        .populate('companyId', 'name logo');

      const total = await Job.countDocuments(query);

      const data = {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Önerilen iş ilanları alındı:', {
        userId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Önerilen iş ilanları alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı istatistikleri
  async getJobStats(companyId = null) {
    try {
      const cacheKey = `jobs:stats:${companyId || 'all'}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('İş ilanı istatistikleri önbellekten alındı:', {
          companyId,
        });
        return cachedData;
      }

      const query = companyId ? { companyId } : {};

      const [
        total,
        active,
        closed,
        draft,
      ] = await Promise.all([
        Job.countDocuments(query),
        Job.countDocuments({ ...query, status: 'active' }),
        Job.countDocuments({ ...query, status: 'closed' }),
        Job.countDocuments({ ...query, status: 'draft' }),
      ]);

      const stats = {
        total,
        active,
        closed,
        draft,
        activeRate: total ? (active / total) * 100 : 0,
        closedRate: total ? (closed / total) * 100 : 0,
        draftRate: total ? (draft / total) * 100 : 0,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('İş ilanı istatistikleri alındı:', {
        companyId,
        stats,
      });

      return stats;
    } catch (error) {
      logger.error('İş ilanı istatistikleri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı durumunu güncelle
  async updateJobStatus(id, status) {
    try {
      const job = await Job.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      );

      if (!job) {
        throw new Error('İş ilanı bulunamadı');
      }

      await this.clearCache(job.companyId);

      logger.info('İş ilanı durumu güncellendi:', {
        jobId: job.id,
        companyId: job.companyId,
        status,
      });

      return job;
    } catch (error) {
      logger.error('İş ilanı durumu güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı görüntülenme sayısını artır
  async incrementViewCount(id) {
    try {
      const job = await Job.findByIdAndUpdate(
        id,
        { $inc: { viewCount: 1 } },
        { new: true },
      );

      if (!job) {
        throw new Error('İş ilanı bulunamadı');
      }

      logger.info('İş ilanı görüntülenme sayısı artırıldı:', {
        jobId: job.id,
        viewCount: job.viewCount,
      });

      return job;
    } catch (error) {
      logger.error('İş ilanı görüntülenme sayısı artırma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbelleği temizle
  async clearCache(companyId = null) {
    try {
      const keys = ['jobs:*'];
      if (companyId) {
        keys.push(`jobs:company:${companyId}:*`);
      }

      await cache.del(keys);

      logger.debug('İş ilanı önbelleği temizlendi:', {
        companyId,
        keys,
      });
    } catch (error) {
      logger.error('İş ilanı önbelleği temizleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new JobManager(); 