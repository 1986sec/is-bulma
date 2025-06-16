import { Op } from 'sequelize';
import { Job, User, Company, Application, Message } from '../models';
import { logger } from './logger.js';
import { cache } from './cache.js';

class AnalyticsManager {
  constructor() {
    this.cacheDuration = 3600; // 1 saat
    this.defaultLimit = 10;
    this.maxLimit = 100;
  }

  // İş istatistikleri
  async getJobStats() {
    try {
      const cacheKey = 'job_stats';
      const cachedStats = await cache.get(cacheKey);

      if (cachedStats) {
        logger.info('İş istatistikleri önbellekten alındı');
        return cachedStats;
      }

      const totalJobs = await Job.count();
      const activeJobs = await Job.count({ where: { status: 'active' } });
      const closedJobs = await Job.count({ where: { status: 'closed' } });
      const draftJobs = await Job.count({ where: { status: 'draft' } });

      const stats = {
        total: totalJobs,
        active: activeJobs,
        closed: closedJobs,
        draft: draftJobs,
        activeRate: (activeJobs / totalJobs) * 100,
        closedRate: (closedJobs / totalJobs) * 100,
        draftRate: (draftJobs / totalJobs) * 100,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('İş istatistikleri hesaplandı:', stats);
      return stats;
    } catch (error) {
      logger.error('İş istatistikleri hesaplama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı istatistikleri
  async getUserStats() {
    try {
      const cacheKey = 'user_stats';
      const cachedStats = await cache.get(cacheKey);

      if (cachedStats) {
        logger.info('Kullanıcı istatistikleri önbellekten alındı');
        return cachedStats;
      }

      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const inactiveUsers = await User.count({ where: { status: 'inactive' } });
      const verifiedUsers = await User.count({ where: { isVerified: true } });

      const stats = {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        verified: verifiedUsers,
        activeRate: (activeUsers / totalUsers) * 100,
        inactiveRate: (inactiveUsers / totalUsers) * 100,
        verifiedRate: (verifiedUsers / totalUsers) * 100,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Kullanıcı istatistikleri hesaplandı:', stats);
      return stats;
    } catch (error) {
      logger.error('Kullanıcı istatistikleri hesaplama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket istatistikleri
  async getCompanyStats() {
    try {
      const cacheKey = 'company_stats';
      const cachedStats = await cache.get(cacheKey);

      if (cachedStats) {
        logger.info('Şirket istatistikleri önbellekten alındı');
        return cachedStats;
      }

      const totalCompanies = await Company.count();
      const activeCompanies = await Company.count({ where: { status: 'active' } });
      const inactiveCompanies = await Company.count({ where: { status: 'inactive' } });
      const verifiedCompanies = await Company.count({ where: { isVerified: true } });

      const stats = {
        total: totalCompanies,
        active: activeCompanies,
        inactive: inactiveCompanies,
        verified: verifiedCompanies,
        activeRate: (activeCompanies / totalCompanies) * 100,
        inactiveRate: (inactiveCompanies / totalCompanies) * 100,
        verifiedRate: (verifiedCompanies / totalCompanies) * 100,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Şirket istatistikleri hesaplandı:', stats);
      return stats;
    } catch (error) {
      logger.error('Şirket istatistikleri hesaplama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru istatistikleri
  async getApplicationStats() {
    try {
      const cacheKey = 'application_stats';
      const cachedStats = await cache.get(cacheKey);

      if (cachedStats) {
        logger.info('Başvuru istatistikleri önbellekten alındı');
        return cachedStats;
      }

      const totalApplications = await Application.count();
      const pendingApplications = await Application.count({ where: { status: 'pending' } });
      const acceptedApplications = await Application.count({ where: { status: 'accepted' } });
      const rejectedApplications = await Application.count({ where: { status: 'rejected' } });

      const stats = {
        total: totalApplications,
        pending: pendingApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
        pendingRate: (pendingApplications / totalApplications) * 100,
        acceptedRate: (acceptedApplications / totalApplications) * 100,
        rejectedRate: (rejectedApplications / totalApplications) * 100,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Başvuru istatistikleri hesaplandı:', stats);
      return stats;
    } catch (error) {
      logger.error('Başvuru istatistikleri hesaplama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj istatistikleri
  async getMessageStats() {
    try {
      const cacheKey = 'message_stats';
      const cachedStats = await cache.get(cacheKey);

      if (cachedStats) {
        logger.info('Mesaj istatistikleri önbellekten alındı');
        return cachedStats;
      }

      const totalMessages = await Message.count();
      const unreadMessages = await Message.count({ where: { isRead: false } });
      const readMessages = await Message.count({ where: { isRead: true } });

      const stats = {
        total: totalMessages,
        unread: unreadMessages,
        read: readMessages,
        unreadRate: (unreadMessages / totalMessages) * 100,
        readRate: (readMessages / totalMessages) * 100,
      };

      await cache.set(cacheKey, stats, this.cacheDuration);

      logger.info('Mesaj istatistikleri hesaplandı:', stats);
      return stats;
    } catch (error) {
      logger.error('Mesaj istatistikleri hesaplama hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Popüler işler
  async getPopularJobs(limit = this.defaultLimit) {
    try {
      const cacheKey = `popular_jobs_${limit}`;
      const cachedJobs = await cache.get(cacheKey);

      if (cachedJobs) {
        logger.info('Popüler işler önbellekten alındı');
        return cachedJobs;
      }

      const jobs = await Job.findAll({
        where: { status: 'active' },
        order: [['viewCount', 'DESC']],
        limit: Math.min(limit, this.maxLimit),
      });

      await cache.set(cacheKey, jobs, this.cacheDuration);

      logger.info('Popüler işler getirildi:', { count: jobs.length });
      return jobs;
    } catch (error) {
      logger.error('Popüler işler getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Popüler şirketler
  async getPopularCompanies(limit = this.defaultLimit) {
    try {
      const cacheKey = `popular_companies_${limit}`;
      const cachedCompanies = await cache.get(cacheKey);

      if (cachedCompanies) {
        logger.info('Popüler şirketler önbellekten alındı');
        return cachedCompanies;
      }

      const companies = await Company.findAll({
        where: { status: 'active' },
        order: [['viewCount', 'DESC']],
        limit: Math.min(limit, this.maxLimit),
      });

      await cache.set(cacheKey, companies, this.cacheDuration);

      logger.info('Popüler şirketler getirildi:', { count: companies.length });
      return companies;
    } catch (error) {
      logger.error('Popüler şirketler getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Aktif kullanıcılar
  async getActiveUsers(limit = this.defaultLimit) {
    try {
      const cacheKey = `active_users_${limit}`;
      const cachedUsers = await cache.get(cacheKey);

      if (cachedUsers) {
        logger.info('Aktif kullanıcılar önbellekten alındı');
        return cachedUsers;
      }

      const users = await User.findAll({
        where: { status: 'active' },
        order: [['lastLoginAt', 'DESC']],
        limit: Math.min(limit, this.maxLimit),
      });

      await cache.set(cacheKey, users, this.cacheDuration);

      logger.info('Aktif kullanıcılar getirildi:', { count: users.length });
      return users;
    } catch (error) {
      logger.error('Aktif kullanıcılar getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Son başvurular
  async getRecentApplications(limit = this.defaultLimit) {
    try {
      const cacheKey = `recent_applications_${limit}`;
      const cachedApplications = await cache.get(cacheKey);

      if (cachedApplications) {
        logger.info('Son başvurular önbellekten alındı');
        return cachedApplications;
      }

      const applications = await Application.findAll({
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, this.maxLimit),
        include: [
          { model: User, as: 'user' },
          { model: Job, as: 'job' },
        ],
      });

      await cache.set(cacheKey, applications, this.cacheDuration);

      logger.info('Son başvurular getirildi:', { count: applications.length });
      return applications;
    } catch (error) {
      logger.error('Son başvurular getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Son mesajlar
  async getRecentMessages(limit = this.defaultLimit) {
    try {
      const cacheKey = `recent_messages_${limit}`;
      const cachedMessages = await cache.get(cacheKey);

      if (cachedMessages) {
        logger.info('Son mesajlar önbellekten alındı');
        return cachedMessages;
      }

      const messages = await Message.findAll({
        order: [['createdAt', 'DESC']],
        limit: Math.min(limit, this.maxLimit),
        include: [
          { model: User, as: 'sender' },
          { model: User, as: 'receiver' },
        ],
      });

      await cache.set(cacheKey, messages, this.cacheDuration);

      logger.info('Son mesajlar getirildi:', { count: messages.length });
      return messages;
    } catch (error) {
      logger.error('Son mesajlar getirme hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const analytics = new AnalyticsManager();
export { analytics };
export default analytics; 