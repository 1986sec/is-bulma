import { Op } from 'sequelize';
import { logger } from './logger.js';
import { cache } from './cache.js';

class SearchManager {
  constructor() {
    this.defaultLimit = 10;
    this.maxLimit = 100;
    this.cacheDuration = 300; // 5 dakika

    // İş filtreleri
    this.jobFilters = {
      title: (value) => ({
        title: {
          [Op.iLike]: `%${value}%`,
        },
      }),
      description: (value) => ({
        description: {
          [Op.iLike]: `%${value}%`,
        },
      }),
      type: (value) => ({
        type: value,
      }),
      location: (value) => ({
        location: {
          [Op.iLike]: `%${value}%`,
        },
      }),
      experience: (value) => ({
        experience: value,
      }),
      salary: (value) => ({
        salary: {
          [Op.gte]: value,
        },
      }),
      skills: (value) => ({
        skills: {
          [Op.overlap]: Array.isArray(value) ? value : [value],
        },
      }),
    };

    // Kullanıcı filtreleri
    this.userFilters = {
      name: (value) => ({
        name: {
          [Op.iLike]: `%${value}%`,
        },
      }),
      email: (value) => ({
        email: {
          [Op.iLike]: `%${value}%`,
        },
      }),
      type: (value) => ({
        type: value,
      }),
      location: (value) => ({
        location: {
          [Op.iLike]: `%${value}%`,
        },
      }),
      skills: (value) => ({
        skills: {
          [Op.overlap]: Array.isArray(value) ? value : [value],
        },
      }),
    };
  }

  // İş araması
  async searchJobs(query, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        filters = {},
      } = options;

      const cacheKey = `jobs:${JSON.stringify({ query, options })}`;
      const cachedResults = await cache.get(cacheKey);

      if (cachedResults) {
        logger.info('İş araması önbellekten alındı:', {
          query,
          options,
        });
        return cachedResults;
      }

      const where = {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { location: { [Op.iLike]: `%${query}%` } },
          { company: { [Op.iLike]: `%${query}%` } },
        ],
        ...filters,
      };

      const results = await Job.findAndCountAll({
        where,
        limit: Math.min(limit, this.maxLimit),
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: Company,
            attributes: ['id', 'name', 'logo'],
          },
        ],
      });

      const response = {
        jobs: results.rows,
        total: results.count,
        limit,
        offset,
      };

      await cache.set(cacheKey, response, this.cacheDuration);
      logger.info('İş araması yapıldı:', {
        query,
        options,
        total: results.count,
      });

      return response;
    } catch (error) {
      logger.error('İş araması hatası:', {
        query,
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcı araması
  async searchUsers(query, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        filters = {},
      } = options;

      const cacheKey = `users:${JSON.stringify({ query, options })}`;
      const cachedResults = await cache.get(cacheKey);

      if (cachedResults) {
        logger.info('Kullanıcı araması önbellekten alındı:', {
          query,
          options,
        });
        return cachedResults;
      }

      const where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { location: { [Op.iLike]: `%${query}%` } },
          { skills: { [Op.iLike]: `%${query}%` } },
        ],
        ...filters,
      };

      const results = await User.findAndCountAll({
        where,
        limit: Math.min(limit, this.maxLimit),
        offset,
        order: [[sortBy, sortOrder]],
        attributes: { exclude: ['password'] },
      });

      const response = {
        users: results.rows,
        total: results.count,
        limit,
        offset,
      };

      await cache.set(cacheKey, response, this.cacheDuration);
      logger.info('Kullanıcı araması yapıldı:', {
        query,
        options,
        total: results.count,
      });

      return response;
    } catch (error) {
      logger.error('Kullanıcı araması hatası:', {
        query,
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Şirket araması
  async searchCompanies(query, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        filters = {},
      } = options;

      const cacheKey = `companies:${JSON.stringify({ query, options })}`;
      const cachedResults = await cache.get(cacheKey);

      if (cachedResults) {
        logger.info('Şirket araması önbellekten alındı:', {
          query,
          options,
        });
        return cachedResults;
      }

      const where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { description: { [Op.iLike]: `%${query}%` } },
          { location: { [Op.iLike]: `%${query}%` } },
          { industry: { [Op.iLike]: `%${query}%` } },
        ],
        ...filters,
      };

      const results = await Company.findAndCountAll({
        where,
        limit: Math.min(limit, this.maxLimit),
        offset,
        order: [[sortBy, sortOrder]],
      });

      const response = {
        companies: results.rows,
        total: results.count,
        limit,
        offset,
      };

      await cache.set(cacheKey, response, this.cacheDuration);
      logger.info('Şirket araması yapıldı:', {
        query,
        options,
        total: results.count,
      });

      return response;
    } catch (error) {
      logger.error('Şirket araması hatası:', {
        query,
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru araması
  async searchApplications(query, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        filters = {},
      } = options;

      const cacheKey = `applications:${JSON.stringify({ query, options })}`;
      const cachedResults = await cache.get(cacheKey);

      if (cachedResults) {
        logger.info('Başvuru araması önbellekten alındı:', {
          query,
          options,
        });
        return cachedResults;
      }

      const where = {
        [Op.or]: [
          { status: { [Op.iLike]: `%${query}%` } },
          { coverLetter: { [Op.iLike]: `%${query}%` } },
        ],
        ...filters,
      };

      const results = await Application.findAndCountAll({
        where,
        limit: Math.min(limit, this.maxLimit),
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email'],
          },
          {
            model: Job,
            attributes: ['id', 'title', 'company'],
          },
        ],
      });

      const response = {
        applications: results.rows,
        total: results.count,
        limit,
        offset,
      };

      await cache.set(cacheKey, response, this.cacheDuration);
      logger.info('Başvuru araması yapıldı:', {
        query,
        options,
        total: results.count,
      });

      return response;
    } catch (error) {
      logger.error('Başvuru araması hatası:', {
        query,
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj araması
  async searchMessages(query, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        filters = {},
      } = options;

      const cacheKey = `messages:${JSON.stringify({ query, options })}`;
      const cachedResults = await cache.get(cacheKey);

      if (cachedResults) {
        logger.info('Mesaj araması önbellekten alındı:', {
          query,
          options,
        });
        return cachedResults;
      }

      const where = {
        [Op.or]: [
          { content: { [Op.iLike]: `%${query}%` } },
          { subject: { [Op.iLike]: `%${query}%` } },
        ],
        ...filters,
      };

      const results = await Message.findAndCountAll({
        where,
        limit: Math.min(limit, this.maxLimit),
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'name', 'email'],
          },
        ],
      });

      const response = {
        messages: results.rows,
        total: results.count,
        limit,
        offset,
      };

      await cache.set(cacheKey, response, this.cacheDuration);
      logger.info('Mesaj araması yapıldı:', {
        query,
        options,
        total: results.count,
      });

      return response;
    } catch (error) {
      logger.error('Mesaj araması hatası:', {
        query,
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Arama önerileri
  async getSearchSuggestions(query, type) {
    try {
      const cacheKey = `suggestions:${type}:${query}`;
      const cachedSuggestions = await cache.get(cacheKey);

      if (cachedSuggestions) {
        logger.info('Arama önerileri önbellekten alındı:', {
          query,
          type,
        });
        return cachedSuggestions;
      }

      let suggestions = [];
      switch (type) {
        case 'jobs':
          suggestions = await Job.findAll({
            where: {
              title: { [Op.iLike]: `%${query}%` },
            },
            limit: 5,
            attributes: ['title'],
          });
          break;
        case 'users':
          suggestions = await User.findAll({
            where: {
              name: { [Op.iLike]: `%${query}%` },
            },
            limit: 5,
            attributes: ['name'],
          });
          break;
        case 'companies':
          suggestions = await Company.findAll({
            where: {
              name: { [Op.iLike]: `%${query}%` },
            },
            limit: 5,
            attributes: ['name'],
          });
          break;
        default:
          throw new Error('Geçersiz arama tipi');
      }

      await cache.set(cacheKey, suggestions, this.cacheDuration);
      logger.info('Arama önerileri oluşturuldu:', {
        query,
        type,
        count: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.error('Arama önerileri hatası:', {
        query,
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Arama geçmişi
  async getSearchHistory(userId, options = {}) {
    try {
      const {
        limit = this.defaultLimit,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
      } = options;

      const cacheKey = `history:${userId}:${JSON.stringify(options)}`;
      const cachedHistory = await cache.get(cacheKey);

      if (cachedHistory) {
        logger.info('Arama geçmişi önbellekten alındı:', {
          userId,
          options,
        });
        return cachedHistory;
      }

      const results = await SearchHistory.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      const response = {
        history: results.rows,
        total: results.count,
        limit,
        offset,
      };

      await cache.set(cacheKey, response, this.cacheDuration);
      logger.info('Arama geçmişi alındı:', {
        userId,
        options,
        total: results.count,
      });

      return response;
    } catch (error) {
      logger.error('Arama geçmişi hatası:', {
        userId,
        options,
        error: error.message,
      });
      throw error;
    }
  }

  // Arama geçmişi ekle
  async addSearchHistory(userId, query, type) {
    try {
      const history = await SearchHistory.create({
        userId,
        query,
        type,
      });

      logger.info('Arama geçmişi eklendi:', {
        userId,
        query,
        type,
      });

      return history;
    } catch (error) {
      logger.error('Arama geçmişi ekleme hatası:', {
        userId,
        query,
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Arama geçmişi temizle
  async clearSearchHistory(userId) {
    try {
      await SearchHistory.destroy({
        where: { userId },
      });

      logger.info('Arama geçmişi temizlendi:', { userId });
      return true;
    } catch (error) {
      logger.error('Arama geçmişi temizleme hatası:', {
        userId,
        error: error.message,
      });
      throw error;
    }
  }
}

const search = new SearchManager();
export { search };
export default search; 