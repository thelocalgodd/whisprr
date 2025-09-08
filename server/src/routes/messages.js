const express = require('express');
const router = express.Router();

const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  reportMessage,
  searchMessages,
  getConversations,
  upload,
  messageValidation
} = require('../controllers/messageController');

const { authenticate } = require('../middleware/auth');
const { rateLimiters } = require('../middleware/security');

router.post('/',
  authenticate,
  rateLimiters.message,
  upload.single('attachment'),
  messageValidation,
  sendMessage
);

router.get('/conversations',
  authenticate,
  getConversations
);

router.get('/search',
  authenticate,
  rateLimiters.search,
  searchMessages
);

router.get('/:conversationId',
  authenticate,
  getMessages
);

router.put('/:messageId',
  authenticate,
  editMessage
);

router.delete('/:messageId',
  authenticate,
  deleteMessage
);

router.post('/:messageId/react',
  authenticate,
  reactToMessage
);

router.post('/:messageId/report',
  authenticate,
  reportMessage
);

module.exports = router;