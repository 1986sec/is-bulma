const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

// MongoDB bağlantısı
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Orta katmanlar
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Test endpoint
app.get('/', (req, res) => res.send('İş Platformu API Çalışıyor!'));

// WebSocket bağlantısı (ileride eklenecek)
io.on('connection', (socket) => {
  console.log('Yeni bir kullanıcı bağlandı:', socket.id);
});

app.use('/api', require('./routes/api'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/match', require('./routes/match'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notification'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
}); 