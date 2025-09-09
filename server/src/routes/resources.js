const express = require("express");
const router = express.Router();

const {
  createResource,
  getResources,
  getResource,
  updateResource,
  deleteResource,
  rateResource,
  bookmarkResource,
  getMyBookmarks,
  approveResource,
  rejectResource,
  getPendingResources,
  upload,
  createResourceValidation,
  ratingValidation,
} = require("../controllers/resourceController");

const { authenticate, authorize, optionalAuth } = require("../middleware/auth");
const { rateLimiters } = require("../middleware/security");

router.post("/", upload.single("file"), createResource);

router.get("/", getResources);

router.get("/my-bookmarks", getMyBookmarks);

router.get("/pending", getPendingResources);

router.get("/:resourceId", getResource);

router.put("/:resourceId", updateResource);

router.delete("/:resourceId", deleteResource);

router.post("/:resourceId/rate", rateResource);

router.post("/:resourceId/bookmark", bookmarkResource);

router.post("/:resourceId/approve", approveResource);

router.post("/:resourceId/reject", rejectResource);

module.exports = router;
