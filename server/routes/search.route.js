import express from "express";
import {
  searchMessages,
  searchUsers,
  searchConversations,
  globalSearch,
  searchMedia,
  getSearchSuggestions,
  saveSearchHistory,
  getSearchHistory,
  clearSearchHistory
} from "../controllers/search.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Global search
router.get("/global", authenticateToken, globalSearch);

// Specific searches
router.get("/messages", authenticateToken, searchMessages);
router.get("/users", authenticateToken, searchUsers);
router.get("/conversations", authenticateToken, searchConversations);
router.get("/media", authenticateToken, searchMedia);

// Search suggestions and autocomplete
router.get("/suggestions", authenticateToken, getSearchSuggestions);

// Search history
router.post("/history", authenticateToken, saveSearchHistory);
router.get("/history", authenticateToken, getSearchHistory);
router.delete("/history", authenticateToken, clearSearchHistory);

export default router;