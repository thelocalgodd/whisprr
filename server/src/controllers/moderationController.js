const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const { body, validationResult } = require('express-validator');

const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'want to die', 'harm myself', 
  'self-harm', 'cut myself', 'overdose', 'jump off', 'hang myself',
  'not worth living', 'better off dead', 'suicide plan', 'killing myself',
  'end my life', 'hurt myself', 'self injury', 'suicidal thoughts'
];

const inappropriateContent = [
  'sexual harassment', 'hate speech', 'discriminatory', 'threatening',
  'bullying', 'doxxing', 'spam', 'scam', 'illegal activities'
];

const detectCrisisContent = (text) => {
  const lowerText = text.toLowerCase();
  const detectedKeywords = [];
  let severity = 'low';
  
  crisisKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      detectedKeywords.push(keyword);
    }
  });
  
  if (detectedKeywords.length >= 3) {
    severity = 'critical';
  } else if (detectedKeywords.length >= 2) {
    severity = 'high';
  } else if (detectedKeywords.length >= 1) {
    severity = 'medium';
  }
  
  return {
    detected: detectedKeywords.length > 0,
    keywords: detectedKeywords,
    severity
  };
};

const detectInappropriateContent = (text) => {
  const lowerText = text.toLowerCase();
  const detectedIssues = [];
  
  inappropriateContent.forEach(issue => {
    if (lowerText.includes(issue)) {
      detectedIssues.push(issue);
    }
  });
  
  const profanityRegex = /\b(fuck|shit|damn|bitch|asshole|cunt|whore|slut)\b/gi;
  const profanityMatches = text.match(profanityRegex) || [];
  
  return {
    detected: detectedIssues.length > 0 || profanityMatches.length > 0,
    issues: detectedIssues,
    profanity: profanityMatches
  };
};

const moderateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { action, reason, notifyUser = true } = req.body;

    const message = await Message.findById(messageId)
      .populate('sender', 'username email profile');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const validActions = ['approve', 'delete', 'hide', 'warn', 'escalate'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid moderation action' });
    }

    message.moderation.action = action;
    message.moderation.moderatedBy = req.user._id;
    message.moderation.moderatedAt = new Date();
    
    if (reason) {
      message.moderation.flagReason = reason;
    }

    switch (action) {
      case 'delete':
        message.isDeleted = true;
        message.deletedBy = req.user._id;
        message.deletedAt = new Date();
        break;
        
      case 'hide':
        message.moderation.flagged = true;
        break;
        
      case 'warn':
        if (notifyUser) {
          await sendModerationWarning(message.sender._id, reason, 'message');
        }
        break;
        
      case 'escalate':
        await escalateToAdmin(message, reason);
        break;
    }

    await message.save();

    if (action === 'warn' || action === 'delete') {
      await User.findByIdAndUpdate(message.sender._id, {
        $push: {
          'moderation.warnings': {
            type: 'message',
            reason: reason,
            messageId: messageId,
            timestamp: new Date(),
            moderatedBy: req.user._id
          }
        }
      });
    }

    res.json({
      message: 'Message moderated successfully',
      action,
      moderatedMessage: {
        id: message._id,
        action: message.moderation.action,
        moderatedBy: message.moderation.moderatedBy,
        moderatedAt: message.moderation.moderatedAt
      }
    });
  } catch (error) {
    console.error('Moderate message error:', error);
    res.status(500).json({ error: 'Failed to moderate message' });
  }
};

const getFlaggedContent = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type = 'all', 
      severity,
      status = 'pending'
    } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (type === 'crisis') {
      filter['crisis.detected'] = true;
      if (severity && severity !== 'all') {
        filter['crisis.severity'] = severity;
      }
    } else if (type === 'flagged') {
      filter['moderation.flagged'] = true;
      if (status === 'pending') {
        filter['moderation.action'] = 'none';
      }
    } else if (type === 'reported') {
      filter['reports.0'] = { $exists: true };
      if (status === 'pending') {
        filter['reports.status'] = 'pending';
      }
    }

    const messages = await Message.find(filter)
      .populate('sender', 'username profile role counselorInfo.isVerified')
      .populate('recipient', 'username profile role')
      .populate('group', 'name type')
      .populate('moderation.moderatedBy', 'username profile')
      .populate('reports.reportedBy', 'username profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(filter);

    const processedMessages = messages.map(msg => ({
      ...msg.toObject(),
      decryptedContent: msg.decrypt()
    }));

    res.json({
      messages: processedMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get flagged content error:', error);
    res.status(500).json({ error: 'Failed to get flagged content' });
  }
};

const autoModerateContent = async (messageText, messageId) => {
  try {
    const crisisAnalysis = detectCrisisContent(messageText);
    const inappropriateAnalysis = detectInappropriateContent(messageText);

    const updates = {};

    if (crisisAnalysis.detected) {
      updates['crisis.detected'] = true;
      updates['crisis.keywords'] = crisisAnalysis.keywords;
      updates['crisis.severity'] = crisisAnalysis.severity;
      
      if (crisisAnalysis.severity === 'critical') {
        await triggerEmergencyResponse(messageId);
      }
    }

    if (inappropriateAnalysis.detected) {
      updates['moderation.flagged'] = true;
      updates['moderation.flagReason'] = 'Automated detection: ' + 
        [...inappropriateAnalysis.issues, ...inappropriateAnalysis.profanity].join(', ');
      
      if (inappropriateAnalysis.profanity.length > 3) {
        updates['moderation.action'] = 'hidden';
      }
    }

    if (Object.keys(updates).length > 0) {
      await Message.findByIdAndUpdate(messageId, updates);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Auto moderate content error:', error);
    return false;
  }
};

const triggerEmergencyResponse = async (messageId) => {
  try {
    const message = await Message.findById(messageId)
      .populate('sender', 'username email profile')
      .populate('recipient', 'username email profile')
      .populate('group', 'name type');

    const emergencyAlert = {
      id: require('crypto').randomBytes(16).toString('hex'),
      type: 'crisis_detected',
      severity: 'critical',
      messageId: messageId,
      userId: message.sender._id,
      username: message.sender.username,
      content: message.decrypt(),
      timestamp: new Date(),
      automated: true
    };

    console.log('EMERGENCY ALERT:', emergencyAlert);

    await Message.findByIdAndUpdate(messageId, {
      'crisis.actionTaken': 'Emergency response triggered',
      'crisis.reviewedBy': null,
      'crisis.interventionRequired': true
    });

    return emergencyAlert;
  } catch (error) {
    console.error('Trigger emergency response error:', error);
  }
};

const sendModerationWarning = async (userId, reason, type) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const warningMessage = {
      type: 'moderation_warning',
      reason: reason,
      contentType: type,
      timestamp: new Date(),
      message: `Your ${type} has been flagged for: ${reason}. Please review our community guidelines.`
    };

    console.log(`Moderation warning sent to ${user.username}:`, warningMessage);
    
    return warningMessage;
  } catch (error) {
    console.error('Send moderation warning error:', error);
  }
};

const escalateToAdmin = async (message, reason) => {
  try {
    const escalation = {
      messageId: message._id,
      senderId: message.sender,
      reason: reason,
      severity: message.crisis.severity || 'medium',
      timestamp: new Date(),
      content: message.decrypt()
    };

    console.log('Escalated to admin:', escalation);
    
    return escalation;
  } catch (error) {
    console.error('Escalate to admin error:', error);
  }
};

const reportContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { contentId, contentType, reason, description } = req.body;
    const reporterId = req.user._id;

    if (contentType === 'message') {
      const message = await Message.findById(contentId);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message.sender.toString() === reporterId.toString()) {
        return res.status(400).json({ error: 'Cannot report your own content' });
      }

      const existingReport = message.reports.find(
        r => r.reportedBy.toString() === reporterId.toString()
      );

      if (existingReport) {
        return res.status(400).json({ error: 'You have already reported this message' });
      }

      message.reports.push({
        reportedBy: reporterId,
        reason,
        description,
        timestamp: new Date(),
        status: 'pending'
      });

      await message.save();

    } else if (contentType === 'user') {
      const user = await User.findById(contentId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user._id.toString() === reporterId.toString()) {
        return res.status(400).json({ error: 'Cannot report yourself' });
      }

      const existingReport = user.reports.find(
        r => r.reportedBy.toString() === reporterId.toString()
      );

      if (existingReport) {
        return res.status(400).json({ error: 'You have already reported this user' });
      }

      user.reports.push({
        reportedBy: reporterId,
        reason,
        description,
        createdAt: new Date(),
        status: 'pending'
      });

      await user.save();
    }

    res.json({
      message: 'Content reported successfully',
      reportId: contentId
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({ error: 'Failed to report content' });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(currentUserId);

    if (currentUser.privacy.blockList.includes(userId)) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    currentUser.privacy.blockList.push(userId);
    await currentUser.save();

    res.json({
      message: 'User blocked successfully',
      blockedUser: {
        id: targetUser._id,
        username: targetUser.username
      }
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);

    const blockIndex = currentUser.privacy.blockList.indexOf(userId);
    if (blockIndex === -1) {
      return res.status(400).json({ error: 'User is not blocked' });
    }

    currentUser.privacy.blockList.splice(blockIndex, 1);
    await currentUser.save();

    res.json({
      message: 'User unblocked successfully',
      unblockedUserId: userId
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('privacy.blockList', 'username profile.displayName profile.avatar');

    res.json({
      blockedUsers: user.privacy.blockList
    });
  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Failed to get blocked users' });
  }
};

const panicButton = async (req, res) => {
  try {
    const { location, severity = 'critical' } = req.body;
    const userId = req.user._id;

    const emergencyAlert = {
      id: require('crypto').randomBytes(16).toString('hex'),
      type: 'panic_button',
      severity: severity,
      userId: userId,
      location: location,
      timestamp: new Date(),
      status: 'active'
    };

    const user = await User.findById(userId);
    
    console.log('PANIC BUTTON ACTIVATED:', {
      alertId: emergencyAlert.id,
      user: user.username,
      location: location,
      timestamp: emergencyAlert.timestamp
    });

    const crisisResources = {
      hotlines: [
        {
          name: 'National Suicide Prevention Lifeline',
          number: '988',
          available: '24/7'
        },
        {
          name: 'Crisis Text Line',
          number: 'Text HOME to 741741',
          available: '24/7'
        },
        {
          name: 'International Association for Suicide Prevention',
          website: 'https://www.iasp.info/resources/Crisis_Centres/',
          available: 'Various'
        }
      ],
      emergencyServices: '911',
      onlineCounseling: [
        {
          name: 'Whisprr Crisis Support',
          available: 'Connect with verified counselors'
        }
      ]
    };

    res.json({
      message: 'Emergency alert sent successfully',
      alertId: emergencyAlert.id,
      resources: crisisResources,
      timestamp: emergencyAlert.timestamp
    });
  } catch (error) {
    console.error('Panic button error:', error);
    res.status(500).json({ error: 'Failed to process emergency alert' });
  }
};

const getCrisisResources = async (req, res) => {
  try {
    const resources = {
      immediate: {
        emergency: '911',
        suicidePrevention: '988',
        crisisText: 'Text HOME to 741741'
      },
      hotlines: [
        {
          name: 'National Suicide Prevention Lifeline',
          number: '988',
          description: '24/7 crisis support',
          languages: ['English', 'Spanish']
        },
        {
          name: 'Crisis Text Line',
          contact: 'Text HOME to 741741',
          description: '24/7 text-based crisis support'
        },
        {
          name: 'SAMHSA National Helpline',
          number: '1-800-662-4357',
          description: '24/7 treatment referral service'
        }
      ],
      online: [
        {
          name: 'Whisprr Crisis Support',
          description: 'Connect with verified counselors in our platform',
          available: true
        }
      ],
      selfCare: [
        {
          title: 'Breathing Exercises',
          description: '4-7-8 breathing technique for immediate calm'
        },
        {
          title: 'Grounding Techniques',
          description: '5-4-3-2-1 sensory grounding method'
        }
      ]
    };

    res.json({ resources });
  } catch (error) {
    console.error('Get crisis resources error:', error);
    res.status(500).json({ error: 'Failed to get crisis resources' });
  }
};

const reportValidation = [
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  body('contentType')
    .isIn(['message', 'user', 'group'])
    .withMessage('Invalid content type'),
  body('reason')
    .isIn([
      'harassment', 'hate_speech', 'inappropriate_content', 
      'spam', 'self_harm', 'threatening_behavior', 'other'
    ])
    .withMessage('Invalid report reason'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be 10-500 characters')
];

module.exports = {
  moderateMessage,
  getFlaggedContent,
  autoModerateContent,
  reportContent,
  blockUser,
  unblockUser,
  getBlockedUsers,
  panicButton,
  getCrisisResources,
  detectCrisisContent,
  detectInappropriateContent,
  reportValidation
};