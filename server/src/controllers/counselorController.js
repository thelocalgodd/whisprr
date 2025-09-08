const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult } = require('express-validator');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/verification');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `verification-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

const applyForVerification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user._id);

    if (user.role !== 'counselor') {
      return res.status(400).json({ error: 'Only counselors can apply for verification' });
    }

    if (user.counselorInfo.verificationStatus === 'pending') {
      return res.status(400).json({ error: 'Verification application already pending' });
    }

    if (user.counselorInfo.verificationStatus === 'approved') {
      return res.status(400).json({ error: 'Account already verified' });
    }

    const { specializations, certifications } = req.body;

    user.counselorInfo.specializations = specializations || [];
    user.counselorInfo.certifications = certifications || [];
    user.counselorInfo.verificationStatus = 'pending';

    if (req.files && req.files.length > 0) {
      user.counselorInfo.verificationDocuments = req.files.map(file => file.path);
    }

    await user.save();

    res.json({
      message: 'Verification application submitted successfully',
      verificationStatus: user.counselorInfo.verificationStatus
    });
  } catch (error) {
    console.error('Verification application error:', error);
    res.status(500).json({ error: 'Failed to submit verification application' });
  }
};

const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.role !== 'counselor') {
      return res.status(400).json({ error: 'Only counselors can check verification status' });
    }

    res.json({
      verificationStatus: user.counselorInfo.verificationStatus,
      isVerified: user.counselorInfo.isVerified,
      specializations: user.counselorInfo.specializations,
      certifications: user.counselorInfo.certifications,
      submittedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
};

const approveVerification = async (req, res) => {
  try {
    const { counselorId } = req.params;
    const { notes } = req.body;

    const counselor = await User.findById(counselorId);

    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    if (counselor.counselorInfo.verificationStatus !== 'pending') {
      return res.status(400).json({ error: 'No pending verification for this counselor' });
    }

    counselor.counselorInfo.verificationStatus = 'approved';
    counselor.counselorInfo.isVerified = true;

    await counselor.save();

    res.json({
      message: 'Counselor verification approved',
      counselor: {
        id: counselor._id,
        username: counselor.username,
        verificationStatus: counselor.counselorInfo.verificationStatus,
        isVerified: counselor.counselorInfo.isVerified
      }
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
};

const rejectVerification = async (req, res) => {
  try {
    const { counselorId } = req.params;
    const { reason, notes } = req.body;

    const counselor = await User.findById(counselorId);

    if (!counselor || counselor.role !== 'counselor') {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    if (counselor.counselorInfo.verificationStatus !== 'pending') {
      return res.status(400).json({ error: 'No pending verification for this counselor' });
    }

    counselor.counselorInfo.verificationStatus = 'rejected';
    counselor.counselorInfo.isVerified = false;

    await counselor.save();

    res.json({
      message: 'Counselor verification rejected',
      reason,
      counselor: {
        id: counselor._id,
        username: counselor.username,
        verificationStatus: counselor.counselorInfo.verificationStatus,
        isVerified: counselor.counselorInfo.isVerified
      }
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
};

const getPendingVerifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const counselors = await User.find({
      role: 'counselor',
      'counselorInfo.verificationStatus': 'pending'
    })
    .select('username email profile counselorInfo createdAt updatedAt')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await User.countDocuments({
      role: 'counselor',
      'counselorInfo.verificationStatus': 'pending'
    });

    res.json({
      counselors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
};

const getCounselors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      verified, 
      available, 
      specialization,
      sortBy = 'rating'
    } = req.query;

    const skip = (page - 1) * limit;
    
    const filter = {
      role: 'counselor',
      isActive: true,
      isBanned: false
    };

    if (verified === 'true') {
      filter['counselorInfo.isVerified'] = true;
    }

    if (available === 'true') {
      filter['counselorInfo.availabilityStatus'] = true;
    }

    if (specialization) {
      filter['counselorInfo.specializations'] = { $in: [specialization] };
    }

    let sortOptions = {};
    switch (sortBy) {
      case 'rating':
        sortOptions = { 'counselorInfo.rating': -1 };
        break;
      case 'sessions':
        sortOptions = { 'counselorInfo.totalSessions': -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { 'counselorInfo.rating': -1 };
    }

    const counselors = await User.find(filter)
      .select('username profile counselorInfo status statistics')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      counselors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get counselors error:', error);
    res.status(500).json({ error: 'Failed to get counselors' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { available } = req.body;

    if (req.user.role !== 'counselor') {
      return res.status(400).json({ error: 'Only counselors can update availability' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'counselorInfo.availabilityStatus': available },
      { new: true }
    ).select('counselorInfo.availabilityStatus');

    res.json({
      message: 'Availability updated successfully',
      availabilityStatus: user.counselorInfo.availabilityStatus
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

const updateSpecializations = async (req, res) => {
  try {
    const { specializations } = req.body;

    if (req.user.role !== 'counselor') {
      return res.status(400).json({ error: 'Only counselors can update specializations' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'counselorInfo.specializations': specializations },
      { new: true, runValidators: true }
    ).select('counselorInfo.specializations');

    res.json({
      message: 'Specializations updated successfully',
      specializations: user.counselorInfo.specializations
    });
  } catch (error) {
    console.error('Update specializations error:', error);
    res.status(500).json({ error: 'Failed to update specializations' });
  }
};

const getCounselorStats = async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(400).json({ error: 'Only counselors can access stats' });
    }

    const user = await User.findById(req.user._id)
      .select('counselorInfo statistics');

    res.json({
      stats: {
        totalSessions: user.counselorInfo.totalSessions,
        rating: user.counselorInfo.rating,
        isVerified: user.counselorInfo.isVerified,
        verificationStatus: user.counselorInfo.verificationStatus,
        availabilityStatus: user.counselorInfo.availabilityStatus,
        specializations: user.counselorInfo.specializations,
        totalMessages: user.statistics.totalMessages,
        helpfulVotes: user.statistics.helpfulVotes
      }
    });
  } catch (error) {
    console.error('Get counselor stats error:', error);
    res.status(500).json({ error: 'Failed to get counselor stats' });
  }
};

const verificationValidation = [
  body('specializations')
    .isArray({ min: 1 })
    .withMessage('At least one specialization required'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array')
];

module.exports = {
  applyForVerification,
  getVerificationStatus,
  approveVerification,
  rejectVerification,
  getPendingVerifications,
  getCounselors,
  updateAvailability,
  updateSpecializations,
  getCounselorStats,
  upload,
  verificationValidation
};