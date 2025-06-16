import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';
import { config } from './config.js';

class EmailManager {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    this.templatesDir = path.join(__dirname, '../../templates/email');
    this.templates = {
      // Hoş geldin e-postası
      welcome: {
        subject: 'Hoş Geldiniz',
        template: `
          <h1>Hoş Geldiniz!</h1>
          <p>Merhaba {{name}},</p>
          <p>İş Bulma platformuna hoş geldiniz. Hesabınız başarıyla oluşturuldu.</p>
          <p>Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
          <p><a href="{{verificationLink}}">Hesabımı Doğrula</a></p>
          <p>İyi çalışmalar dileriz.</p>
        `,
      },

      // Şifre sıfırlama e-postası
      resetPassword: {
        subject: 'Şifre Sıfırlama',
        template: `
          <h1>Şifre Sıfırlama</h1>
          <p>Merhaba {{name}},</p>
          <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
          <p><a href="{{resetLink}}">Şifremi Sıfırla</a></p>
          <p>Bu bağlantı 1 saat süreyle geçerlidir.</p>
          <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        `,
      },

      // İş başvurusu e-postası
      jobApplication: {
        subject: 'İş Başvurunuz Alındı',
        template: `
          <h1>İş Başvurunuz Alındı</h1>
          <p>Merhaba {{name}},</p>
          <p>{{company}} şirketine yaptığınız {{jobTitle}} pozisyonu başvurunuz alındı.</p>
          <p>Başvurunuzun durumunu takip etmek için <a href="{{applicationLink}}">tıklayın</a>.</p>
          <p>İyi çalışmalar dileriz.</p>
        `,
      },

      // Başvuru durumu güncelleme e-postası
      applicationStatus: {
        subject: 'Başvuru Durumu Güncellendi',
        template: `
          <h1>Başvuru Durumu Güncellendi</h1>
          <p>Merhaba {{name}},</p>
          <p>{{company}} şirketine yaptığınız {{jobTitle}} pozisyonu başvurunuzun durumu güncellendi.</p>
          <p>Yeni durum: <strong>{{status}}</strong></p>
          <p>Detayları görüntülemek için <a href="{{applicationLink}}">tıklayın</a>.</p>
          <p>İyi çalışmalar dileriz.</p>
        `,
      },

      // Mesaj e-postası
      message: {
        subject: 'Yeni Mesaj',
        template: `
          <h1>Yeni Mesaj</h1>
          <p>Merhaba {{name}},</p>
          <p>{{sender}} size yeni bir mesaj gönderdi:</p>
          <p><em>{{message}}</em></p>
          <p>Mesajı görüntülemek için <a href="{{messageLink}}">tıklayın</a>.</p>
        `,
      },

      // Ödeme e-postası
      payment: {
        subject: 'Ödeme Bilgisi',
        template: `
          <h1>Ödeme Bilgisi</h1>
          <p>Merhaba {{name}},</p>
          <p>{{amount}} tutarındaki ödemeniz {{status}}.</p>
          <p>Ödeme detayları:</p>
          <ul>
            <li>Ödeme No: {{paymentId}}</li>
            <li>Tarih: {{date}}</li>
            <li>Yöntem: {{method}}</li>
          </ul>
          <p>Detayları görüntülemek için <a href="{{paymentLink}}">tıklayın</a>.</p>
        `,
      },

      // Hata e-postası
      error: {
        subject: 'Hata Bildirimi',
        template: `
          <h1>Hata Bildirimi</h1>
          <p>Merhaba {{name}},</p>
          <p>İşleminiz sırasında bir hata oluştu:</p>
          <p><strong>{{error}}</strong></p>
          <p>Lütfen daha sonra tekrar deneyin veya destek ekibimizle iletişime geçin.</p>
        `,
      },
    };

    // E-posta şablonlarını yükle
    this.loadTemplates();
  }

  // E-posta şablonlarını yükle
  async loadTemplates() {
    try {
      const files = await fs.promises.readdir(this.templatesDir);
      for (const file of files) {
        if (file.endsWith('.hbs')) {
          const template = await fs.promises.readFile(
            path.join(this.templatesDir, file),
            'utf8'
          );
          const name = path.basename(file, '.hbs');
          this.templates[name] = handlebars.compile(template);
        }
      }
      logger.info('E-posta şablonları yüklendi');
    } catch (error) {
      logger.error('E-posta şablonları yükleme hatası:', {
        error: error.message,
      });
    }
  }

  // E-posta gönder
  async sendEmail(to, subject, html, options = {}) {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.email('E-posta gönderildi:', {
        to,
        subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('E-posta gönderme hatası:', {
        to,
        subject,
        error: error.message,
      });
      throw error;
    }
  }

  // Şablonu işle
  processTemplate(template, data) {
    try {
      let processed = template;
      for (const [key, value] of Object.entries(data)) {
        processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      return processed;
    } catch (error) {
      logger.error('Şablon işleme hatası:', {
        template,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Hoş geldin e-postası gönder
  async sendWelcomeEmail(to, data) {
    try {
      const template = this.templates.welcome;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Hoş geldin e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Şifre sıfırlama e-postası gönder
  async sendResetPasswordEmail(to, data) {
    try {
      const template = this.templates.resetPassword;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Şifre sıfırlama e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // İş başvurusu e-postası gönder
  async sendJobApplicationEmail(to, data) {
    try {
      const template = this.templates.jobApplication;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('İş başvurusu e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuru durumu güncelleme e-postası gönder
  async sendApplicationStatusEmail(to, data) {
    try {
      const template = this.templates.applicationStatus;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Başvuru durumu güncelleme e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Mesaj e-postası gönder
  async sendMessageEmail(to, data) {
    try {
      const template = this.templates.message;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Mesaj e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme e-postası gönder
  async sendPaymentEmail(to, data) {
    try {
      const template = this.templates.payment;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Ödeme e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Hata e-postası gönder
  async sendErrorEmail(to, data) {
    try {
      const template = this.templates.error;
      const subject = template.subject;
      const html = this.processTemplate(template.template, data);

      return await this.sendEmail(to, subject, html);
    } catch (error) {
      logger.error('Hata e-postası gönderme hatası:', {
        to,
        data,
        error: error.message,
      });
      throw error;
    }
  }

  // Şablon ekle
  async addTemplate(name, template) {
    try {
      this.templates[name] = template;
      logger.info('E-posta şablonu eklendi:', { name });
      return true;
    } catch (error) {
      logger.error('E-posta şablonu ekleme hatası:', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  // Şablon güncelle
  async updateTemplate(name, template) {
    try {
      if (!this.templates[name]) {
        throw new Error('Şablon bulunamadı');
      }

      this.templates[name] = template;
      logger.info('E-posta şablonu güncellendi:', { name });
      return true;
    } catch (error) {
      logger.error('E-posta şablonu güncelleme hatası:', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  // Şablon sil
  async deleteTemplate(name) {
    try {
      if (!this.templates[name]) {
        throw new Error('Şablon bulunamadı');
      }

      delete this.templates[name];
      logger.info('E-posta şablonu silindi:', { name });
      return true;
    } catch (error) {
      logger.error('E-posta şablonu silme hatası:', {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  // Şablon listesi al
  async getTemplateList() {
    try {
      const templates = Object.keys(this.templates);
      logger.info('E-posta şablonu listesi alındı:', { count: templates.length });
      return templates;
    } catch (error) {
      logger.error('E-posta şablonu listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }
}

const email = new EmailManager();
export { email };
export default email; 