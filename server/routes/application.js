const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Create a new application
router.post('/', auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
]), applicationController.createApplication);

// Update an application
router.put('/:id', auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'portfolio', maxCount: 1 },
]), applicationController.updateApplication);

// Delete an application
router.delete('/:id', auth, applicationController.deleteApplication);

// Get an application
router.get('/:id', auth, applicationController.getApplication);

// Get applications
router.get('/', auth, applicationController.getApplications);

// Get user applications
router.get('/user', auth, applicationController.getUserApplications);

// Get job applications
router.get('/job/:jobId', auth, applicationController.getJobApplications);

// Update application status
router.patch('/:id/status', auth, applicationController.updateApplicationStatus);

// Schedule interview
router.post('/:id/interview', auth, applicationController.scheduleInterview);

module.exports = router; 