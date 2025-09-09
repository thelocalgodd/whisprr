const express = require("express");
const router = express.Router();

const {
  initiateCall,
  joinCall,
  leaveCall,
  endCall,
  updateCallSettings,
  getCallHistory,
  getActiveCall,
  submitCallFeedback,
  getCounselorStats,
  callValidation,
  feedbackValidation,
} = require("../controllers/callController");

const { authenticate, authorize } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.post(
  "/initiate",
  authenticate,
  rateLimiters.call,
  callValidation,
  initiateCall
);

router.post("/:callId/join", joinCall);

router.post("/:callId/leave", leaveCall);

router.post("/:callId/end", endCall);

router.put("/:callId/settings", updateCallSettings);

router.get("/history", getCallHistory);

router.get("/active", getActiveCall);

router.post("/:callId/feedback", submitCallFeedback);

router.get("/counselor-stats", getCounselorStats);

module.exports = router;
