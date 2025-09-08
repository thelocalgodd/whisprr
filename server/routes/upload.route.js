import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authenticateToken } from "../middleware/auth.js";
import {
  uploadMedia,
  deleteMedia,
  getMedia,
  compressImage,
  generateThumbnail
} from "../controllers/upload.controller.js";

const router = express.Router();

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    './uploads/images',
    './uploads/videos', 
    './uploads/audio',
    './uploads/files',
    './uploads/avatars',
    './uploads/thumbnails'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = './uploads/files'; // default
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = './uploads/images';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = './uploads/videos';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = './uploads/audio';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
  };
  
  const allAllowedTypes = [
    ...allowedTypes.image,
    ...allowedTypes.video,
    ...allowedTypes.audio,
    ...allowedTypes.document
  ];
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    files: 10 // max 10 files at once
  }
});

// Single file upload
router.post('/single', authenticateToken, upload.single('file'), uploadMedia);

// Multiple files upload
router.post('/multiple', authenticateToken, upload.array('files', 10), uploadMedia);

// Get uploaded media
router.get('/media/:filename', getMedia);

// Delete uploaded media
router.delete('/media/:filename', authenticateToken, deleteMedia);

// Image processing routes
router.post('/compress-image', authenticateToken, upload.single('image'), compressImage);
router.post('/generate-thumbnail', authenticateToken, upload.single('video'), generateThumbnail);

// Serve static files
router.use('/images', express.static('uploads/images'));
router.use('/videos', express.static('uploads/videos'));
router.use('/audio', express.static('uploads/audio'));
router.use('/files', express.static('uploads/files'));
router.use('/avatars', express.static('uploads/avatars'));
router.use('/thumbnails', express.static('uploads/thumbnails'));

export default router;