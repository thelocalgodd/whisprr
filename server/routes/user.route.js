import express from "express";
import { 
  getUserProfile,
  updateUserProfile,
  searchUsers,
  getUserContacts,
  addContact,
  removeContact,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getUserStatus,
  updateUserStatus,
  uploadAvatar,
  deleteAvatar
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.userId}-${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Profile routes
router.get("/profile/:userId", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, updateUserProfile);
router.post("/avatar", authenticateToken, upload.single('avatar'), uploadAvatar);
router.delete("/avatar", authenticateToken, deleteAvatar);

// Search and discovery
router.get("/search", authenticateToken, searchUsers);

// Contact management
router.get("/contacts", authenticateToken, getUserContacts);
router.post("/contacts", authenticateToken, addContact);
router.delete("/contacts/:contactId", authenticateToken, removeContact);

// Blocking functionality
router.post("/block", authenticateToken, blockUser);
router.delete("/block/:userId", authenticateToken, unblockUser);
router.get("/blocked", authenticateToken, getBlockedUsers);

// Status management
router.get("/status/:userId", authenticateToken, getUserStatus);
router.put("/status", authenticateToken, updateUserStatus);

export default router;