const express = require("express");
const router = express.Router();

const {
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
  bulkNotificationValidation,
} = require("../controllers/notificationController");

const { authenticate, requireRole } = require("../middleware/auth");

const { rateLimiters } = require("../middleware/security");

// Get all notifications for authenticated user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Get notifications by category
router.get("/category/:category", getNotificationsByCategory);

// Get notification statistics (admin only)
router.get("/stats", getNotificationStats);

// Mark specific notification as read
router.patch("/:notificationId/read", markAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// Archive notification
router.patch("/:notificationId/archive", archiveNotification);

// Delete notification
router.delete("/:notificationId", deleteNotification);

// Update notification preferences
router.put("/preferences", updateNotificationPreferences);

// Create single notification (admin/counselor only)
router.post("/", createNotification);

// Create bulk notifications (admin only)
router.post("/bulk", createBulkNotifications);

module.exports = router;
