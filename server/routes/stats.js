const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Get overall stats
router.get('/overall', auth, statsController.getOverallStats);

// Get user stats
router.get('/user/:userId?', auth, statsController.getUserStats);

// Get company stats
router.get('/company/:companyId', auth, statsController.getCompanyStats);

// Get job stats
router.get('/job/:jobId', auth, statsController.getJobStats);

// Get payment stats
router.get('/payment', auth, statsController.getPaymentStats);

module.exports = router; 