const Match = require('../models/Match');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// @desc    Get all matches
// @route   GET /api/matches
// @access  Private
exports.getMatches = async (req, res) => {
  try {
    const {
      status,
      type,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {
      $or: [{ user: req.user.id }, { employer: req.user.id }],
    };

    if (status) query.status = status;
    if (type) query.type = type;

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query
    const matches = await Match.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('employer', 'name email')
      .populate('job', 'title company');

    // Get total count
    const total = await Match.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        matches,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Get single match
// @route   GET /api/matches/:id
// @access  Private
exports.getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('user', 'name email')
      .populate('employer', 'name email')
      .populate('job', 'title company');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Eşleşme bulunamadı',
      });
    }

    // Check if user is part of the match
    if (
      match.user.toString() !== req.user.id &&
      match.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    logger.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Create match
// @route   POST /api/matches
// @access  Private (Employer)
exports.createMatch = async (req, res) => {
  try {
    const { jobId, userId, type, message } = req.body;

    // Validate input
    if (!jobId || !userId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen gerekli alanları doldurun',
      });
    }

    // Check if job exists and belongs to employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı',
      });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      job: jobId,
      user: userId,
      employer: req.user.id,
    });

    if (existingMatch) {
      return res.status(400).json({
        success: false,
        message: 'Bu eşleşme zaten mevcut',
      });
    }

    // Create match
    const match = await Match.create({
      job: jobId,
      user: userId,
      employer: req.user.id,
      type,
      message,
      status: 'pending',
    });

    // Create notification for user
    await Notification.create({
      user: userId,
      type: 'new_match',
      title: 'Yeni Eşleşme',
      message: `${req.user.name} adlı işveren sizinle eşleşmek istiyor.`,
      data: {
        matchId: match._id,
        jobId: jobId,
      },
    });

    res.status(201).json({
      success: true,
      data: match,
    });
  } catch (error) {
    logger.error('Create match error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Update match
// @route   PUT /api/matches/:id
// @access  Private
exports.updateMatch = async (req, res) => {
  try {
    let match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Eşleşme bulunamadı',
      });
    }

    // Check if user is part of the match
    if (
      match.user.toString() !== req.user.id &&
      match.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Update match
    match = await Match.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    logger.error('Update match error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Delete match
// @route   DELETE /api/matches/:id
// @access  Private
exports.deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Eşleşme bulunamadı',
      });
    }

    // Check if user is part of the match
    if (
      match.user.toString() !== req.user.id &&
      match.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    await match.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Accept match
// @route   POST /api/matches/:id/accept
// @access  Private
exports.acceptMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Eşleşme bulunamadı',
      });
    }

    // Check if user is part of the match
    if (
      match.user.toString() !== req.user.id &&
      match.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Update match status
    match.status = 'accepted';
    await match.save();

    // Create notification for the other party
    const notificationUser =
      match.user.toString() === req.user.id
        ? match.employer
        : match.user;

    await Notification.create({
      user: notificationUser,
      type: 'match_accepted',
      title: 'Eşleşme Kabul Edildi',
      message: `${req.user.name} adlı kullanıcı eşleşmeyi kabul etti.`,
      data: {
        matchId: match._id,
        jobId: match.job,
      },
    });

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    logger.error('Accept match error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Reject match
// @route   POST /api/matches/:id/reject
// @access  Private
exports.rejectMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Eşleşme bulunamadı',
      });
    }

    // Check if user is part of the match
    if (
      match.user.toString() !== req.user.id &&
      match.employer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Update match status
    match.status = 'rejected';
    await match.save();

    // Create notification for the other party
    const notificationUser =
      match.user.toString() === req.user.id
        ? match.employer
        : match.user;

    await Notification.create({
      user: notificationUser,
      type: 'match_rejected',
      title: 'Eşleşme Reddedildi',
      message: `${req.user.name} adlı kullanıcı eşleşmeyi reddetti.`,
      data: {
        matchId: match._id,
        jobId: match.job,
      },
    });

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    logger.error('Reject match error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
}; 