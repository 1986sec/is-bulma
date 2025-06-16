import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { logger } from './logger.js';

class ExportManager {
  constructor() {
    this.exportDir = path.join(process.cwd(), 'exports');
    this.supportedFormats = ['xlsx', 'csv', 'pdf', 'json'];
  }

  // Dizin oluştur
  async createExportDir() {
    try {
      await fs.promises.mkdir(this.exportDir, { recursive: true });
      logger.info('Export dizini oluşturuldu:', { path: this.exportDir });
    } catch (error) {
      logger.error('Export dizini oluşturma hatası:', {
        path: this.exportDir,
        error: error.message,
      });
      throw error;
    }
  }

  // Excel dosyası oluştur
  async createExcel(data, fileName, options = {}) {
    try {
      await this.createExportDir();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

      // Başlıkları ekle
      if (data.length > 0) {
        worksheet.columns = Object.keys(data[0]).map((key) => ({
          header: key,
          key,
          width: 20,
        }));
      }

      // Verileri ekle
      worksheet.addRows(data);

      // Stil ayarları
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Dosyayı kaydet
      const filePath = path.join(this.exportDir, `${fileName}.xlsx`);
      await workbook.xlsx.writeFile(filePath);

      logger.info('Excel dosyası oluşturuldu:', {
        fileName,
        rowCount: data.length,
      });

      return filePath;
    } catch (error) {
      logger.error('Excel dosyası oluşturma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // CSV dosyası oluştur
  async createCsv(data, fileName, options = {}) {
    try {
      await this.createExportDir();

      const parser = new Parser(options);
      const csv = parser.parse(data);

      const filePath = path.join(this.exportDir, `${fileName}.csv`);
      await fs.promises.writeFile(filePath, csv);

      logger.info('CSV dosyası oluşturuldu:', {
        fileName,
        rowCount: data.length,
      });

      return filePath;
    } catch (error) {
      logger.error('CSV dosyası oluşturma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // PDF dosyası oluştur
  async createPdf(data, fileName, options = {}) {
    try {
      await this.createExportDir();

      const doc = new PDFDocument(options);
      const filePath = path.join(this.exportDir, `${fileName}.pdf`);
      const stream = fs.promises.createWriteStream(filePath);

      doc.pipe(stream);

      // Başlık
      if (options.title) {
        doc.fontSize(20).text(options.title, { align: 'center' });
        doc.moveDown();
      }

      // Tablo başlıkları
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const columnWidth = (doc.page.width - 100) / headers.length;

        headers.forEach((header, i) => {
          doc.text(header, 50 + i * columnWidth, 100);
        });

        doc.moveDown();

        // Veriler
        data.forEach((row, rowIndex) => {
          headers.forEach((header, colIndex) => {
            doc.text(String(row[header]), 50 + colIndex * columnWidth, 120 + rowIndex * 20);
          });
        });
      }

      doc.end();

      logger.info('PDF dosyası oluşturuldu:', {
        fileName,
        rowCount: data.length,
      });

      return filePath;
    } catch (error) {
      logger.error('PDF dosyası oluşturma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // JSON dosyası oluştur
  async createJson(data, fileName, options = {}) {
    try {
      await this.createExportDir();

      const filePath = path.join(this.exportDir, `${fileName}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, options.pretty ? 2 : 0));

      logger.info('JSON dosyası oluşturuldu:', {
        fileName,
        rowCount: data.length,
      });

      return filePath;
    } catch (error) {
      logger.error('JSON dosyası oluşturma hatası:', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  // Dosya oluştur
  async createFile(data, fileName, format, options = {}) {
    try {
      if (!this.supportedFormats.includes(format)) {
        throw new Error('Desteklenmeyen dosya formatı');
      }

      let filePath;
      switch (format) {
        case 'xlsx':
          filePath = await this.createExcel(data, fileName, options);
          break;
        case 'csv':
          filePath = await this.createCsv(data, fileName, options);
          break;
        case 'pdf':
          filePath = await this.createPdf(data, fileName, options);
          break;
        case 'json':
          filePath = await this.createJson(data, fileName, options);
          break;
      }

      logger.info('Dosya oluşturuldu:', {
        fileName,
        format,
        path: filePath,
      });

      return filePath;
    } catch (error) {
      logger.error('Dosya oluşturma hatası:', {
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
      const filePath = path.join(this.exportDir, fileName);
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
      await this.createExportDir();
      const files = await fs.promises.readdir(this.exportDir);

      const fileList = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.exportDir, file);
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
      const files = await fs.promises.readdir(this.exportDir);

      await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(this.exportDir, file);
          await fs.promises.unlink(filePath);
        })
      );

      logger.info('Dizin temizlendi:', {
        path: this.exportDir,
      });

      return true;
    } catch (error) {
      logger.error('Dizin temizleme hatası:', {
        path: this.exportDir,
        error: error.message,
      });
      throw error;
    }
  }
}

const exportManager = new ExportManager();
export { exportManager };
export default exportManager; 