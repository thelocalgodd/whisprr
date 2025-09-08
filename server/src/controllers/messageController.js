const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const Session = require('../models/Session');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/messages');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `msg-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|wav|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipient, group, content, replyTo, messageType = 'text' } = req.body;
    const sender = req.user._id;

    if (!recipient && !group) {
      return res.status(400).json({ error: 'Recipient or group required' });
    }

    if (recipient && group) {
      return res.status(400).json({ error: 'Cannot send to both recipient and group' });
    }

    let conversationId;
    let targetUser = null;
    let targetGroup = null;

    if (recipient) {
      targetUser = await User.findById(recipient);
      if (!targetUser || !targetUser.isActive) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      if (targetUser.privacy.blockList.includes(sender)) {
        return res.status(403).json({ error: 'You are blocked by this user' });
      }

      if (req.user.privacy.blockList.includes(recipient)) {
        return res.status(403).json({ error: 'You have blocked this user' });
      }

      if (!targetUser.privacy.allowDirectMessages && 
          targetUser.role !== 'counselor' && req.user.role !== 'counselor') {
        return res.status(403).json({ error: 'User does not allow direct messages' });
      }

      conversationId = [sender.toString(), recipient.toString()].sort().join('-');
    } else {
      targetGroup = await Group.findById(group);
      if (!targetGroup || !targetGroup.isActive) {
        return res.status(404).json({ error: 'Group not found' });
      }

      if (!targetGroup.isMember(sender)) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }

      if (targetGroup.isUserBanned(sender)) {
        return res.status(403).json({ error: 'You are banned from this group' });
      }

      const memberInfo = targetGroup.members.find(m => m.user.toString() === sender.toString());
      if (memberInfo && memberInfo.isMuted && (!memberInfo.mutedUntil || memberInfo.mutedUntil > new Date())) {
        return res.status(403).json({ error: 'You are muted in this group' });
      }

      conversationId = group.toString();
    }

    const messageData = {
      sender,
      recipient: recipient || undefined,
      group: group || undefined,
      conversationId,
      messageType,
      content: {
        text: content.text || ''
      },
      metadata: {
        replyTo: replyTo || undefined
      }
    };

    if (req.file) {
      messageData.content.mediaUrl = req.file.path;
      messageData.content.fileName = req.file.originalname;
      messageData.content.fileSize = req.file.size;
      messageData.content.mimeType = req.file.mimetype;
      messageData.messageType = getMessageType(req.file.mimetype);
    }

    const message = new Message(messageData);

    const crisisKeywords = (process.env.CRISIS_KEYWORDS || 'suicide,kill myself,end it all,harm myself,self-harm').split(',');
    const detectedKeywords = message.checkForCrisisKeywords(crisisKeywords);

    await message.save();

    if (targetGroup) {
      targetGroup.statistics.totalMessages += 1;
      targetGroup.statistics.lastActivity = new Date();
      await targetGroup.save();
    }

    await User.updateOne(
      { _id: sender },
      { $inc: { 'statistics.totalMessages': 1 } }
    );

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profile role')
      .populate('recipient', 'username profile role')
      .populate('group', 'name type')
      .populate('metadata.replyTo', 'sender content.text createdAt');

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage,
      crisisDetected: detectedKeywords.length > 0,
      detectedKeywords
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      conversationId,
      isDeleted: false
    };

    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    if (after) {
      filter.createdAt = { ...filter.createdAt, $gt: new Date(after) };
    }

    const isGroupConversation = !conversationId.includes('-');
    
    if (!isGroupConversation) {
      const [user1, user2] = conversationId.split('-');
      if (user1 !== req.user._id.toString() && user2 !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied to this conversation' });
      }
    } else {
      const group = await Group.findById(conversationId);
      if (!group || !group.isMember(req.user._id)) {
        return res.status(403).json({ error: 'Access denied to this group' });
      }
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username profile role counselorInfo.isVerified')
      .populate('metadata.replyTo', 'sender content.text createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(filter);

    await Message.updateMany(
      {
        conversationId,
        recipient: req.user._id,
        'status.read': false
      },
      {
        'status.read': true,
        'status.readAt': new Date()
      }
    );

    res.json({
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    if (message.createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return res.status(403).json({ error: 'Messages can only be edited within 24 hours' });
    }

    if (message.metadata.edited && message.metadata.editHistory.length >= 5) {
      return res.status(403).json({ error: 'Maximum edit limit reached' });
    }

    if (!message.metadata.editHistory) {
      message.metadata.editHistory = [];
    }

    message.metadata.editHistory.push({
      content: message.decrypt(),
      editedAt: new Date()
    });

    message.content.text = text;
    message.content.encryptedText = undefined;
    message.metadata.edited = true;
    message.metadata.editedAt = new Date();

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profile role');

    res.json({
      message: 'Message edited successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    if (deleteForEveryone) {
      if (message.createdAt < new Date(Date.now() - 60 * 60 * 1000)) {
        return res.status(403).json({ error: 'Messages can only be deleted for everyone within 1 hour' });
      }
      
      message.isDeleted = true;
      message.deletedBy = req.user._id;
      message.deletedAt = new Date();
      message.content.text = 'This message was deleted';
      message.content.encryptedText = undefined;
    } else {
      await Message.deleteOne({ _id: messageId });
      return res.json({ message: 'Message deleted successfully' });
    }

    await message.save();

    res.json({ message: 'Message deleted for everyone' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      if (existingReaction.emoji === emoji) {
        message.reactions = message.reactions.filter(
          r => r.user.toString() !== req.user._id.toString()
        );
      } else {
        existingReaction.emoji = emoji;
        existingReaction.timestamp = new Date();
      }
    } else {
      message.reactions.push({
        user: req.user._id,
        emoji,
        timestamp: new Date()
      });
    }

    await message.save();

    res.json({
      message: 'Reaction updated successfully',
      reactions: message.reactions
    });
  } catch (error) {
    console.error('React to message error:', error);
    res.status(500).json({ error: 'Failed to react to message' });
  }
};

const reportMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason, description } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot report your own message' });
    }

    const existingReport = message.reports.find(
      r => r.reportedBy.toString() === req.user._id.toString()
    );

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this message' });
    }

    message.reports.push({
      reportedBy: req.user._id,
      reason,
      description,
      timestamp: new Date()
    });

    await message.save();

    res.json({ message: 'Message reported successfully' });
  } catch (error) {
    console.error('Report message error:', error);
    res.status(500).json({ error: 'Failed to report message' });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { query, conversationId, messageType, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: false
    };

    if (query) {
      filter.$text = { $search: query };
    }

    if (conversationId) {
      filter.conversationId = conversationId;
      
      const isGroupConversation = !conversationId.includes('-');
      if (!isGroupConversation) {
        const [user1, user2] = conversationId.split('-');
        if (user1 !== req.user._id.toString() && user2 !== req.user._id.toString()) {
          return res.status(403).json({ error: 'Access denied to this conversation' });
        }
      } else {
        const group = await Group.findById(conversationId);
        if (!group || !group.isMember(req.user._id)) {
          return res.status(403).json({ error: 'Access denied to this group' });
        }
      }
    } else {
      filter.$or = [
        { sender: req.user._id },
        { recipient: req.user._id },
        { group: { $in: await getUserGroupIds(req.user._id) } }
      ];
    }

    if (messageType) {
      filter.messageType = messageType;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username profile role')
      .populate('recipient', 'username profile role')
      .populate('group', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(filter);

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
};

const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    let conversations = [];

    if (!type || type === 'private') {
      const privateMessages = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { recipient: userId }],
            group: { $exists: false },
            isDeleted: false
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$conversationId',
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipient', userId] },
                      { $eq: ['$status.read', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastMessage.recipient',
            foreignField: '_id',
            as: 'recipient'
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: parseInt(limit)
        }
      ]);

      conversations.push(...privateMessages.map(conv => ({
        ...conv,
        type: 'private'
      })));
    }

    if (!type || type === 'group') {
      const userGroups = await Group.find({
        'members.user': userId,
        isActive: true
      })
        .populate('members.user', 'username profile')
        .sort({ 'statistics.lastActivity': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const groupConversations = await Promise.all(
        userGroups.map(async (group) => {
          const lastMessage = await Message.findOne({
            group: group._id,
            isDeleted: false
          })
            .populate('sender', 'username profile role')
            .sort({ createdAt: -1 });

          const unreadCount = await Message.countDocuments({
            group: group._id,
            recipient: userId,
            'status.read': false,
            isDeleted: false
          });

          return {
            _id: group._id.toString(),
            type: 'group',
            group,
            lastMessage,
            unreadCount
          };
        })
      );

      conversations.push(...groupConversations);
    }

    conversations = conversations
      .sort((a, b) => {
        const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
        const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
        return bTime - aTime;
      })
      .slice(0, parseInt(limit));

    res.json({
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: conversations.length
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

const getMessageType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
};

const getUserGroupIds = async (userId) => {
  const groups = await Group.find({ 'members.user': userId }, '_id');
  return groups.map(g => g._id);
};

const messageValidation = [
  body('content.text')
    .optional()
    .isLength({ max: 4000 })
    .withMessage('Message too long (max 4000 characters)'),
  body('recipient')
    .optional()
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('group')
    .optional()
    .isMongoId()
    .withMessage('Invalid group ID')
];

module.exports = {
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
};