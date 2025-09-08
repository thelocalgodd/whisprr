const express = require('express');
const router = express.Router();

const {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  manageMember,
  getMyGroups,
  scheduleSession,
  createGroupValidation
} = require('../controllers/groupController');

const { authenticate, authorize } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.post('/',
  authenticate,
  rateLimiters.general,
  createGroupValidation,
  createGroup
);

router.get('/',
  rateLimiters.search,
  getGroups
);

router.get('/my-groups',
  authenticate,
  getMyGroups
);

router.get('/:groupId',
  authenticate,
  getGroup
);

router.post('/:groupId/join',
  authenticate,
  joinGroup
);

router.post('/:groupId/leave',
  authenticate,
  leaveGroup
);

router.put('/:groupId',
  authenticate,
  updateGroup
);

router.delete('/:groupId',
  authenticate,
  deleteGroup
);

router.post('/:groupId/members/:userId',
  authenticate,
  manageMember
);

router.post('/:groupId/schedule-session',
  authenticate,
  scheduleSession
);

module.exports = router;