const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { validateCompany } = require('../utils/validation');
const { uploadFile } = require('../utils/upload');
const { clearCache } = require('../utils/cache');
const logger = require('../utils/logger');

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const { error } = validateCompany(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const company = new Company({
      ...req.body,
      createdBy: req.user._id,
    });

    if (req.files && req.files.logo) {
      const logo = await uploadFile(req.files.logo, 'company');
      company.logo = logo.url;
    }

    if (req.files && req.files.cover) {
      const cover = await uploadFile(req.files.cover, 'company');
      company.cover = cover.url;
    }

    await company.save();
    await clearCache('companies');

    logger.info(`Company created: ${company._id}`);
    res.status(201).json(company);
  } catch (error) {
    logger.error(`Error creating company: ${error.message}`);
    res.status(500).json({ error: 'Error creating company' });
  }
};

// Update a company
exports.updateCompany = async (req, res) => {
  try {
    const { error } = validateCompany(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (req.files && req.files.logo) {
      const logo = await uploadFile(req.files.logo, 'company');
      company.logo = logo.url;
    }

    if (req.files && req.files.cover) {
      const cover = await uploadFile(req.files.cover, 'company');
      company.cover = cover.url;
    }

    Object.assign(company, req.body);
    company.updatedBy = req.user._id;
    await company.save();
    await clearCache('companies');

    logger.info(`Company updated: ${company._id}`);
    res.json(company);
  } catch (error) {
    logger.error(`Error updating company: ${error.message}`);
    res.status(500).json({ error: 'Error updating company' });
  }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (company.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await company.remove();
    await clearCache('companies');

    logger.info(`Company deleted: ${company._id}`);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting company: ${error.message}`);
    res.status(500).json({ error: 'Error deleting company' });
  }
};

// Get a company
exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('followers', 'name email');

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await company.incrementViews();
    res.json(company);
  } catch (error) {
    logger.error(`Error getting company: ${error.message}`);
    res.status(500).json({ error: 'Error getting company' });
  }
};

// Get companies
exports.getCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      search,
      industry,
      type,
      status,
      verified,
      featured,
    } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (industry) {
      query.industry = industry;
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (verified) {
      query.verified = verified === 'true';
    }

    if (featured) {
      query.featured = featured === 'true';
    }

    const companies = await Company.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Company.countDocuments(query);

    res.json({
      companies,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting companies: ${error.message}`);
    res.status(500).json({ error: 'Error getting companies' });
  }
};

// Get popular companies
exports.getPopularCompanies = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const companies = await Company.find({ status: 'active', verified: true })
      .sort('-views')
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    res.json(companies);
  } catch (error) {
    logger.error(`Error getting popular companies: ${error.message}`);
    res.status(500).json({ error: 'Error getting popular companies' });
  }
};

// Get company stats
exports.getCompanyStats = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await company.updateStats();
    res.json(company.stats);
  } catch (error) {
    logger.error(`Error getting company stats: ${error.message}`);
    res.status(500).json({ error: 'Error getting company stats' });
  }
};

// Update company status
exports.updateCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.status = status;
    company.updatedBy = req.user._id;
    await company.save();
    await clearCache('companies');

    logger.info(`Company status updated: ${company._id}`);
    res.json(company);
  } catch (error) {
    logger.error(`Error updating company status: ${error.message}`);
    res.status(500).json({ error: 'Error updating company status' });
  }
};

// Update company verification
exports.updateCompanyVerification = async (req, res) => {
  try {
    const { verified } = req.body;
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    company.verified = verified;
    company.updatedBy = req.user._id;
    await company.save();
    await clearCache('companies');

    logger.info(`Company verification updated: ${company._id}`);
    res.json(company);
  } catch (error) {
    logger.error(`Error updating company verification: ${error.message}`);
    res.status(500).json({ error: 'Error updating company verification' });
  }
};

// Follow/Unfollow company
exports.toggleFollowCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const followerIndex = company.followers.indexOf(req.user._id);
    if (followerIndex === -1) {
      company.followers.push(req.user._id);
    } else {
      company.followers.splice(followerIndex, 1);
    }

    await company.save();
    await clearCache('companies');

    logger.info(`Company follow status updated: ${company._id}`);
    res.json(company);
  } catch (error) {
    logger.error(`Error toggling company follow: ${error.message}`);
    res.status(500).json({ error: 'Error toggling company follow' });
  }
}; 