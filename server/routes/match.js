const express = require('express');
const router = express.Router();
const { createMatch, getMatches } = require('../controllers/match');
const { adminMiddleware } = require('../middleware/auth');

router.post('/', adminMiddleware, createMatch);
router.get('/', adminMiddleware, getMatches);

module.exports = router; 