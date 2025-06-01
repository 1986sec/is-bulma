const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJob, updateJob, deleteJob } = require('../controllers/job');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getJobs);
router.get('/:id', getJob);
router.post('/', authMiddleware, createJob);
router.put('/:id', authMiddleware, updateJob);
router.delete('/:id', authMiddleware, deleteJob);

module.exports = router; 