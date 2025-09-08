import User from "../models/user.model.js";
import { emitToUser } from "../sockets/index.js";

// In-memory notification store (in production, use a database)
const notifications = new Map();

// Notification types
const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
  CONVERSATION_INVITE: 'conversation_invite',
  MENTION: 'mention',
  CALL_MISSED: 'call_missed',
  SYSTEM: 'system'
};

export const getNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;

    let userNotifications = notifications.get(userId) || [];
    
    // Filter by type if specified
    if (type) {
      userNotifications = userNotifications.filter(n => n.type === type);
    }

    // Filter by read status if specified
    if (unreadOnly === 'true') {
      userNotifications = userNotifications.filter(n => !n.isRead);
    }

    // Sort by timestamp (newest first)
    userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedNotifications = userNotifications.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      notifications: paginatedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(userNotifications.length / limit),
        totalNotifications: userNotifications.length,
        hasNextPage: skip + parseInt(limit) < userNotifications.length,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;
    const userNotifications = notifications.get(userId) || [];
    const unreadCount = userNotifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.params;

    const userNotifications = notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();

    // Update the notifications map
    notifications.set(userId, userNotifications);

    // Emit update to user
    emitToUser(userId, "notification-updated", {
      notificationId,
      isRead: true,
      readAt: notification.readAt
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message
    });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const userNotifications = notifications.get(userId) || [];
    const now = new Date();

    // Mark all as read
    userNotifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = now;
      }
    });

    notifications.set(userId, userNotifications);

    // Emit update to user
    emitToUser(userId, "all-notifications-read", { timestamp: now });

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message
    });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { userId } = req.user;
    const { notificationId } = req.params;

    let userNotifications = notifications.get(userId) || [];
    const initialLength = userNotifications.length;
    
    userNotifications = userNotifications.filter(n => n.id !== notificationId);

    if (userNotifications.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    notifications.set(userId, userNotifications);

    // Emit update to user
    emitToUser(userId, "notification-deleted", { notificationId });

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message
    });
  }
};

export const clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.user;
    
    notifications.set(userId, []);

    // Emit update to user
    emitToUser(userId, "all-notifications-cleared", { timestamp: new Date() });

    res.status(200).json({
      success: true,
      message: "All notifications cleared successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error clearing all notifications",
      error: error.message
    });
  }
};

export const getNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select("notificationSettings");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Default notification settings if not set
    const defaultSettings = {
      messages: true,
      friendRequests: true,
      conversationInvites: true,
      mentions: true,
      calls: true,
      system: true,
      email: false,
      push: true,
      sound: true,
      doNotDisturb: false,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00"
      }
    };

    const notificationSettings = user.notificationSettings || defaultSettings;

    res.status(200).json({
      success: true,
      settings: notificationSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching notification settings",
      error: error.message
    });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    const settings = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationSettings: settings },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings: user.notificationSettings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating notification settings",
      error: error.message
    });
  }
};

export const testNotification = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type = "system", title = "Test Notification", message = "This is a test notification" } = req.body;

    const notification = {
      id: generateNotificationId(),
      type,
      title,
      message,
      timestamp: new Date(),
      isRead: false,
      data: {
        test: true
      }
    };

    // Add to user's notifications
    const userNotifications = notifications.get(userId) || [];
    userNotifications.unshift(notification);
    notifications.set(userId, userNotifications);

    // Emit real-time notification
    emitToUser(userId, "notification", notification);

    res.status(200).json({
      success: true,
      message: "Test notification sent successfully",
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending test notification",
      error: error.message
    });
  }
};

// Helper functions for creating notifications
export const createNotification = (userId, type, title, message, data = {}) => {
  const notification = {
    id: generateNotificationId(),
    type,
    title,
    message,
    timestamp: new Date(),
    isRead: false,
    data
  };

  // Add to user's notifications
  const userNotifications = notifications.get(userId) || [];
  userNotifications.unshift(notification);
  
  // Keep only last 100 notifications per user
  if (userNotifications.length > 100) {
    userNotifications.splice(100);
  }
  
  notifications.set(userId, userNotifications);

  // Emit real-time notification
  emitToUser(userId, "notification", notification);

  return notification;
};

export const createMessageNotification = (userId, senderId, senderName, conversationName, messageContent) => {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.MESSAGE,
    `New message from ${senderName}`,
    conversationName ? `${conversationName}: ${messageContent}` : messageContent,
    {
      senderId,
      senderName,
      conversationName,
      messageContent
    }
  );
};

export const createFriendRequestNotification = (userId, requesterId, requesterName) => {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.FRIEND_REQUEST,
    "New friend request",
    `${requesterName} sent you a friend request`,
    {
      requesterId,
      requesterName
    }
  );
};

export const createConversationInviteNotification = (userId, inviterId, inviterName, conversationName) => {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.CONVERSATION_INVITE,
    "Conversation invite",
    `${inviterName} invited you to join ${conversationName}`,
    {
      inviterId,
      inviterName,
      conversationName
    }
  );
};

export const createMentionNotification = (userId, mentionerId, mentionerName, conversationName, messageContent) => {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.MENTION,
    `You were mentioned by ${mentionerName}`,
    conversationName ? `${conversationName}: ${messageContent}` : messageContent,
    {
      mentionerId,
      mentionerName,
      conversationName,
      messageContent
    }
  );
};

export const createMissedCallNotification = (userId, callerId, callerName, callType = "voice") => {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.CALL_MISSED,
    "Missed call",
    `Missed ${callType} call from ${callerName}`,
    {
      callerId,
      callerName,
      callType
    }
  );
};

export const createSystemNotification = (userId, title, message, data = {}) => {
  return createNotification(
    userId,
    NOTIFICATION_TYPES.SYSTEM,
    title,
    message,
    data
  );
};

// Helper function to generate unique notification IDs
const generateNotificationId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper function to check if user should receive notifications
export const shouldNotifyUser = async (userId, notificationType) => {
  try {
    const user = await User.findById(userId).select("notificationSettings");
    if (!user || !user.notificationSettings) return true;

    const settings = user.notificationSettings;

    // Check if notifications are globally disabled
    if (settings.doNotDisturb) return false;

    // Check quiet hours
    if (settings.quietHours && settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const start = settings.quietHours.start;
      const end = settings.quietHours.end;

      if (start <= end) {
        // Same day range (e.g., 22:00 to 23:59)
        if (currentTime >= start && currentTime <= end) return false;
      } else {
        // Overnight range (e.g., 22:00 to 08:00)
        if (currentTime >= start || currentTime <= end) return false;
      }
    }

    // Check specific notification type settings
    switch (notificationType) {
      case NOTIFICATION_TYPES.MESSAGE:
        return settings.messages !== false;
      case NOTIFICATION_TYPES.FRIEND_REQUEST:
        return settings.friendRequests !== false;
      case NOTIFICATION_TYPES.CONVERSATION_INVITE:
        return settings.conversationInvites !== false;
      case NOTIFICATION_TYPES.MENTION:
        return settings.mentions !== false;
      case NOTIFICATION_TYPES.CALL_MISSED:
        return settings.calls !== false;
      case NOTIFICATION_TYPES.SYSTEM:
        return settings.system !== false;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to allowing notifications
  }
};

export { NOTIFICATION_TYPES };