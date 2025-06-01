const User = require('../models/User');

exports.approveUser = async (req, res) => {
  try {
    const { id } = req.body;
    await User.findByIdAndUpdate(id, { onayli: true });
    res.json({ mesaj: 'Kullanıcı onaylandı.' });
  } catch {
    res.status(500).json({ mesaj: 'Onay sırasında hata oluştu.' });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { id } = req.body;
    await User.findByIdAndUpdate(id, { banli: true });
    res.json({ mesaj: 'Kullanıcı banlandı.' });
  } catch {
    res.status(500).json({ mesaj: 'Ban sırasında hata oluştu.' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const aktif = await User.countDocuments({ banli: false });
    const premium = await User.countDocuments({ premium: true });
    // Eşleşme ve diğer istatistikler ileride eklenecek
    res.json({ aktif, premium, eslesme: 0 });
  } catch {
    res.status(500).json({ mesaj: 'Dashboard alınamadı.' });
  }
}; 