const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/counselorController');

const { authenticate, authorize } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.post('/apply-verification', 
  authenticate, 
  rateLimiters.upload,
  authorize('counselor', 'admin'),
  upload.array('documents', 5),
  verificationValidation,
  applyForVerification
);

router.get('/verification-status', 
  authenticate,
  authorize('counselor', 'admin'),
  getVerificationStatus
);

router.post('/:counselorId/approve',
  authenticate,
  authorize('admin'),
  approveVerification
);

router.post('/:counselorId/reject',
  authenticate,
  authorize('admin'),
  rejectVerification
);

router.get('/pending-verifications',
  authenticate,
  authorize('admin'),
  getPendingVerifications
);

router.get('/',
  rateLimiters.search,
  getCounselors
);

router.put('/availability',
  authenticate,
  authorize('counselor', 'admin'),
  updateAvailability
);

router.put('/specializations',
  authenticate,
  authorize('counselor', 'admin'),
  updateSpecializations
);

router.get('/stats',
  authenticate,
  authorize('counselor', 'admin'),
  getCounselorStats
);

module.exports = router;