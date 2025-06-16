const File = require('../models/File');
const { uploadFile, deleteFile } = require('../utils/upload');
const { clearCache } = require('../utils/cache');
const logger = require('../utils/logger');

// Upload a file
exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category = 'other' } = req.body;
    const file = await uploadFile(req.files.file, category);

    const newFile = new File({
      name: file.name,
      originalName: req.files.file.name,
      type: file.type,
      size: file.size,
      url: file.url,
      path: file.path,
      bucket: file.bucket,
      key: file.key,
      mimeType: file.mimeType,
      extension: file.extension,
      category,
      uploadedBy: req.user._id,
      createdBy: req.user._id,
    });

    await newFile.save();
    await clearCache('files');

    logger.info(`File uploaded: ${newFile._id}`);
    res.status(201).json(newFile);
  } catch (error) {
    logger.error(`Error uploading file: ${error.message}`);
    res.status(500).json({ error: 'Error uploading file' });
  }
};

// Delete a file
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await deleteFile(file.key);
    await file.remove();
    await clearCache('files');

    logger.info(`File deleted: ${file._id}`);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    res.status(500).json({ error: 'Error deleting file' });
  }
};

// Get a file
exports.getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(file);
  } catch (error) {
    logger.error(`Error getting file: ${error.message}`);
    res.status(500).json({ error: 'Error getting file' });
  }
};

// Get files
exports.getFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      category,
      type,
      uploadedBy,
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (uploadedBy) {
      query.uploadedBy = uploadedBy;
    }

    const files = await File.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'name email')
      .populate('createdBy', 'name email');

    const total = await File.countDocuments(query);

    res.json({
      files,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting files: ${error.message}`);
    res.status(500).json({ error: 'Error getting files' });
  }
};

// Get user files
exports.getUserFiles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      category,
      type,
    } = req.query;

    const query = {
      uploadedBy: req.user._id,
    };

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    const files = await File.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await File.countDocuments(query);

    res.json({
      files,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting user files: ${error.message}`);
    res.status(500).json({ error: 'Error getting user files' });
  }
};

// Update file metadata
exports.updateFileMetadata = async (req, res) => {
  try {
    const { metadata } = req.body;
    if (!metadata) {
      return res.status(400).json({ error: 'Metadata is required' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await file.updateMetadata(metadata);
    await clearCache('files');

    logger.info(`File metadata updated: ${file._id}`);
    res.json(file);
  } catch (error) {
    logger.error(`Error updating file metadata: ${error.message}`);
    res.status(500).json({ error: 'Error updating file metadata' });
  }
};

// Update file status
exports.updateFileStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await file.updateStatus(status);
    await clearCache('files');

    logger.info(`File status updated: ${file._id}`);
    res.json(file);
  } catch (error) {
    logger.error(`Error updating file status: ${error.message}`);
    res.status(500).json({ error: 'Error updating file status' });
  }
}; 