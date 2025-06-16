const Job = require('../models/Job');
const User = require('../models/User');
const logger = require('../utils/logger');

// @desc    Gelişmiş iş ilanı araması
// @route   GET /api/search/jobs
// @access  Public
exports.searchJobs = async (req, res) => {
  try {
    const {
      query,
      type,
      location,
      experience,
      salary,
      skills,
      company,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    // Arama sorgusu oluştur
    const searchQuery = {};

    // Metin araması
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ];
    }

    // Filtreler
    if (type) searchQuery.type = type;
    if (location) searchQuery.location = { $regex: location, $options: 'i' };
    if (experience) searchQuery.experience = experience;
    if (salary) searchQuery.salary = { $gte: parseInt(salary) };
    if (skills) {
      searchQuery.skills = {
        $in: skills.split(',').map((skill) => new RegExp(skill.trim(), 'i')),
      };
    }
    if (company) {
      searchQuery.company = { $regex: company, $options: 'i' };
    }

    // Sıralama seçenekleri
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

    // Sorguyu çalıştır
    const jobs = await Job.find(searchQuery)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('company', 'name logo');

    // Toplam sonuç sayısını al
    const total = await Job.countDocuments(searchQuery);

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
    logger.error('Job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Arama sırasında bir hata oluştu',
    });
  }
};

// @desc    Gelişmiş kullanıcı araması
// @route   GET /api/search/users
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const {
      query,
      role,
      skills,
      experience,
      location,
      sort = 'relevance',
      page = 1,
      limit = 10,
    } = req.query;

    // Arama sorgusu oluştur
    const searchQuery = {};

    // Metin araması
    if (query) {
      searchQuery.$or = [
        { username: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } },
      ];
    }

    // Filtreler
    if (role) searchQuery.role = role;
    if (skills) {
      searchQuery.skills = {
        $in: skills.split(',').map((skill) => new RegExp(skill.trim(), 'i')),
      };
    }
    if (experience) searchQuery.experience = experience;
    if (location) searchQuery.location = { $regex: location, $options: 'i' };

    // Sıralama seçenekleri
    let sortOption = {};
    switch (sort) {
      case 'relevance':
        // Metin araması varsa, eşleşme puanına göre sırala
        if (query) {
          sortOption = { score: { $meta: 'textScore' } };
        } else {
          sortOption = { createdAt: -1 };
        }
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    // Sorguyu çalıştır
    const users = await User.find(searchQuery)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-password -refreshToken');

    // Toplam sonuç sayısını al
    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('User search error:', error);
    res.status(500).json({
      success: false,
      message: 'Arama sırasında bir hata oluştu',
    });
  }
};

// @desc    Otomatik tamamlama önerileri
// @route   GET /api/search/suggestions
// @access  Public
exports.getSuggestions = async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query || !type) {
      return res.status(400).json({
        success: false,
        message: 'Arama sorgusu ve tipi gerekli',
      });
    }

    let suggestions = [];

    switch (type) {
      case 'jobs':
        // İş ilanı başlıklarından öneriler
        suggestions = await Job.find({
          title: { $regex: query, $options: 'i' },
        })
          .select('title')
          .limit(5);
        break;

      case 'skills':
        // Kullanıcı becerilerinden öneriler
        suggestions = await User.distinct('skills', {
          skills: { $regex: query, $options: 'i' },
        }).limit(5);
        break;

      case 'locations':
        // Konum önerileri
        suggestions = await Job.distinct('location', {
          location: { $regex: query, $options: 'i' },
        }).limit(5);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Geçersiz öneri tipi',
        });
    }

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error('Search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Öneriler alınırken bir hata oluştu',
    });
  }
}; 