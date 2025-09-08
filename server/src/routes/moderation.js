const express = require('express');
const router = express.Router();

const {
  moderateMessage,
  getFlaggedContent,
  reportContent,
  blockUser,
  unblockUser,
  getBlockedUsers,
  panicButton,
  getCrisisResources,
  reportValidation
} = require('../controllers/moderationController');

const { authenticate, authorize } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.post('/messages/:messageId',
  authenticate,
  authorize('counselor', 'admin'),
  moderateMessage
);

router.get('/flagged',
  authenticate,
  authorize('counselor', 'admin'),
  getFlaggedContent
);

router.post('/report',
  authenticate,
  rateLimiters.general,
  reportValidation,
  reportContent
);

router.post('/block/:userId',
  authenticate,
  blockUser
);

router.delete('/block/:userId',
  authenticate,
  unblockUser
);

router.get('/blocked',
  authenticate,
  getBlockedUsers
);

router.post('/panic',
  authenticate,
  panicButton
);

router.get('/crisis-resources',
  getCrisisResources
);

module.exports = router;