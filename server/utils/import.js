import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { parse } from 'json2csv';
import { logger } from './logger.js';
const { Job, User, Application } = require('../models');

class ImportManager {
  constructor() {
    this.importDir = path.join(process.cwd(), 'imports');
    this.supportedFormats = ['xlsx', 'csv', 'json'];
  }

  // Dizin oluştur
  async createImportDir() {
    try {
      await fs.promises.mkdir(this.importDir, { recursive: true });
      logger.info('Import dizini oluşturuldu:', { path: this.importDir });
    } catch (error) {
      logger.error('Import dizini oluşturma hatası:', {
        path: this.importDir,
        error: error.message,
      });
      throw error;
    }
  }

  // Excel dosyasını oku
  async readExcel(fileName, options = {}) {
    try {
      const filePath = path.join(this.importDir, fileName);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(options.sheetName || 1);
      const data = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 && !options.includeHeaders) {
          return;
        }

        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const header = worksheet.getRow(1).getCell(colNumber).value;
          rowData[header] = cell.value;
        });

        data.push(rowData);
      });

      logger.info('Excel dosyası okundu:', {
        fileName,
        rowCount: data.length,
      });

      return data;
    } catch (error) {
      logger.error('Excel dosyası okuma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // CSV dosyasını oku
  async readCsv(fileName, options = {}) {
    try {
      const filePath = path.join(this.importDir, fileName);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const data = parse(content, {
        header: options.includeHeaders,
        skipLines: options.skipLines || 0,
      });

      logger.info('CSV dosyası okundu:', {
        fileName,
        rowCount: data.length,
      });

      return data;
    } catch (error) {
      logger.error('CSV dosyası okuma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // JSON dosyasını oku
  async readJson(fileName, options = {}) {
    try {
      const filePath = path.join(this.importDir, fileName);
      const content = await fs.promises.readFile(filePath, 'utf8');
      const data = JSON.parse(content);

      logger.info('JSON dosyası okundu:', {
        fileName,
        rowCount: Array.isArray(data) ? data.length : 1,
      });

      return data;
    } catch (error) {
      logger.error('JSON dosyası okuma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya oku
  async readFile(fileName, format, options = {}) {
    try {
      if (!this.supportedFormats.includes(format)) {
        throw new Error('Desteklenmeyen dosya formatı');
      }

      let data;
      switch (format) {
        case 'xlsx':
          data = await this.readExcel(fileName, options);
          break;
        case 'csv':
          data = await this.readCsv(fileName, options);
          break;
        case 'json':
          data = await this.readJson(fileName, options);
          break;
      }

      logger.info('Dosya okundu:', {
        fileName,
        format,
        rowCount: Array.isArray(data) ? data.length : 1,
      });

      return data;
    } catch (error) {
      logger.error('Dosya okuma hatası:', {
        fileName,
        format,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya doğrula
  async validateFile(fileName, format, schema) {
    try {
      const data = await this.readFile(fileName, format);

      if (!Array.isArray(data)) {
        throw new Error('Veri bir dizi olmalıdır');
      }

      const errors = [];
      data.forEach((row, index) => {
        Object.keys(schema).forEach((key) => {
          if (schema[key].required && !row[key]) {
            errors.push({
              row: index + 1,
              field: key,
              message: 'Bu alan zorunludur',
            });
          }

          if (row[key] && schema[key].type) {
            const value = row[key];
            const type = schema[key].type;

            if (type === 'number' && isNaN(Number(value))) {
              errors.push({
                row: index + 1,
                field: key,
                message: 'Bu alan sayısal olmalıdır',
              });
            }

            if (type === 'date' && isNaN(Date.parse(value))) {
              errors.push({
                row: index + 1,
                field: key,
                message: 'Bu alan geçerli bir tarih olmalıdır',
              });
            }

            if (type === 'boolean' && typeof value !== 'boolean') {
              errors.push({
                row: index + 1,
                field: key,
                message: 'Bu alan boolean olmalıdır',
              });
            }
          }
        });
      });

      logger.info('Dosya doğrulandı:', {
        fileName,
        format,
        errorCount: errors.length,
      });

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      logger.error('Dosya doğrulama hatası:', {
        fileName,
        format,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya sil
  async deleteFile(fileName) {
    try {
      const filePath = path.join(this.importDir, fileName);
      await fs.promises.unlink(filePath);
      logger.info('Dosya silindi:', { fileName });
      return true;
    } catch (error) {
      logger.error('Dosya silme hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya listesi al
  async getFileList() {
    try {
      await this.createImportDir();
      const files = await fs.promises.readdir(this.importDir);

      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.importDir, file);
          const stats = await fs.promises.stat(filePath);
          return {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
          };
        })
      );

      logger.info('Dosya listesi alındı:', {
        count: fileList.length,
      });

      return fileList;
    } catch (error) {
      logger.error('Dosya listesi alma hatası:', {
        error: error.message,
      });
      throw error;
    }
  }

  // Dizin temizle
  async clearDirectory() {
    try {
      const files = await fs.promises.readdir(this.importDir);

      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.importDir, file);
          await fs.promises.unlink(filePath);
        })
      );

      logger.info('Dizin temizlendi:', {
        path: this.importDir,
      });

      return true;
    } catch (error) {
      logger.error('Dizin temizleme hatası:', {
        path: this.importDir,
        error: error.message,
      });
      throw error;
    }
  }

  // İş ilanlarını içe aktar
  async importJobs(filePath, format = 'excel') {
    try {
      let data;
      if (format.toLowerCase() === 'excel') {
        data = await this.readExcel(filePath, { includeHeaders: true });
      } else if (format.toLowerCase() === 'csv') {
        data = await this.readCSV(filePath, { includeHeaders: true });
      } else {
        throw new Error('Geçersiz format');
      }

      const jobs = [];
      for (const row of data) {
        const job = await Job.create({
          title: row[1],
          company: row[2],
          location: row[3],
          type: row[4],
          experience: row[5],
          salary: row[6],
          status: row[7],
        });
        jobs.push(job);
      }

      logger.info('İş ilanları içe aktarıldı:', { count: jobs.length });
      return jobs;
    } catch (error) {
      logger.error('İş ilanları içe aktarma hatası:', {
        path: filePath,
        format,
        error: error.message,
      });
      throw error;
    }
  }

  // Kullanıcıları içe aktar
  async importUsers(filePath, format = 'excel') {
    try {
      let data;
      if (format.toLowerCase() === 'excel') {
        data = await this.readExcel(filePath, { includeHeaders: true });
      } else if (format.toLowerCase() === 'csv') {
        data = await this.readCSV(filePath, { includeHeaders: true });
      } else {
        throw new Error('Geçersiz format');
      }

      const users = [];
      for (const row of data) {
        const user = await User.create({
          name: row[1],
          email: row[2],
          type: row[3],
          location: row[4],
          status: row[5],
        });
        users.push(user);
      }

      logger.info('Kullanıcılar içe aktarıldı:', { count: users.length });
      return users;
    } catch (error) {
      logger.error('Kullanıcılar içe aktarma hatası:', {
        path: filePath,
        format,
        error: error.message,
      });
      throw error;
    }
  }

  // Başvuruları içe aktar
  async importApplications(filePath, format = 'excel') {
    try {
      let data;
      if (format.toLowerCase() === 'excel') {
        data = await this.readExcel(filePath, { includeHeaders: true });
      } else if (format.toLowerCase() === 'csv') {
        data = await this.readCSV(filePath, { includeHeaders: true });
      } else {
        throw new Error('Geçersiz format');
      }

      const applications = [];
      for (const row of data) {
        const application = await Application.create({
          jobId: row[1],
          userId: row[2],
          status: row[3],
        });
        applications.push(application);
      }

      logger.info('Başvurular içe aktarıldı:', { count: applications.length });
      return applications;
    } catch (error) {
      logger.error('Başvurular içe aktarma hatası:', {
        path: filePath,
        format,
        error: error.message,
      });
      throw error;
    }
  }
}

const importManager = new ImportManager();
export { importManager };
export default importManager; 