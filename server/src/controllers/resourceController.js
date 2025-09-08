const Resource = require("../models/Resource");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const PDFDocument = require("pdf-lib").PDFDocument;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/resources");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `resource-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes =
      /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mp3|wav|txt|ppt|pptx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type for resource"));
    }
  },
});

const createResource = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      type,
      category,
      content,
      author,
      tags,
      targetAudience,
      language = "en",
      difficulty = "beginner",
      estimatedTime,
      externalUrl,
      embedCode,
    } = req.body;

    if (req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "Only counselors and admins can create resources" });
    }

    const resourceData = {
      title,
      description,
      type,
      category,
      uploadedBy: req.user._id,
      status: req.user.role === "admin" ? "approved" : "pending-review",
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      targetAudience: targetAudience ? targetAudience.split(",") : [],
      language,
      difficulty,
      estimatedTime: parseInt(estimatedTime) || undefined,
    };

    if (author) {
      resourceData.author =
        typeof author === "string" ? JSON.parse(author) : author;
    }

    if (content) {
      resourceData.content =
        typeof content === "string" ? JSON.parse(content) : content;
    }

    if (externalUrl) {
      resourceData.content = { ...resourceData.content, externalUrl };
    }

    if (embedCode) {
      resourceData.content = { ...resourceData.content, embedCode };
    }

    if (req.file) {
      resourceData.content = {
        ...resourceData.content,
        fileUrl: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
      };

      if (req.file.mimetype === "application/pdf") {
        try {
          const pdfBuffer = await fs.readFile(req.file.path);
          const pdf = await PDFDocument.load(pdfBuffer);
          resourceData.content.pages = pdf.getPageCount();
        } catch (error) {
          console.error("PDF processing error:", error);
        }
      }

      if (
        req.file.mimetype.startsWith("video/") ||
        req.file.mimetype.startsWith("audio/")
      ) {
        // In a real implementation, you'd use ffprobe or similar to get duration
        // For now, we'll leave duration to be set manually
      }
    }

    const resource = new Resource(resourceData);
    await resource.save();

    const populatedResource = await Resource.findById(resource._id).populate(
      "uploadedBy",
      "username profile role counselorInfo.isVerified"
    );

    res.status(201).json({
      message: "Resource created successfully",
      resource: populatedResource,
    });
  } catch (error) {
    console.error("Create resource error:", error);
    res.status(500).json({ error: "Failed to create resource" });
  }
};

const getResources = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      difficulty,
      language,
      search,
      tags,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      status: "approved",
      isActive: true,
    };

    // Apply visibility filter based on user role
    if (!req.user) {
      filter.visibility = "public";
    } else if (req.user.role === "user") {
      filter.visibility = { $in: ["public", "users-only"] };
    } else if (req.user.role === "counselor") {
      filter.visibility = { $in: ["public", "users-only", "counselors-only"] };
    }
    // Admins can see all approved resources

    if (category && category !== "all") {
      filter.category = category;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (difficulty && difficulty !== "all") {
      filter.difficulty = difficulty;
    }

    if (language && language !== "all") {
      filter.language = language;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(",").map((tag) => tag.trim());
      filter.tags = { $in: tagArray };
    }

    const sortOptions = {};
    if (sortBy === "popularity") {
      sortOptions["metadata.views"] = sortOrder === "desc" ? -1 : 1;
    } else if (sortBy === "rating") {
      sortOptions["metadata.averageRating"] = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const resources = await Resource.find(filter)
      .populate("uploadedBy", "username profile role counselorInfo.isVerified")
      .populate("approvedBy", "username profile")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content.text"); // Don't send full text content in list view

    const total = await Resource.countDocuments(filter);

    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ error: "Failed to get resources" });
  }
};

const getResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId)
      .populate("uploadedBy", "username profile role counselorInfo.isVerified")
      .populate("approvedBy", "username profile")
      .populate(
        "relatedResources",
        "title type category difficulty estimatedTime metadata.averageRating"
      )
      .populate("metadata.ratings.user", "username profile");

    if (!resource || !resource.isActive) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (
      resource.status !== "approved" &&
      resource.uploadedBy._id.toString() !== req.user?._id.toString() &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({ error: "Resource not available" });
    }

    // Check visibility permissions
    if (!req.user && resource.visibility !== "public") {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (
      req.user?.role === "user" &&
      ["counselors-only", "premium"].includes(resource.visibility)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Increment view count
    await Resource.findByIdAndUpdate(resourceId, {
      $inc: { "metadata.views": 1 },
    });

    res.json({ resource });
  } catch (error) {
    console.error("Get resource error:", error);
    res.status(500).json({ error: "Failed to get resource" });
  }
};

const updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updates = req.body;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (
      resource.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this resource" });
    }

    const allowedUpdates = [
      "title",
      "description",
      "category",
      "content",
      "tags",
      "targetAudience",
      "difficulty",
      "estimatedTime",
      "author",
      "accessibility",
      "relatedResources",
    ];

    if (req.user.role === "admin") {
      allowedUpdates.push("status", "visibility", "approvedBy");
    }

    const updateObject = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === "tags" && typeof updates[key] === "string") {
          updateObject[key] = updates[key].split(",").map((tag) => tag.trim());
        } else if (
          key === "targetAudience" &&
          typeof updates[key] === "string"
        ) {
          updateObject[key] = updates[key].split(",");
        } else {
          updateObject[key] = updates[key];
        }
      }
    });

    // If content is being updated, increment version
    if (updateObject.content) {
      const currentVersion = resource.version.number || "1.0.0";
      const [major, minor, patch] = currentVersion.split(".").map(Number);
      updateObject["version.number"] = `${major}.${minor}.${patch + 1}`;
      updateObject["version.lastUpdated"] = new Date();

      if (!resource.version.changeLog) {
        updateObject["version.changeLog"] = [];
      }
      updateObject["version.changeLog"].push({
        version: updateObject["version.number"],
        changes: "Content updated",
        date: new Date(),
      });
    }

    // If non-admin updates, reset to pending review
    if (req.user.role !== "admin" && Object.keys(updateObject).length > 0) {
      updateObject.status = "pending-review";
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      resourceId,
      updateObject,
      { new: true, runValidators: true }
    ).populate("uploadedBy", "username profile role");

    res.json({
      message: "Resource updated successfully",
      resource: updatedResource,
    });
  } catch (error) {
    console.error("Update resource error:", error);
    res.status(500).json({ error: "Failed to update resource" });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (
      resource.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this resource" });
    }

    // Soft delete
    resource.isActive = false;
    resource.status = "archived";
    await resource.save();

    // Delete associated file if exists
    if (resource.content.fileUrl) {
      try {
        await fs.unlink(resource.content.fileUrl);
      } catch (error) {
        console.error("File deletion error:", error);
      }
    }

    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error("Delete resource error:", error);
    res.status(500).json({ error: "Failed to delete resource" });
  }
};

const rateResource = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { resourceId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (resource.uploadedBy.toString() === userId.toString()) {
      return res.status(400).json({ error: "Cannot rate your own resource" });
    }

    await resource.addRating(userId, rating, comment);

    res.json({
      message: "Rating submitted successfully",
      averageRating: resource.metadata.averageRating,
      totalRatings: resource.metadata.ratings.length,
    });
  } catch (error) {
    console.error("Rate resource error:", error);
    res.status(500).json({ error: "Failed to rate resource" });
  }
};

const bookmarkResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    await resource.toggleBookmark(userId);

    const isBookmarked = resource.metadata.bookmarks.includes(userId);

    res.json({
      message: isBookmarked ? "Resource bookmarked" : "Bookmark removed",
      bookmarked: isBookmarked,
      totalBookmarks: resource.metadata.bookmarks.length,
    });
  } catch (error) {
    console.error("Bookmark resource error:", error);
    res.status(500).json({ error: "Failed to bookmark resource" });
  }
};

const getMyBookmarks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const bookmarkedResources = await Resource.find({
      "metadata.bookmarks": userId,
      isActive: true,
      status: "approved",
    })
      .populate("uploadedBy", "username profile role")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-content.text");

    const total = await Resource.countDocuments({
      "metadata.bookmarks": userId,
      isActive: true,
      status: "approved",
    });

    res.json({
      bookmarks: bookmarkedResources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ error: "Failed to get bookmarks" });
  }
};

const approveResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { visibility = "public" } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    resource.status = "approved";
    resource.approvedBy = req.user._id;
    resource.visibility = visibility;
    resource.publishedAt = new Date();

    await resource.save();

    res.json({
      message: "Resource approved successfully",
      resource: {
        id: resource._id,
        title: resource.title,
        status: resource.status,
        visibility: resource.visibility,
        approvedBy: req.user._id,
        publishedAt: resource.publishedAt,
      },
    });
  } catch (error) {
    console.error("Approve resource error:", error);
    res.status(500).json({ error: "Failed to approve resource" });
  }
};

const rejectResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { reason } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    resource.status = "rejected";
    resource.approvedBy = req.user._id;

    await resource.save();

    res.json({
      message: "Resource rejected",
      reason,
      resource: {
        id: resource._id,
        title: resource.title,
        status: resource.status,
      },
    });
  } catch (error) {
    console.error("Reject resource error:", error);
    res.status(500).json({ error: "Failed to reject resource" });
  }
};

const getPendingResources = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const resources = await Resource.find({
      status: "pending-review",
      isActive: true,
    })
      .populate("uploadedBy", "username profile role counselorInfo.isVerified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Resource.countDocuments({
      status: "pending-review",
      isActive: true,
    });

    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get pending resources error:", error);
    res.status(500).json({ error: "Failed to get pending resources" });
  }
};

const createResourceValidation = [
  body("title")
    .isLength({ min: 5, max: 200 })
    .trim()
    .withMessage("Title must be 5-200 characters"),
  body("description")
    .isLength({ min: 10, max: 1000 })
    .trim()
    .withMessage("Description must be 10-1000 characters"),
  body("type")
    .isIn([
      "article",
      "video",
      "audio",
      "pdf",
      "exercise",
      "worksheet",
      "guide",
      "tool",
    ])
    .withMessage("Invalid resource type"),
  body("category")
    .isIn([
      "mental-health",
      "coping-strategies",
      "self-help",
      "crisis-support",
      "relationships",
      "mindfulness",
      "therapy-techniques",
      "educational",
    ])
    .withMessage("Invalid category"),
  body("difficulty")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid difficulty level"),
];

const ratingValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment too long (max 500 characters)"),
];

module.exports = {
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
};
