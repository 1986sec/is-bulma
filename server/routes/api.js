const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/user');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);

module.exports = router; 