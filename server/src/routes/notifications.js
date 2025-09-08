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
router.get("/", authenticate, rateLimiters.general, getNotifications);

// Get unread notification count
router.get("/unread-count", authenticate, rateLimiters.general, getUnreadCount);

// Get notifications by category
router.get(
  "/category/:category",
  authenticate,
  rateLimiters.general,
  getNotificationsByCategory
);

// Get notification statistics (admin only)
router.get("/stats", authenticate, rateLimiters.general, getNotificationStats);

// Mark specific notification as read
router.patch(
  "/:notificationId/read",
  authenticate,
  rateLimiters.general,
  markAsRead
);

// Mark all notifications as read
router.patch("/read-all", authenticate, rateLimiters.general, markAllAsRead);

// Archive notification
router.patch(
  "/:notificationId/archive",
  authenticate,
  rateLimiters.general,
  archiveNotification
);

// Delete notification
router.delete(
  "/:notificationId",
  authenticate,
  rateLimiters.general,
  deleteNotification
);

// Update notification preferences
router.put(
  "/preferences",
  authenticate,
  rateLimiters.general,
  updateNotificationPreferences
);

// Create single notification (admin/counselor only)
router.post(
  "/",
  authenticate,
  rateLimiters.general,
  createNotificationValidation,
  createNotification
);

// Create bulk notifications (admin only)
router.post(
  "/bulk",
  authenticate,
  rateLimiters.general,
  bulkNotificationValidation,
  createBulkNotifications
);

module.exports = router;
