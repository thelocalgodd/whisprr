import path from "path";
import fs from "fs";
import sharp from "sharp";

// Helper function to get file type
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  return 'file';
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const uploadMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const files = req.files || [req.file];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file) continue;

      const fileInfo = {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: getFileType(file.mimetype),
        uploadedBy: userId,
        uploadedAt: new Date(),
        path: file.path,
        url: `/api/v1/upload/${getFileType(file.mimetype)}s/${file.filename}`
      };

      // Generate thumbnail for images
      if (file.mimetype.startsWith('image/')) {
        try {
          const thumbnailPath = path.join('uploads/thumbnails', `thumb_${file.filename}`);
          await sharp(file.path)
            .resize(200, 200, { 
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
          
          fileInfo.thumbnail = `/api/v1/upload/thumbnails/thumb_${file.filename}`;
        } catch (error) {
          console.error('Thumbnail generation failed:', error);
        }
      }

      uploadedFiles.push(fileInfo);
    }

    res.status(200).json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles
    });
  } catch (error) {
    // Clean up uploaded files if there was an error
    const files = req.files || [req.file];
    if (files) {
      files.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: "Error uploading files",
      error: error.message
    });
  }
};

export const getMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Check different upload directories
    const possiblePaths = [
      path.join('uploads/images', filename),
      path.join('uploads/videos', filename),
      path.join('uploads/audio', filename),
      path.join('uploads/files', filename),
      path.join('uploads/avatars', filename),
      path.join('uploads/thumbnails', filename)
    ];

    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set appropriate content type
    let contentType = 'application/octet-stream';
    if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.webm') contentType = 'video/webm';
    else if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (ext === '.wav') contentType = 'audio/wav';
    else if (ext === '.ogg') contentType = 'audio/ogg';
    else if (ext === '.pdf') contentType = 'application/pdf';

    res.set({
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Last-Modified': stats.mtime.toUTCString()
    });

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving file",
      error: error.message
    });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { filename } = req.params;
    const { userId } = req.user;

    // Check different upload directories
    const possiblePaths = [
      path.join('uploads/images', filename),
      path.join('uploads/videos', filename),
      path.join('uploads/audio', filename),
      path.join('uploads/files', filename),
      path.join('uploads/avatars', filename)
    ];

    let filePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        filePath = possiblePath;
        break;
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    // Also delete thumbnail if it exists
    const thumbnailPath = path.join('uploads/thumbnails', `thumb_${filename}`);
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    res.status(200).json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting file",
      error: error.message
    });
  }
};

export const compressImage = async (req, res) => {
  try {
    const { quality = 80, width, height } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        message: "File must be an image"
      });
    }

    const originalPath = req.file.path;
    const compressedFilename = `compressed_${req.file.filename}`;
    const compressedPath = path.join('uploads/images', compressedFilename);

    let sharpInstance = sharp(originalPath);

    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(
        width ? parseInt(width) : null,
        height ? parseInt(height) : null,
        { 
          fit: 'inside',
          withoutEnlargement: true
        }
      );
    }

    // Compress based on format
    if (req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg') {
      await sharpInstance.jpeg({ quality: parseInt(quality) }).toFile(compressedPath);
    } else if (req.file.mimetype === 'image/png') {
      await sharpInstance.png({ quality: parseInt(quality) }).toFile(compressedPath);
    } else if (req.file.mimetype === 'image/webp') {
      await sharpInstance.webp({ quality: parseInt(quality) }).toFile(compressedPath);
    } else {
      // Default to JPEG for other formats
      await sharpInstance.jpeg({ quality: parseInt(quality) }).toFile(compressedPath);
    }

    // Get file sizes for comparison
    const originalStats = fs.statSync(originalPath);
    const compressedStats = fs.statSync(compressedPath);
    const compressionRatio = ((originalStats.size - compressedStats.size) / originalStats.size * 100).toFixed(2);

    // Clean up original file
    fs.unlinkSync(originalPath);

    res.status(200).json({
      success: true,
      message: "Image compressed successfully",
      file: {
        filename: compressedFilename,
        originalName: req.file.originalname,
        originalSize: formatFileSize(originalStats.size),
        compressedSize: formatFileSize(compressedStats.size),
        compressionRatio: `${compressionRatio}%`,
        url: `/api/v1/upload/images/${compressedFilename}`
      }
    });
  } catch (error) {
    // Clean up files on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Error compressing image",
      error: error.message
    });
  }
};

export const generateThumbnail = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No video file provided"
      });
    }

    if (!req.file.mimetype.startsWith('video/')) {
      return res.status(400).json({
        success: false,
        message: "File must be a video"
      });
    }

    const thumbnailFilename = `thumb_${path.parse(req.file.filename).name}.jpg`;
    const thumbnailPath = path.join('uploads/thumbnails', thumbnailFilename);

    // For now, we'll create a placeholder thumbnail
    // In a production environment, you would use ffmpeg to extract video frames
    await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: { r: 128, g: 128, b: 128 }
      }
    })
    .jpeg()
    .toFile(thumbnailPath);

    res.status(200).json({
      success: true,
      message: "Thumbnail generated successfully",
      thumbnail: {
        filename: thumbnailFilename,
        url: `/api/v1/upload/thumbnails/${thumbnailFilename}`
      },
      video: {
        filename: req.file.filename,
        url: `/api/v1/upload/videos/${req.file.filename}`
      }
    });
  } catch (error) {
    // Clean up files on error
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Error generating thumbnail",
      error: error.message
    });
  }
};