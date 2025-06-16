const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Upload a file
router.post('/', auth, upload.single('file'), fileController.uploadFile);

// Delete a file
router.delete('/:id', auth, fileController.deleteFile);

// Get a file
router.get('/:id', auth, fileController.getFile);

// Get files
router.get('/', auth, fileController.getFiles);

// Get user files
router.get('/user', auth, fileController.getUserFiles);

// Update file metadata
router.patch('/:id/metadata', auth, fileController.updateFileMetadata);

// Update file status
router.patch('/:id/status', auth, fileController.updateFileStatus);

module.exports = router; 