const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  baslik: String,
  aciklama: String,
  gereksinimler: [String],
  isveren: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  goruntu: String,
  onayli: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', JobSchema); 