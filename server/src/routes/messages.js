const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reactToMessage,
  reportMessage,
  searchMessages,
  getConversations,
  upload,
  messageValidation,
} = require("../controllers/messageController");

const { authenticate } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.post("/", upload.single("attachment"), sendMessage);

router.get("/conversations", getConversations);

router.get("/search", searchMessages);

router.get("/:conversationId", getMessages);

router.put("/:messageId", editMessage);

router.delete("/:messageId", deleteMessage);

router.post("/:messageId/react", reactToMessage);

router.post("/:messageId/report", reportMessage);

module.exports = router;
