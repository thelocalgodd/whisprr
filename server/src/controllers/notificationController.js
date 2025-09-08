const Notification = require('../models/Notification');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get all notifications for the authenticated user
const getNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      unreadOnly = false, 
      category, 
      type, 
      priority 
    } = req.query;

    const query = {
      recipient: req.user._id,
      isDeleted: false
    };

    if (unreadOnly === 'true') {
      query['status.read'] = false;
    }

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username role')
      .populate('data.messageId', 'content messageType createdAt')
      .populate('data.groupId', 'name description')
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: total,
          limit: parseInt(limit)
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user._id);
    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
      isDeleted: false
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Archive notification
const archiveNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
      isDeleted: false
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await notification.archive();

    res.json({
      success: true,
      message: 'Notification archived'
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive notification'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: req.user._id,
      isDeleted: false
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    notification.isDeleted = true;
    notification.deletedAt = new Date();
    notification.deletedBy = req.user._id;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Get notifications by category
const getNotificationsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.getByCategory(
      req.user._id, 
      category, 
      { skip, limit: parseInt(limit) }
    );

    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    console.error('Error fetching notifications by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications by category'
    });
  }
};

// Create notification (for system/admin use)
const createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      recipient,
      type,
      title,
      message,
      data = {},
      priority = 'normal',
      category = 'communication',
      delivery = { inApp: true }
    } = req.body;

    // Check if recipient exists
    const user = await User.findById(recipient);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Recipient user not found'
      });
    }

    const notification = await Notification.createNotification({
      recipient,
      sender: req.user._id,
      type,
      title,
      message,
      data,
      priority,
      category,
      delivery,
      metadata: {
        source: 'admin',
        createdBy: req.user._id
      }
    });

    res.status(201).json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification'
    });
  }
};

// Create bulk notifications (admin only)
const createBulkNotifications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Notifications array is required and must not be empty'
      });
    }

    // Add metadata to each notification
    const enrichedNotifications = notifications.map(notif => ({
      ...notif,
      metadata: {
        source: 'admin',
        createdBy: req.user._id,
        batchId: new Date().getTime().toString()
      }
    }));

    const result = await Notification.createBulkNotifications(enrichedNotifications);

    res.status(201).json({
      success: true,
      message: `Created ${result.length} notifications`,
      data: { count: result.length }
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk notifications'
    });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const { inApp = true, push = false, email = false } = req.body;

    // Update user's notification preferences
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'notificationPreferences.inApp': inApp,
          'notificationPreferences.push': push,
          'notificationPreferences.email': email
        }
      },
      { new: true }
    ).select('notificationPreferences');

    res.json({
      success: true,
      data: { preferences: user.notificationPreferences }
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
};

// Get notification statistics (admin only)
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          count: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$status.read', false] }, 1, 0]
            }
          },
          delivered: {
            $sum: {
              $cond: [{ $eq: ['$delivery.delivered', true] }, 1, 0]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          types: {
            $push: {
              type: '$_id.type',
              count: '$count',
              unread: '$unread',
              delivered: '$delivered'
            }
          },
          totalCount: { $sum: '$count' },
          totalUnread: { $sum: '$unread' },
          totalDelivered: { $sum: '$delivered' }
        }
      }
    ]);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting notification statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification statistics'
    });
  }
};

// Validation middleware
const createNotificationValidation = [
  body('recipient').notEmpty().withMessage('Recipient is required'),
  body('type').isIn([
    'message', 'group_invite', 'group_join', 'group_leave',
    'counselor_request', 'counselor_assignment', 'session_scheduled',
    'session_reminder', 'crisis_alert', 'moderation_warning',
    'account_update', 'system_announcement', 'call_request',
    'call_missed', 'resource_shared', 'report_update'
  ]).withMessage('Invalid notification type'),
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1-100 characters'),
  body('message').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be between 1-500 characters'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('category').optional().isIn(['communication', 'support', 'security', 'system', 'social'])
];

const bulkNotificationValidation = [
  body('notifications').isArray({ min: 1 }).withMessage('Notifications array is required'),
  body('notifications.*.recipient').notEmpty().withMessage('Each notification must have a recipient'),
  body('notifications.*.type').isIn([
    'message', 'group_invite', 'group_join', 'group_leave',
    'counselor_request', 'counselor_assignment', 'session_scheduled',
    'session_reminder', 'crisis_alert', 'moderation_warning',
    'account_update', 'system_announcement', 'call_request',
    'call_missed', 'resource_shared', 'report_update'
  ]).withMessage('Invalid notification type'),
  body('notifications.*.title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1-100 characters'),
  body('notifications.*.message').trim().isLength({ min: 1, max: 500 }).withMessage('Message must be between 1-500 characters')
];

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  getNotificationsByCategory,
  createNotification,
  createBulkNotifications,
  updateNotificationPreferences,
  getNotificationStats,
  createNotificationValidation,
  bulkNotificationValidation
};