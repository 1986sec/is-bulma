const Match = require('../models/Match');
const { calculateMatchScore } = require('../utils/matchScore');
const User = require('../models/User');
const Job = require('../models/Job');

exports.createMatch = async (req, res) => {
  try {
    const { is_arayan_id, job_id } = req.body;
    const is_arayan = await User.findById(is_arayan_id);
    const job = await Job.findById(job_id);
    if (!is_arayan || !job) return res.status(404).json({ mesaj: 'Kullanıcı veya iş ilanı bulunamadı.' });
    const skor = calculateMatchScore(is_arayan.cv || '', job.aciklama || '');
    const match = await Match.create({
      is_arayan: is_arayan_id,
      isveren: job.isveren,
      job: job_id,
      skor
    });
    res.json(match);
  } catch {
    res.status(500).json({ mesaj: 'Eşleşme oluşturulamadı.' });
  }
};

exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find().populate('is_arayan isveren job');
    res.json(matches);
  } catch {
    res.status(500).json({ mesaj: 'Eşleşmeler alınamadı.' });
  }
}; 