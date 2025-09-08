import express from "express";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  likeResource,
  dislikeResource
} from "../controllers/resource.controller.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/", getResources);
router.get("/:resourceId", getResourceById);

// Protected routes
router.use(authenticateToken);

// Resource interactions
router.post("/:resourceId/like", likeResource);
router.post("/:resourceId/dislike", dislikeResource);

// Resource management (counselors and admins)
router.post("/create", requireRole(['counselor', 'admin', 'moderator']), createResource);
router.put("/:resourceId", updateResource);
router.delete("/:resourceId", deleteResource);

export default router;