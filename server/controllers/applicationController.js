const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const { validateApplication } = require('../utils/validation');
const { uploadFile } = require('../utils/upload');
const { clearCache } = require('../utils/cache');
const { sendNotification } = require('../utils/notification');
const logger = require('../utils/logger');

// Create a new application
exports.createApplication = async (req, res) => {
  try {
    const { error } = validateApplication(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const job = await Job.findById(req.body.job);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ error: 'Job is not active' });
    }

    const existingApplication = await Application.findOne({
      job: req.body.job,
      applicant: req.user._id,
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    const application = new Application({
      ...req.body,
      company: job.company,
      applicant: req.user._id,
      createdBy: req.user._id,
    });

    if (req.files && req.files.resume) {
      const resume = await uploadFile(req.files.resume, 'resume');
      application.resume = resume.url;
    }

    if (req.files && req.files.portfolio) {
      const portfolio = await uploadFile(req.files.portfolio, 'portfolio');
      application.portfolio = portfolio.url;
    }

    await application.save();
    await clearCache('applications');

    // Send notification to company
    const company = await Company.findById(job.company);
    if (company) {
      await sendNotification({
        user: company.createdBy,
        type: 'application',
        title: 'New Job Application',
        message: `${req.user.name} has applied for ${job.title}`,
        data: {
          applicationId: application._id,
          jobId: job._id,
        },
      });
    }

    logger.info(`Application created: ${application._id}`);
    res.status(201).json(application);
  } catch (error) {
    logger.error(`Error creating application: ${error.message}`);
    res.status(500).json({ error: 'Error creating application' });
  }
};

// Update an application
exports.updateApplication = async (req, res) => {
  try {
    const { error } = validateApplication(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (req.files && req.files.resume) {
      const resume = await uploadFile(req.files.resume, 'resume');
      application.resume = resume.url;
    }

    if (req.files && req.files.portfolio) {
      const portfolio = await uploadFile(req.files.portfolio, 'portfolio');
      application.portfolio = portfolio.url;
    }

    Object.assign(application, req.body);
    application.updatedBy = req.user._id;
    await application.save();
    await clearCache('applications');

    logger.info(`Application updated: ${application._id}`);
    res.json(application);
  } catch (error) {
    logger.error(`Error updating application: ${error.message}`);
    res.status(500).json({ error: 'Error updating application' });
  }
};

// Delete an application
exports.deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await application.remove();
    await clearCache('applications');

    logger.info(`Application deleted: ${application._id}`);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting application: ${error.message}`);
    res.status(500).json({ error: 'Error deleting application' });
  }
};

// Get an application
exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title company')
      .populate('company', 'name logo')
      .populate('applicant', 'name email')
      .populate('createdBy', 'name email');

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (
      application.applicant.toString() !== req.user._id.toString() &&
      application.company.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(application);
  } catch (error) {
    logger.error(`Error getting application: ${error.message}`);
    res.status(500).json({ error: 'Error getting application' });
  }
};

// Get applications
exports.getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      status,
      job,
      company,
      applicant,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (job) {
      query.job = job;
    }

    if (company) {
      query.company = company;
    }

    if (applicant) {
      query.applicant = applicant;
    }

    const applications = await Application.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('job', 'title company')
      .populate('company', 'name logo')
      .populate('applicant', 'name email');

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting applications: ${error.message}`);
    res.status(500).json({ error: 'Error getting applications' });
  }
};

// Get user applications
exports.getUserApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      status,
    } = req.query;

    const query = {
      applicant: req.user._id,
    };

    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('job', 'title company')
      .populate('company', 'name logo');

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting user applications: ${error.message}`);
    res.status(500).json({ error: 'Error getting user applications' });
  }
};

// Get job applications
exports.getJobApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      status,
    } = req.query;

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const query = {
      job: req.params.jobId,
    };

    if (status) {
      query.status = status;
    }

    const applications = await Application.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('applicant', 'name email')
      .populate('createdBy', 'name email');

    const total = await Application.countDocuments(query);

    res.json({
      applications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting job applications: ${error.message}`);
    res.status(500).json({ error: 'Error getting job applications' });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    if (!['pending', 'reviewing', 'shortlisted', 'interviewed', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (job.company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await application.updateStatus(status, feedback);
    await clearCache('applications');

    // Send notification to applicant
    await sendNotification({
      user: application.applicant,
      type: 'application_status',
      title: 'Application Status Updated',
      message: `Your application for ${job.title} has been ${status}`,
      data: {
        applicationId: application._id,
        jobId: job._id,
      },
    });

    logger.info(`Application status updated: ${application._id}`);
    res.json(application);
  } catch (error) {
    logger.error(`Error updating application status: ${error.message}`);
    res.status(500).json({ error: 'Error updating application status' });
  }
};

// Schedule interview
exports.scheduleInterview = async (req, res) => {
  try {
    const { date, type, location, notes } = req.body;
    if (!date || !type) {
      return res.status(400).json({ error: 'Date and type are required' });
    }

    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (job.company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await application.scheduleInterview({
      date: new Date(date),
      type,
      location,
      notes,
    });
    await clearCache('applications');

    // Send notification to applicant
    await sendNotification({
      user: application.applicant,
      type: 'interview',
      title: 'Interview Scheduled',
      message: `You have been scheduled for an interview for ${job.title}`,
      data: {
        applicationId: application._id,
        jobId: job._id,
        interview: application.interview,
      },
    });

    logger.info(`Interview scheduled: ${application._id}`);
    res.json(application);
  } catch (error) {
    logger.error(`Error scheduling interview: ${error.message}`);
    res.status(500).json({ error: 'Error scheduling interview' });
  }
}; 