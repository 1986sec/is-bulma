const express = require('express');
const router = express.Router();
const { buyPremium, premiumCallback } = require('../controllers/payment');
const { authMiddleware } = require('../middleware/auth');

router.post('/buy', authMiddleware, buyPremium);
router.post('/callback', premiumCallback);

module.exports = router; 