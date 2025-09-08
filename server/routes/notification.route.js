import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  testNotification,
  getUnreadCount
} from "../controllers/notification.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Notification CRUD operations
router.get("/", authenticateToken, getNotifications);
router.get("/unread-count", authenticateToken, getUnreadCount);
router.put("/:notificationId/read", authenticateToken, markNotificationAsRead);
router.put("/read-all", authenticateToken, markAllNotificationsAsRead);
router.delete("/:notificationId", authenticateToken, deleteNotification);
router.delete("/clear-all", authenticateToken, clearAllNotifications);

// Notification settings
router.get("/settings", authenticateToken, getNotificationSettings);
router.put("/settings", authenticateToken, updateNotificationSettings);

// Test notification
router.post("/test", authenticateToken, testNotification);

export default router;