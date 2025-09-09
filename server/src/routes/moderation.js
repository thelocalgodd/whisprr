const express = require("express");
const router = express.Router();

const {
  moderateMessage,
  getFlaggedContent,
  reportContent,
  blockUser,
  unblockUser,
  getBlockedUsers,
  panicButton,
  getCrisisResources,
  reportValidation,
} = require("../controllers/moderationController");

const { authenticate, authorize } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.post("/messages/:messageId", moderateMessage);

router.get("/flagged", getFlaggedContent);

router.post("/report", reportContent);

router.post("/block/:userId", blockUser);

router.delete("/block/:userId", unblockUser);

router.get("/blocked", getBlockedUsers);

router.post("/panic", panicButton);

router.get("/crisis-resources", getCrisisResources);

module.exports = router;
