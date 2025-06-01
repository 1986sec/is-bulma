const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { ad, soyad, email, sifre, rol } = req.body;
    const mevcut = await User.findOne({ email });
    if (mevcut) return res.status(400).json({ mesaj: 'Bu e-posta zaten kayıtlı.' });
    const hash = await bcrypt.hash(sifre, 10);
    const user = await User.create({ ad, soyad, email, sifre: hash, rol });
    res.json({ mesaj: 'Kayıt başarılı.' });
  } catch (err) {
    res.status(500).json({ mesaj: 'Kayıt sırasında hata oluştu.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, sifre } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ mesaj: 'Kullanıcı bulunamadı.' });
    const dogru = await bcrypt.compare(sifre, user.sifre);
    if (!dogru) return res.status(400).json({ mesaj: 'Şifre hatalı.' });
    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ mesaj: 'Giriş sırasında hata oluştu.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-sifre');
    res.json(user);
  } catch (err) {
    res.status(500).json({ mesaj: 'Profil alınamadı.' });
  }
}; 