import express from "express";
import {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  addParticipant,
  removeParticipant,
  leaveConversation,
  updateParticipantRole,
  muteConversation,
  unmuteConversation,
  archiveConversation,
  unarchiveConversation,
  getConversationMembers,
  getConversationMedia,
  clearConversationHistory
} from "../controllers/conversation.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Conversation CRUD operations
router.post("/create", authenticateToken, createConversation);
router.get("/", authenticateToken, getConversations);
router.get("/:conversationId", authenticateToken, getConversation);
router.put("/:conversationId", authenticateToken, updateConversation);
router.delete("/:conversationId", authenticateToken, deleteConversation);

// Participant management
router.post("/:conversationId/participants", authenticateToken, addParticipant);
router.delete("/:conversationId/participants/:userId", authenticateToken, removeParticipant);
router.post("/:conversationId/leave", authenticateToken, leaveConversation);
router.put("/:conversationId/participants/:userId/role", authenticateToken, updateParticipantRole);
router.get("/:conversationId/members", authenticateToken, getConversationMembers);

// Conversation settings
router.post("/:conversationId/mute", authenticateToken, muteConversation);
router.post("/:conversationId/unmute", authenticateToken, unmuteConversation);
router.post("/:conversationId/archive", authenticateToken, archiveConversation);
router.post("/:conversationId/unarchive", authenticateToken, unarchiveConversation);

// Conversation content
router.get("/:conversationId/media", authenticateToken, getConversationMedia);
router.delete("/:conversationId/history", authenticateToken, clearConversationHistory);

export default router;
