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
  getGroupMessages,
  sendGroupMessage,
  createGroupValidation,
} = require("../controllers/groupController");

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

router.get("/:groupId/messages", getGroupMessages);

router.post("/:groupId/messages", sendGroupMessage);

module.exports = router;
