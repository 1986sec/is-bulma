const Application = require('../models/application');
const Job = require('../models/job');
const logger = require('./logger');
const notification = require('./notification');
const cache = require('./cache');

class ApplicationManager {
  constructor() {
    this.cacheDuration = 300; // 5 dakika
    this.defaultLimit = 10;
    this.maxLimit = 50;
  }

  // Başvuru oluştur
  async createApplication(data) {
    try {
      const application = await Application.create(data);
      await this.sendApplicationNotification(application);
      await this.clearCache(application.userId, application.jobId);

      logger.info('Başvuru oluşturuldu:', {
        applicationId: application.id,
        userId: application.userId,
        jobId: application.jobId,
      });

      return application;
    } catch (error) {
      logger.error('Başvuru oluşturma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru bildirimi gönder
  async sendApplicationNotification(application) {
    try {
      const job = await Job.findById(application.jobId);

      // Şirkete bildirim gönder
      await notification.createNotification({
        userId: job.companyId,
        type: 'application',
        title: 'Yeni İş Başvurusu',
        message: `${application.userName} iş ilanınıza başvurdu.`,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          userId: application.userId,
        },
      });

      logger.info('Başvuru bildirimi gönderildi:', {
        applicationId: application.id,
        companyId: job.companyId,
      });
    } catch (error) {
      logger.error('Başvuru bildirimi gönderme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru güncelle
  async updateApplication(id, data) {
    try {
      const application = await Application.findByIdAndUpdate(id, data, {
        new: true,
      });

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      await this.clearCache(application.userId, application.jobId);

      logger.info('Başvuru güncellendi:', {
        applicationId: application.id,
        userId: application.userId,
        jobId: application.jobId,
      });

      return application;
    } catch (error) {
      logger.error('Başvuru güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru sil
  async deleteApplication(id) {
    try {
      const application = await Application.findByIdAndDelete(id);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      await this.clearCache(application.userId, application.jobId);

      logger.info('Başvuru silindi:', {
        applicationId: application.id,
        userId: application.userId,
        jobId: application.jobId,
      });

      return application;
    } catch (error) {
      logger.error('Başvuru silme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru getir
  async getApplication(id) {
    try {
      const application = await Application.findById(id);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      logger.info('Başvuru getirildi:', {
        applicationId: application.id,
        userId: application.userId,
        jobId: application.jobId,
      });

      return application;
    } catch (error) {
      logger.error('Başvuru getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru listesi
  async getApplications(options = {}) {
    try {
      const cacheKey = `applications:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Başvuru listesi önbellekten alındı:', {
          options,
        });
        return cachedData;
      }

      const {
        page = 1,
        limit = this.defaultLimit,
        sort = '-createdAt',
        userId,
        jobId,
        companyId,
        status,
      } = options;

      const query = {};

      if (userId) query.userId = userId;
      if (jobId) query.jobId = jobId;
      if (companyId) {
        const jobs = await Job.find({ companyId });
        query.jobId = { $in: jobs.map((job) => job.id) };
      }
      if (status) query.status = status;

      const applications = await Application.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit))
        .populate('userId', 'name email avatar')
        .populate('jobId', 'title companyId');

      const total = await Application.countDocuments(query);

      const data = {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Başvuru listesi alındı:', {
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Başvuru listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı başvuruları
  async getUserApplications(userId, options = {}) {
    try {
      const cacheKey = `applications:user:${userId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Kullanıcı başvuruları önbellekten alındı:', {
          userId,
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

      const query = { userId };
      if (status) query.status = status;

      const applications = await Application.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit))
        .populate('jobId', 'title companyId');

      const total = await Application.countDocuments(query);

      const data = {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('Kullanıcı başvuruları alındı:', {
        userId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('Kullanıcı başvuruları alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanı başvuruları
  async getJobApplications(jobId, options = {}) {
    try {
      const cacheKey = `applications:job:${jobId}:${JSON.stringify(options)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('İş ilanı başvuruları önbellekten alındı:', {
          jobId,
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

      const query = { jobId };
      if (status) query.status = status;

      const applications = await Application.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Math.min(limit, this.maxLimit))
        .populate('userId', 'name email avatar');

      const total = await Application.countDocuments(query);

      const data = {
        applications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };

      await cache.set(cacheKey, data, this.cacheDuration);

      logger.info('İş ilanı başvuruları alındı:', {
        jobId,
        options,
        total,
      });

      return data;
    } catch (error) {
      logger.error('İş ilanı başvuruları alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru durumunu güncelle
  async updateApplicationStatus(id, status) {
    try {
      const application = await Application.findByIdAndUpdate(
        id,
        { status },
        { new: true },
      );

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      await this.clearCache(application.userId, application.jobId);

      // Kullanıcıya bildirim gönder
      await notification.createNotification({
        userId: application.userId,
        type: 'application_status',
        title: 'Başvuru Durumu Güncellendi',
        message: `İş başvurunuzun durumu "${status}" olarak güncellendi.`,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          status,
        },
      });

      logger.info('Başvuru durumu güncellendi:', {
        applicationId: application.id,
        userId: application.userId,
        jobId: application.jobId,
        status,
      });

      return application;
    } catch (error) {
      logger.error('Başvuru durumu güncelleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru istatistikleri
  async getApplicationStats(userId = null, jobId = null) {
    try {
      const cacheKey = `applications:stats:${userId || 'all'}:${jobId || 'all'}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Başvuru istatistikleri önbellekten alındı:', {
          userId,
          jobId,
        });
        return cachedData;
      }

      const query = {};
      if (userId) query.userId = userId;
      if (jobId) query.jobId = jobId;

      const [
        total,
        pending,
        accepted,
        rejected,
      ] = await Promise.all([
        Application.countDocuments(query),
        Application.countDocuments({ ...query, status: 'pending' }),
        Application.countDocuments({ ...query, status: 'accepted' }),
        Application.countDocuments({ ...query, status: 'rejected' }),
      ]);

      const stats = {
        total,
        pending,
        accepted,
        rejected,
        pendingRate: total ? (pending / total) * 100 : 0,
        acceptedRate: total ? (accepted / total) * 100 : 0,
        rejectedRate: total ? (rejected / total) * 100 : 0,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Başvuru istatistikleri alındı:', {
        userId,
        jobId,
        stats,
      });

      return stats;
    } catch (error) {
      logger.error('Başvuru istatistikleri alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Önbelleği temizle
  async clearCache(userId = null, jobId = null) {
    try {
      const keys = ['applications:*'];
      if (userId) {
        keys.push(`applications:user:${userId}:*`);
      }
      if (jobId) {
        keys.push(`applications:job:${jobId}:*`);
      }

      await cache.del(keys);

      logger.debug('Başvuru önbelleği temizlendi:', {
        userId,
        jobId,
        keys,
      });
    } catch (error) {
      logger.error('Başvuru önbelleği temizleme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

module.exports = new ApplicationManager(); 