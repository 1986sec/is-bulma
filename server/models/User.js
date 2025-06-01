const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  ad: String,
  soyad: String,
  email: { type: String, unique: true },
  sifre: String,
  rol: { type: String, enum: ['is_arayan', 'isveren', 'admin'], required: true },
  premium: { type: Boolean, default: false },
  profilResmi: String,
  cv: String,
  onayli: { type: Boolean, default: false },
  banli: { type: Boolean, default: false },
  rozet: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema); 