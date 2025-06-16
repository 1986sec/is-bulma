const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
  try {
    const {
      search,
      type,
      location,
      experience,
      salary,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) query.type = type;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (experience) query.experience = experience;
    if (salary) query.salary = { $gte: parseInt(salary) };

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'salary-high':
        sortOption = { salary: -1 };
        break;
      case 'salary-low':
        sortOption = { salary: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Execute query
    const jobs = await Job.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('employer', 'name email');

    // Get total count
    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        jobs,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'employer',
      'name email'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Create job
// @route   POST /api/jobs
// @access  Private (Employer)
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      company,
      location,
      type,
      experience,
      salary,
      requirements,
      benefits,
    } = req.body;

    // Validate input
    if (!title || !description || !company || !location || !type) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen gerekli alanları doldurun',
      });
    }

    // Create job
    const job = await Job.create({
      title,
      description,
      company,
      location,
      type,
      experience,
      salary,
      requirements,
      benefits,
      employer: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer)
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    // Check ownership
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    // Update job
    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    // Check ownership
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    await job.remove();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Apply to job
// @route   POST /api/jobs/:id/apply
// @access  Private (User)
exports.applyToJob = async (req, res) => {
  try {
    const { coverLetter, resume } = req.body;

    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    // Check if already applied
    if (
      job.applicants.some(
        (applicant) => applicant.user.toString() === req.user.id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Bu ilana zaten başvurdunuz',
      });
    }

    // Add application
    job.applicants.push({
      user: req.user.id,
      coverLetter,
      resume,
      status: 'pending',
    });

    await job.save();

    // Create notification for employer
    await Notification.create({
      user: job.employer,
      type: 'job_application',
      title: 'Yeni İş Başvurusu',
      message: `${req.user.name} adlı kullanıcı "${job.title}" ilanına başvurdu.`,
      data: {
        jobId: job._id,
        applicantId: req.user.id,
      },
    });

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    logger.error('Apply to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Get my jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id }).populate(
      'applicants.user',
      'name email'
    );

    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    logger.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
};

// @desc    Get job applications
// @route   GET /api/jobs/:id/applications
// @access  Private (Employer)
exports.getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      'applicants.user',
      'name email'
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'İş ilanı bulunamadı',
      });
    }

    // Check ownership
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlemi yapmaya yetkiniz yok',
      });
    }

    res.status(200).json({
      success: true,
      data: job.applicants,
    });
  } catch (error) {
    logger.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
    });
  }
}; 