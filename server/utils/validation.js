import Joi from 'joi';
import { logger } from './logger.js';

class ValidationManager {
  constructor() {
    this.schemas = {
      // Kullanıcı şemaları
      user: {
        create: Joi.object({
          name: Joi.string().min(2).max(50).required(),
          email: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
          type: Joi.string().valid('user', 'company', 'admin').required(),
          location: Joi.string().max(100),
          phone: Joi.string().max(20),
          website: Joi.string().uri(),
          bio: Joi.string().max(500),
        }),
        update: Joi.object({
          name: Joi.string().min(2).max(50),
          email: Joi.string().email(),
          password: Joi.string().min(6),
          type: Joi.string().valid('user', 'company', 'admin'),
          location: Joi.string().max(100),
          phone: Joi.string().max(20),
          website: Joi.string().uri(),
          bio: Joi.string().max(500),
          status: Joi.string().valid('active', 'inactive'),
          isVerified: Joi.boolean(),
        }),
        login: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().required(),
        }),
        resetPassword: Joi.object({
          email: Joi.string().email().required(),
        }),
        changePassword: Joi.object({
          currentPassword: Joi.string().required(),
          newPassword: Joi.string().min(6).required(),
        }),
      },

      // İş şemaları
      job: {
        create: Joi.object({
          title: Joi.string().min(3).max(100).required(),
          company: Joi.string().min(2).max(100).required(),
          location: Joi.string().max(100).required(),
          type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship').required(),
          experience: Joi.string().valid('entry', 'mid', 'senior', 'lead').required(),
          salary: Joi.number().min(0),
          description: Joi.string().min(10).max(5000).required(),
          requirements: Joi.array().items(Joi.string()),
          benefits: Joi.array().items(Joi.string()),
          skills: Joi.array().items(Joi.string()),
          status: Joi.string().valid('draft', 'active', 'closed').default('draft'),
        }),
        update: Joi.object({
          title: Joi.string().min(3).max(100),
          company: Joi.string().min(2).max(100),
          location: Joi.string().max(100),
          type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship'),
          experience: Joi.string().valid('entry', 'mid', 'senior', 'lead'),
          salary: Joi.number().min(0),
          description: Joi.string().min(10).max(5000),
          requirements: Joi.array().items(Joi.string()),
          benefits: Joi.array().items(Joi.string()),
          skills: Joi.array().items(Joi.string()),
          status: Joi.string().valid('draft', 'active', 'closed'),
        }),
        search: Joi.object({
          query: Joi.string().max(100),
          location: Joi.string().max(100),
          type: Joi.string().valid('full-time', 'part-time', 'contract', 'internship'),
          experience: Joi.string().valid('entry', 'mid', 'senior', 'lead'),
          salary: Joi.number().min(0),
          skills: Joi.array().items(Joi.string()),
          status: Joi.string().valid('active', 'closed'),
          page: Joi.number().min(1).default(1),
          limit: Joi.number().min(1).max(100).default(10),
        }),
      },

      // Başvuru şemaları
      application: {
        create: Joi.object({
          jobId: Joi.number().required(),
          userId: Joi.number().required(),
          coverLetter: Joi.string().max(1000),
          resume: Joi.string().uri(),
          status: Joi.string().valid('pending', 'accepted', 'rejected').default('pending'),
        }),
        update: Joi.object({
          coverLetter: Joi.string().max(1000),
          resume: Joi.string().uri(),
          status: Joi.string().valid('pending', 'accepted', 'rejected'),
        }),
        search: Joi.object({
          jobId: Joi.number(),
          userId: Joi.number(),
          status: Joi.string().valid('pending', 'accepted', 'rejected'),
          page: Joi.number().min(1).default(1),
          limit: Joi.number().min(1).max(100).default(10),
        }),
      },

      // Mesaj şemaları
      message: {
        create: Joi.object({
          senderId: Joi.number().required(),
          receiverId: Joi.number().required(),
          content: Joi.string().min(1).max(1000).required(),
          type: Joi.string().valid('text', 'image', 'file').default('text'),
          file: Joi.string().uri(),
        }),
        update: Joi.object({
          content: Joi.string().min(1).max(1000),
          type: Joi.string().valid('text', 'image', 'file'),
          file: Joi.string().uri(),
        }),
        search: Joi.object({
          senderId: Joi.number(),
          receiverId: Joi.number(),
          type: Joi.string().valid('text', 'image', 'file'),
          isRead: Joi.boolean(),
          page: Joi.number().min(1).default(1),
          limit: Joi.number().min(1).max(100).default(10),
        }),
      },

      // Bildirim şemaları
      notification: {
        create: Joi.object({
          userId: Joi.number().required(),
          type: Joi.string().valid('info', 'success', 'warning', 'error').required(),
          title: Joi.string().min(1).max(100).required(),
          message: Joi.string().min(1).max(500).required(),
          data: Joi.object(),
        }),
        update: Joi.object({
          type: Joi.string().valid('info', 'success', 'warning', 'error'),
          title: Joi.string().min(1).max(100),
          message: Joi.string().min(1).max(500),
          data: Joi.object(),
          isRead: Joi.boolean(),
        }),
        search: Joi.object({
          userId: Joi.number(),
          type: Joi.string().valid('info', 'success', 'warning', 'error'),
          isRead: Joi.boolean(),
          page: Joi.number().min(1).default(1),
          limit: Joi.number().min(1).max(100).default(10),
        }),
      },
    };
  }

  // Veri doğrula
  async validate(data, schema, options = {}) {
    try {
      const result = await schema.validateAsync(data, {
        abortEarly: false,
        stripUnknown: options.stripUnknown || false,
      });

      logger.info('Veri doğrulandı:', {
        schema: schema.describe().keys,
        data: options.logData ? data : undefined,
      });

      return {
        isValid: true,
        data: result,
      };
    } catch (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.error('Veri doğrulama hatası:', {
        schema: schema.describe().keys,
        errors,
        data: options.logData ? data : undefined,
      });

      return {
        isValid: false,
        errors,
      };
    }
  }

  // Kullanıcı doğrula
  async validateUser(data, type = 'create') {
    try {
      const schema = this.schemas.user[type];
      if (!schema) {
        throw new Error('Geçersiz doğrulama tipi');
      }

      return await this.validate(data, schema);
    } catch (error) {
      logger.error('Kullanıcı doğrulama hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // İş doğrula
  async validateJob(data, type = 'create') {
    try {
      const schema = this.schemas.job[type];
      if (!schema) {
        throw new Error('Geçersiz doğrulama tipi');
      }

      return await this.validate(data, schema);
    } catch (error) {
      logger.error('İş doğrulama hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru doğrula
  async validateApplication(data, type = 'create') {
    try {
      const schema = this.schemas.application[type];
      if (!schema) {
        throw new Error('Geçersiz doğrulama tipi');
      }

      return await this.validate(data, schema);
    } catch (error) {
      logger.error('Başvuru doğrulama hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj doğrula
  async validateMessage(data, type = 'create') {
    try {
      const schema = this.schemas.message[type];
      if (!schema) {
        throw new Error('Geçersiz doğrulama tipi');
      }

      return await this.validate(data, schema);
    } catch (error) {
      logger.error('Mesaj doğrulama hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Bildirim doğrula
  async validateNotification(data, type = 'create') {
    try {
      const schema = this.schemas.notification[type];
      if (!schema) {
        throw new Error('Geçersiz doğrulama tipi');
      }

      return await this.validate(data, schema);
    } catch (error) {
      logger.error('Bildirim doğrulama hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Şema ekle
  async addSchema(name, schema) {
    try {
      this.schemas[name] = schema;
      logger.info('Şema eklendi:', { name });
      return true;
    } catch (error) {
      logger.error('Şema ekleme hatası:', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  // Şema güncelle
  async updateSchema(name, schema) {
    try {
      if (!this.schemas[name]) {
        throw new Error('Şema bulunamadı');
      }

      this.schemas[name] = schema;
      logger.info('Şema güncellendi:', { name });
      return true;
    } catch (error) {
      logger.error('Şema güncelleme hatası:', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  // Şema sil
  async deleteSchema(name) {
    try {
      if (!this.schemas[name]) {
        throw new Error('Şema bulunamadı');
      }

      delete this.schemas[name];
      logger.info('Şema silindi:', { name });
      return true;
    } catch (error) {
      logger.error('Şema silme hatası:', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  // Şema listesi al
  async getSchemaList() {
    try {
      const schemas = Object.keys(this.schemas);
      logger.info('Şema listesi alındı:', { count: schemas.length });
      return schemas;
    } catch (error) {
      logger.error('Şema listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const validation = new ValidationManager();
export { validation };
export default validation; 