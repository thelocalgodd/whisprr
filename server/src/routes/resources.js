const express = require('express');
const router = express.Router();

const {
  createResource,
  getResources,
  getResource,
  updateResource,
  deleteResource,
  rateResource,
  bookmarkResource,
  getMyBookmarks,
  approveResource,
  rejectResource,
  getPendingResources,
  upload,
  createResourceValidation,
  ratingValidation
} = require('../controllers/resourceController');

const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.post('/',
  authenticate,
  authorize('counselor', 'admin'),
  rateLimiters.upload,
  upload.single('file'),
  createResourceValidation,
  createResource
);

router.get('/',
  optionalAuth,
  rateLimiters.search,
  getResources
);

router.get('/my-bookmarks',
  authenticate,
  getMyBookmarks
);

router.get('/pending',
  authenticate,
  authorize('admin'),
  getPendingResources
);

router.get('/:resourceId',
  optionalAuth,
  getResource
);

router.put('/:resourceId',
  authenticate,
  updateResource
);

router.delete('/:resourceId',
  authenticate,
  deleteResource
);

router.post('/:resourceId/rate',
  authenticate,
  ratingValidation,
  rateResource
);

router.post('/:resourceId/bookmark',
  authenticate,
  bookmarkResource
);

router.post('/:resourceId/approve',
  authenticate,
  authorize('admin'),
  approveResource
);

router.post('/:resourceId/reject',
  authenticate,
  authorize('admin'),
  rejectResource
);

module.exports = router;