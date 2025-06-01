const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  is_arayan: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isveren: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  skor: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', MatchSchema); 