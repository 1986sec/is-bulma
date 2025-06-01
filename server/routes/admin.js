const express = require('express');
const router = express.Router();
const { approveUser, banUser, getDashboard } = require('../controllers/admin');
const { adminMiddleware } = require('../middleware/auth');

router.post('/approve/user', adminMiddleware, approveUser);
router.post('/ban', adminMiddleware, banUser);
router.get('/dashboard', adminMiddleware, getDashboard);

module.exports = router; 