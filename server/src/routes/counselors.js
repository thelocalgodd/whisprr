const express = require("express");
const router = express.Router();

const {
  applyForVerification,
  getVerificationStatus,
  approveVerification,
  rejectVerification,
  getPendingVerifications,
  getCounselors,
  updateAvailability,
  updateSpecializations,
  getCounselorStats,
  upload,
  verificationValidation,
} = require("../controllers/counselorController");

const { authenticate, authorize } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.post(
  "/apply-verification",
  upload.array("documents", 5),
  applyForVerification
);

router.get("/verification-status", getVerificationStatus);

router.post("/:counselorId/approve", approveVerification);

router.post("/:counselorId/reject", rejectVerification);

router.get("/pending-verifications", getPendingVerifications);

router.get("/", rateLimiters.search, getCounselors);

router.put("/availability", updateAvailability);

router.put("/specializations", updateSpecializations);

router.get("/stats", getCounselorStats);

module.exports = router;
