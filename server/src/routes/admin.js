const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  getReports,
  reviewReport,
  getSystemHealth,
  getCrisisAlerts,
  updateCrisisAlert,
  banValidation
} = require('../controllers/adminController');

const { authenticate, authorize } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.get('/dashboard',
  authenticate,
  authorize('admin'),
  getDashboardStats
);

router.get('/users',
  authenticate,
  authorize('admin'),
  rateLimiters.admin,
  getUsers
);

router.get('/users/:userId',
  authenticate,
  authorize('admin'),
  getUserDetails
);

router.post('/users/:userId/ban',
  authenticate,
  authorize('admin'),
  banValidation,
  banUser
);

router.post('/users/:userId/unban',
  authenticate,
  authorize('admin'),
  unbanUser
);

router.get('/reports',
  authenticate,
  authorize('admin'),
  getReports
);

router.post('/reports/:reportId/review',
  authenticate,
  authorize('admin'),
  reviewReport
);

router.get('/system-health',
  authenticate,
  authorize('admin'),
  getSystemHealth
);

router.get('/crisis-alerts',
  authenticate,
  authorize('admin'),
  getCrisisAlerts
);

router.put('/crisis-alerts/:messageId',
  authenticate,
  authorize('admin'),
  updateCrisisAlert
);

module.exports = router;