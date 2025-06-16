import { logger } from './logger.js';
import { cache } from './cache.js';

const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Payment = require('../models/Payment');

// Calculate user statistics
const calculateUserStats = async (userId) => {
  try {
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

    return {
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
  } catch (error) {
    logger.error(`Error calculating user stats: ${error.message}`);
    throw error;
  }
};

// Calculate company statistics
const calculateCompanyStats = async (companyId) => {
  try {
    const [
      jobs,
      applications,
      views,
    ] = await Promise.all([
      Job.find({ company: companyId }),
      Application.find({ company: companyId }),
      Company.findById(companyId).select('stats.views'),
    ]);

    return {
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
  } catch (error) {
    logger.error(`Error calculating company stats: ${error.message}`);
    throw error;
  }
};

// Calculate job statistics
const calculateJobStats = async (jobId) => {
  try {
    const [
      applications,
      views,
    ] = await Promise.all([
      Application.find({ job: jobId }),
      Job.findById(jobId).select('views'),
    ]);

    return {
      applications: {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
      },
      views: views ? views.views : 0,
    };
  } catch (error) {
    logger.error(`Error calculating job stats: ${error.message}`);
    throw error;
  }
};

// Calculate payment statistics
const calculatePaymentStats = async () => {
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

    return {
      total: totalAmount[0]?.total || 0,
      completed: completedAmount[0]?.total || 0,
      pending: pendingAmount[0]?.total || 0,
      failed: failedAmount[0]?.total || 0,
    };
  } catch (error) {
    logger.error(`Error calculating payment stats: ${error.message}`);
    throw error;
  }
};

// Calculate overall statistics
const calculateOverallStats = async () => {
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

    return {
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
  } catch (error) {
    logger.error(`Error calculating overall stats: ${error.message}`);
    throw error;
  }
};

class StatsManager {
  constructor() {
    this.calculateUserStats = calculateUserStats;
    this.calculateCompanyStats = calculateCompanyStats;
    this.calculateJobStats = calculateJobStats;
    this.calculatePaymentStats = calculatePaymentStats;
    this.calculateOverallStats = calculateOverallStats;
  }
}

const stats = new StatsManager();
export { stats };
export default stats; 