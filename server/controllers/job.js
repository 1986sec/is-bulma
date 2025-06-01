const Job = require('../models/Job');

exports.createJob = async (req, res) => {
  try {
    const { baslik, aciklama, gereksinimler, goruntu } = req.body;
    const job = await Job.create({
      baslik,
      aciklama,
      gereksinimler,
      goruntu,
      isveren: req.user.id
    });
    res.json(job);
  } catch {
    res.status(500).json({ mesaj: 'İş ilanı eklenemedi.' });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ onayli: true }).populate('isveren', 'ad soyad');
    res.json(jobs);
  } catch {
    res.status(500).json({ mesaj: 'İş ilanları alınamadı.' });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('isveren', 'ad soyad');
    res.json(job);
  } catch {
    res.status(404).json({ mesaj: 'İş ilanı bulunamadı.' });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, isveren: req.user.id },
      req.body,
      { new: true }
    );
    res.json(job);
  } catch {
    res.status(500).json({ mesaj: 'İş ilanı güncellenemedi.' });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, isveren: req.user.id });
    res.json({ mesaj: 'İş ilanı silindi.' });
  } catch {
    res.status(500).json({ mesaj: 'İş ilanı silinemedi.' });
  }
}; 