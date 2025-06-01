const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/upload');
const { authMiddleware } = require('../middleware/auth');

router.post('/image', authMiddleware, uploadImage);

module.exports = router; 