const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Create a new company
router.post('/', auth, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), companyController.createCompany);

// Update a company
router.put('/:id', auth, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), companyController.updateCompany);

// Delete a company
router.delete('/:id', auth, companyController.deleteCompany);

// Get a company
router.get('/:id', companyController.getCompany);

// Get companies
router.get('/', companyController.getCompanies);

// Get popular companies
router.get('/popular', companyController.getPopularCompanies);

// Get company stats
router.get('/:id/stats', auth, companyController.getCompanyStats);

// Update company status
router.patch('/:id/status', auth, companyController.updateCompanyStatus);

// Update company verification
router.patch('/:id/verification', auth, companyController.updateCompanyVerification);

// Follow/Unfollow company
router.post('/:id/follow', auth, companyController.toggleFollowCompany);

module.exports = router; 