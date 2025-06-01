const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notification');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, getNotifications);

module.exports = router; 