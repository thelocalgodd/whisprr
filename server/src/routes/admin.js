const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  getReports,
  reviewReport,
  getSystemHealth,
  getCrisisAlerts,
  updateCrisisAlert,
  banValidation,
} = require("../controllers/adminController");

const { authenticate, authorize } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.get("/dashboard", getDashboardStats);

router.get("/users", getUsers);

router.get("/users/:userId", getUserDetails);

router.post("/users/:userId/ban", banUser);

router.post("/users/:userId/unban", unbanUser);

router.get("/reports", getReports);

router.post("/reports/:reportId/review", reviewReport);

router.get("/system-health", getSystemHealth);

router.get("/crisis-alerts", getCrisisAlerts);

router.put("/crisis-alerts/:messageId", updateCrisisAlert);

module.exports = router;
