import express from "express";
import {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  markAsRead,
  getUnreadCount,
  forwardMessage,
  reactToMessage,
  removeReaction,
  pinMessage,
  unpinMessage,
  getPinnedMessages
} from "../controllers/message.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Message CRUD operations
router.post("/send", authenticateToken, sendMessage);
router.get("/conversation/:conversationId", authenticateToken, getMessages);
router.put("/:messageId", authenticateToken, editMessage);
router.delete("/:messageId", authenticateToken, deleteMessage);

// Message status operations
router.put("/:messageId/read", authenticateToken, markAsRead);
router.get("/unread/count", authenticateToken, getUnreadCount);

// Message interactions
router.post("/:messageId/forward", authenticateToken, forwardMessage);
router.post("/:messageId/react", authenticateToken, reactToMessage);
router.delete("/:messageId/react", authenticateToken, removeReaction);

// Message pinning
router.post("/:messageId/pin", authenticateToken, pinMessage);
router.delete("/:messageId/pin", authenticateToken, unpinMessage);
router.get("/conversation/:conversationId/pinned", authenticateToken, getPinnedMessages);

export default router;