import express from "express";
import {
  getDashboardAnalytics,
  getUsers,
  getUserById,
  updateUserStatus,
  getReports,
  getReportById,
  updateReportStatus,
  getContentFlags,
  getContentFlagById,
  updateContentFlag,
} from "../controllers/admin.controller.js";
import {
  getPendingApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  requestMoreInfo,
  updateApplicationStatus,
  getApplicationStats,
} from "../controllers/counselor.controller.js";
// import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication and admin check to all routes
// router.use(authenticateToken);
// router.use(requireAdmin);

// Dashboard Analytics
router.get("/dashboard/analytics", getDashboardAnalytics);

// User Management
router.get("/users", getUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId", updateUserStatus);

// Reports Management
router.get("/reports", getReports);
router.get("/reports/:reportId", getReportById);
router.put("/reports/:reportId", updateReportStatus);

// Content Flags Management
router.get("/content-flags", getContentFlags);
router.get("/content-flags/:flagId", getContentFlagById);
router.put("/content-flags/:flagId", updateContentFlag);

// Counselor Applications Management
router.get("/counselors/pending", getPendingApplications);
router.get("/counselors/stats", getApplicationStats);
router.get("/counselors/:applicationId", getApplicationById);
router.put("/counselors/:applicationId/approve", approveApplication);
router.put("/counselors/:applicationId/reject", rejectApplication);
router.put("/counselors/:applicationId/request-info", requestMoreInfo);
router.put("/counselors/:applicationId/status", updateApplicationStatus);

export default router;
