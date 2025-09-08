const express = require('express');
const router = express.Router();

const {
  initiateCall,
  joinCall,
  leaveCall,
  endCall,
  updateCallSettings,
  getCallHistory,
  getActiveCall,
  submitCallFeedback,
  getCounselorStats,
  callValidation,
  feedbackValidation
} = require('../controllers/callController');

const { authenticate, authorize } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.post('/initiate',
  authenticate,
  rateLimiters.call,
  callValidation,
  initiateCall
);

router.post('/:callId/join',
  authenticate,
  joinCall
);

router.post('/:callId/leave',
  authenticate,
  leaveCall
);

router.post('/:callId/end',
  authenticate,
  endCall
);

router.put('/:callId/settings',
  authenticate,
  updateCallSettings
);

router.get('/history',
  authenticate,
  getCallHistory
);

router.get('/active',
  authenticate,
  getActiveCall
);

router.post('/:callId/feedback',
  authenticate,
  feedbackValidation,
  submitCallFeedback
);

router.get('/counselor-stats',
  authenticate,
  authorize('counselor', 'admin'),
  getCounselorStats
);

module.exports = router;