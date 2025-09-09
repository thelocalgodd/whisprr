const express = require("express");
const router = express.Router();

const {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  manageMember,
  getMyGroups,
  scheduleSession,
  createGroupValidation,
} = require("../controllers/groupController");

const { authenticate, authorize } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.post("/", createGroup);

router.get("/", getGroups);

router.get("/my-groups", getMyGroups);

router.get("/:groupId", getGroup);

router.post("/:groupId/join", joinGroup);

router.post("/:groupId/leave", leaveGroup);

router.put("/:groupId", updateGroup);

router.delete("/:groupId", deleteGroup);

router.post("/:groupId/members/:userId", manageMember);

router.post("/:groupId/schedule-session", scheduleSession);

module.exports = router;
