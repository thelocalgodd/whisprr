import User from "../models/user.model.js";
import { emitToUser } from "../sockets/index.js";
import path from "path";
import fs from "fs";

export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching user profile",
      error: error.message 
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.password;
    delete updates.email;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating profile",
      error: error.message 
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query, limit = 10, page = 1 } = req.query;
    const { userId } = req.user;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        message: "Search query must be at least 2 characters long" 
      });
    }

    const searchRegex = new RegExp(query, 'i');
    const skip = (page - 1) * limit;

    const users = await User.find({
      _id: { $ne: userId }, // Exclude current user
      $or: [
        { username: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex }
      ]
    })
    .select("username fullName avatar bio isOnline lastSeen")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ username: 1 });

    const totalUsers = await User.countDocuments({
      _id: { $ne: userId },
      $or: [
        { username: searchRegex },
        { fullName: searchRegex },
        { email: searchRegex }
      ]
    });

    res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page * limit < totalUsers,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error searching users",
      error: error.message 
    });
  }
};

export const getUserContacts = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).populate({
      path: "contacts.userId",
      select: "username fullName avatar bio isOnline lastSeen status"
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      contacts: user.contacts
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching contacts",
      error: error.message 
    });
  }
};

export const addContact = async (req, res) => {
  try {
    const { userId } = req.user;
    const { contactId, nickname } = req.body;

    if (userId === contactId) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot add yourself as a contact" 
      });
    }

    const [user, contact] = await Promise.all([
      User.findById(userId),
      User.findById(contactId)
    ]);

    if (!contact) {
      return res.status(404).json({ 
        success: false,
        message: "Contact not found" 
      });
    }

    // Check if contact already exists
    const existingContact = user.contacts.find(c => c.userId.toString() === contactId);
    if (existingContact) {
      return res.status(400).json({ 
        success: false,
        message: "Contact already exists" 
      });
    }

    // Add contact
    user.contacts.push({
      userId: contactId,
      nickname: nickname || contact.fullName,
      addedAt: new Date()
    });

    await user.save();

    // Notify the contact that they were added
    emitToUser(contactId, "contact-added", {
      userId,
      username: user.username,
      fullName: user.fullName,
      avatar: user.avatar
    });

    res.status(200).json({
      success: true,
      message: "Contact added successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error adding contact",
      error: error.message 
    });
  }
};

export const removeContact = async (req, res) => {
  try {
    const { userId } = req.user;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    user.contacts = user.contacts.filter(c => c.userId.toString() !== contactId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Contact removed successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error removing contact",
      error: error.message 
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { blockedUserId } = req.body;

    if (userId === blockedUserId) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot block yourself" 
      });
    }

    const user = await User.findById(userId);
    
    // Check if user is already blocked
    const alreadyBlocked = user.blockedUsers.some(id => id.toString() === blockedUserId);
    if (alreadyBlocked) {
      return res.status(400).json({ 
        success: false,
        message: "User is already blocked" 
      });
    }

    user.blockedUsers.push(blockedUserId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "User blocked successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error blocking user",
      error: error.message 
    });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { userId: blockedUserId } = req.params;

    const user = await User.findById(userId);
    user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== blockedUserId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error unblocking user",
      error: error.message 
    });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).populate({
      path: "blockedUsers",
      select: "username fullName avatar"
    });

    res.status(200).json({
      success: true,
      blockedUsers: user.blockedUsers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching blocked users",
      error: error.message 
    });
  }
};

export const getUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("isOnline lastSeen status");

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      status: {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        customStatus: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching user status",
      error: error.message 
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status, isOnline } = req.body;

    const updateData = { lastSeen: new Date() };
    if (status !== undefined) updateData.status = status;
    if (isOnline !== undefined) updateData.isOnline = isOnline;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("isOnline lastSeen status username");

    // Emit status change to contacts
    emitToUser(userId, "status-updated", {
      userId,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      status: user.status
    });

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      status: {
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        customStatus: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating status",
      error: error.message 
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.user;
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "No file uploaded" 
      });
    }

    const user = await User.findById(userId);
    
    // Delete old avatar if it exists
    if (user.avatar) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Update user with new avatar path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(process.cwd(), 'uploads/avatars', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error uploading avatar",
      error: error.message 
    });
  }
};

export const deleteAvatar = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);

    if (user.avatar) {
      const avatarPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
      
      user.avatar = null;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Avatar deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting avatar",
      error: error.message 
    });
  }
};