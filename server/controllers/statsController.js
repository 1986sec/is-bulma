const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// Get overall stats
exports.getOverallStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalCompanies,
      totalApplications,
      totalPayments,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Company.countDocuments(),
      Application.countDocuments(),
      Payment.countDocuments(),
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: await User.countDocuments({ status: 'active' }),
        inactive: await User.countDocuments({ status: 'inactive' }),
        verified: await User.countDocuments({ verified: true }),
      },
      jobs: {
        total: totalJobs,
        active: await Job.countDocuments({ status: 'active' }),
        closed: await Job.countDocuments({ status: 'closed' }),
        featured: await Job.countDocuments({ featured: true }),
      },
      companies: {
        total: totalCompanies,
        active: await Company.countDocuments({ status: 'active' }),
        inactive: await Company.countDocuments({ status: 'inactive' }),
        verified: await Company.countDocuments({ verified: true }),
      },
      applications: {
        total: totalApplications,
        pending: await Application.countDocuments({ status: 'pending' }),
        accepted: await Application.countDocuments({ status: 'accepted' }),
        rejected: await Application.countDocuments({ status: 'rejected' }),
      },
      payments: {
        total: totalPayments,
        completed: await Payment.countDocuments({ status: 'completed' }),
        pending: await Payment.countDocuments({ status: 'pending' }),
        failed: await Payment.countDocuments({ status: 'failed' }),
      },
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error getting overall stats: ${error.message}`);
    res.status(500).json({ error: 'Error getting overall stats' });
  }
};

// Get user stats
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    const [
      applications,
      jobs,
      companies,
      payments,
    ] = await Promise.all([
      Application.find({ applicant: userId }),
      Job.find({ createdBy: userId }),
      Company.find({ createdBy: userId }),
      Payment.find({ user: userId }),
    ]);

    const stats = {
      applications: {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
      },
      jobs: {
        total: jobs.length,
        active: jobs.filter(job => job.status === 'active').length,
        closed: jobs.filter(job => job.status === 'closed').length,
        featured: jobs.filter(job => job.featured).length,
      },
      companies: {
        total: companies.length,
        active: companies.filter(company => company.status === 'active').length,
        inactive: companies.filter(company => company.status === 'inactive').length,
        verified: companies.filter(company => company.verified).length,
      },
      payments: {
        total: payments.length,
        completed: payments.filter(payment => payment.status === 'completed').length,
        pending: payments.filter(payment => payment.status === 'pending').length,
        failed: payments.filter(payment => payment.status === 'failed').length,
      },
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error getting user stats: ${error.message}`);
    res.status(500).json({ error: 'Error getting user stats' });
  }
};

// Get company stats
exports.getCompanyStats = async (req, res) => {
  try {
    const companyId = req.params.companyId;

    const [
      jobs,
      applications,
      views,
    ] = await Promise.all([
      Job.find({ company: companyId }),
      Application.find({ company: companyId }),
      Company.findById(companyId).select('stats.views'),
    ]);

    const stats = {
      jobs: {
        total: jobs.length,
        active: jobs.filter(job => job.status === 'active').length,
        closed: jobs.filter(job => job.status === 'closed').length,
        featured: jobs.filter(job => job.featured).length,
      },
      applications: {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
      },
      views: views ? views.stats.views : {
        total: 0,
        today: 0,
        week: 0,
        month: 0,
      },
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error getting company stats: ${error.message}`);
    res.status(500).json({ error: 'Error getting company stats' });
  }
};

// Get job stats
exports.getJobStats = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const [
      applications,
      views,
    ] = await Promise.all([
      Application.find({ job: jobId }),
      Job.findById(jobId).select('views'),
    ]);

    const stats = {
      applications: {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
      },
      views: views ? views.views : 0,
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error getting job stats: ${error.message}`);
    res.status(500).json({ error: 'Error getting job stats' });
  }
};

// Get payment stats
exports.getPaymentStats = async (req, res) => {
  try {
    const [
      totalAmount,
      completedAmount,
      pendingAmount,
      failedAmount,
    ] = await Promise.all([
      Payment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'failed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const stats = {
      total: totalAmount[0]?.total || 0,
      completed: completedAmount[0]?.total || 0,
      pending: pendingAmount[0]?.total || 0,
      failed: failedAmount[0]?.total || 0,
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error getting payment stats: ${error.message}`);
    res.status(500).json({ error: 'Error getting payment stats' });
  }
}; 