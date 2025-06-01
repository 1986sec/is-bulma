const multer = require('multer');
const { moderateImage } = require('../utils/imageModeration');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

exports.uploadImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      const result = await moderateImage(req.file.buffer);
      if (result.flagged) {
        return res.status(400).json({ mesaj: 'Uygunsuz görsel.' });
      }
      // Görseli kaydetme işlemi burada yapılır (ör. S3, dosya sistemi)
      res.json({ mesaj: 'Görsel yüklendi.' });
    } catch {
      res.status(500).json({ mesaj: 'Görsel yüklenemedi.' });
    }
  }
]; 