import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { emitToConversation, emitToUser } from "../sockets/index.js";

export const createConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { participantIds, conversationType = "private", name, description } = req.body;

    // Validate participants
    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "At least one participant is required" 
      });
    }

    // Check if all participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(400).json({ 
        success: false,
        message: "Some participants not found" 
      });
    }

    // For private conversations, check if conversation already exists
    if (conversationType === "private" && participantIds.length === 1) {
      const existingConversation = await Conversation.findOne({
        conversationType: "private",
        "participants.userId": { $all: [userId, participantIds[0]] },
        "participants.2": { $exists: false } // Ensure only 2 participants
      });

      if (existingConversation) {
        return res.status(200).json({
          success: true,
          conversation: existingConversation,
          message: "Conversation already exists"
        });
      }
    }

    // Create conversation participants array
    const conversationParticipants = [
      { userId, role: "admin", joinedAt: new Date() },
      ...participantIds.map(id => ({ 
        userId: id, 
        role: conversationType === "group" ? "member" : "member",
        joinedAt: new Date() 
      }))
    ];

    const conversation = new Conversation({
      conversationType,
      name: conversationType === "group" ? name : null,
      description: conversationType === "group" ? description : null,
      participants: conversationParticipants,
      createdBy: userId,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    await conversation.save();
    await conversation.populate('participants.userId', 'username fullName avatar');

    // Notify participants about the new conversation
    participantIds.forEach(participantId => {
      emitToUser(participantId, "conversation-created", {
        conversation,
        createdBy: userId
      });
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error creating conversation",
      error: error.message 
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, archived = false, page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    let query = { 
      "participants.userId": userId,
      "participants.leftAt": { $exists: false }
    };

    // Filter by conversation type if specified
    if (type) {
      query.conversationType = type;
    }

    // Filter archived conversations
    const userParticipant = {
      $elemMatch: {
        userId,
        isArchived: archived === "true"
      }
    };
    query.participants = userParticipant;

    const conversations = await Conversation.find(query)
      .populate('participants.userId', 'username fullName avatar isOnline lastSeen')
      .populate('lastMessage', 'content messageType timestamp senderId')
      .populate('createdBy', 'username fullName')
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          'readBy.userId': { $ne: userId },
          senderId: { $ne: userId }
        });

        return {
          ...conversation.toObject(),
          unreadCount
        };
      })
    );

    const totalConversations = await Conversation.countDocuments(query);

    res.status(200).json({
      success: true,
      conversations: conversationsWithUnread,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalConversations / limit),
        totalConversations,
        hasNextPage: page * limit < totalConversations,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching conversations",
      error: error.message 
    });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.userId', 'username fullName avatar isOnline lastSeen status')
      .populate('lastMessage', 'content messageType timestamp senderId')
      .populate('createdBy', 'username fullName');

    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => 
      p.userId._id.toString() === userId && !p.leftAt
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this conversation" 
      });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching conversation",
      error: error.message 
    });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { name, description, avatar } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Check if user is an admin
    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant || userParticipant.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can update conversation details" 
      });
    }

    // Update conversation details
    if (name !== undefined) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar !== undefined) conversation.avatar = avatar;

    conversation.updatedAt = new Date();
    await conversation.save();

    // Notify all participants
    emitToConversation(conversationId, "conversation-updated", {
      conversationId,
      updates: { name, description, avatar },
      updatedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      conversation
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating conversation",
      error: error.message 
    });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Only conversation creator can delete
    if (conversation.createdBy.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "Only conversation creator can delete" 
      });
    }

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    // Notify all participants
    conversation.participants.forEach(participant => {
      if (participant.userId.toString() !== userId) {
        emitToUser(participant.userId, "conversation-deleted", {
          conversationId,
          deletedBy: userId
        });
      }
    });

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting conversation",
      error: error.message 
    });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { participantId } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Check if user is admin
    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant || userParticipant.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can add participants" 
      });
    }

    // Check if participant already exists
    const existingParticipant = conversation.participants.find(p => 
      p.userId.toString() === participantId && !p.leftAt
    );

    if (existingParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "User is already a participant" 
      });
    }

    // Add participant
    conversation.participants.push({
      userId: participantId,
      role: "member",
      joinedAt: new Date()
    });

    await conversation.save();

    // Notify new participant
    emitToUser(participantId, "added-to-conversation", {
      conversation,
      addedBy: userId
    });

    // Notify existing participants
    emitToConversation(conversationId, "participant-added", {
      conversationId,
      participantId,
      addedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Participant added successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error adding participant",
      error: error.message 
    });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId, userId: participantId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Check if user is admin
    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant || userParticipant.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can remove participants" 
      });
    }

    // Find and mark participant as left
    const participantToRemove = conversation.participants.find(p => 
      p.userId.toString() === participantId && !p.leftAt
    );

    if (!participantToRemove) {
      return res.status(404).json({ 
        success: false,
        message: "Participant not found in conversation" 
      });
    }

    participantToRemove.leftAt = new Date();
    await conversation.save();

    // Notify removed participant
    emitToUser(participantId, "removed-from-conversation", {
      conversationId,
      removedBy: userId
    });

    // Notify remaining participants
    emitToConversation(conversationId, "participant-removed", {
      conversationId,
      participantId,
      removedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Participant removed successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error removing participant",
      error: error.message 
    });
  }
};

export const leaveConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "You are not a participant in this conversation" 
      });
    }

    userParticipant.leftAt = new Date();
    await conversation.save();

    // Notify remaining participants
    emitToConversation(conversationId, "participant-left", {
      conversationId,
      participantId: userId
    });

    res.status(200).json({
      success: true,
      message: "Successfully left conversation"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error leaving conversation",
      error: error.message 
    });
  }
};

export const updateParticipantRole = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId, userId: participantId } = req.params;
    const { role } = req.body;

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid role" 
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Check if user is admin
    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant || userParticipant.role !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Only admins can update participant roles" 
      });
    }

    // Update participant role
    const participantToUpdate = conversation.participants.find(p => 
      p.userId.toString() === participantId && !p.leftAt
    );

    if (!participantToUpdate) {
      return res.status(404).json({ 
        success: false,
        message: "Participant not found" 
      });
    }

    participantToUpdate.role = role;
    await conversation.save();

    // Notify conversation
    emitToConversation(conversationId, "participant-role-updated", {
      conversationId,
      participantId,
      newRole: role,
      updatedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Participant role updated successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error updating participant role",
      error: error.message 
    });
  }
};

export const muteConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { mutedUntil } = req.body; // Optional: specify until when to mute

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "You are not a participant in this conversation" 
      });
    }

    userParticipant.isMuted = true;
    userParticipant.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation muted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error muting conversation",
      error: error.message 
    });
  }
};

export const unmuteConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "You are not a participant in this conversation" 
      });
    }

    userParticipant.isMuted = false;
    userParticipant.mutedUntil = null;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation unmuted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error unmuting conversation",
      error: error.message 
    });
  }
};

export const archiveConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "You are not a participant in this conversation" 
      });
    }

    userParticipant.isArchived = true;
    userParticipant.archivedAt = new Date();
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation archived successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error archiving conversation",
      error: error.message 
    });
  }
};

export const unarchiveConversation = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "You are not a participant in this conversation" 
      });
    }

    userParticipant.isArchived = false;
    userParticipant.archivedAt = null;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Conversation unarchived successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error unarchiving conversation",
      error: error.message 
    });
  }
};

export const getConversationMembers = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.userId', 'username fullName avatar isOnline lastSeen status');

    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    // Check if user is a participant
    const isParticipant = conversation.participants.some(p => 
      p.userId._id.toString() === userId && !p.leftAt
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view conversation members" 
      });
    }

    const activeMembers = conversation.participants.filter(p => !p.leftAt);

    res.status(200).json({
      success: true,
      members: activeMembers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching conversation members",
      error: error.message 
    });
  }
};

export const getConversationMedia = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { mediaType = "all", page = 1, limit = 20 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const isParticipant = conversation.participants.some(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view conversation media" 
      });
    }

    const skip = (page - 1) * limit;
    let query = { 
      conversationId,
      $or: [
        { messageType: "image" },
        { messageType: "video" },
        { messageType: "audio" },
        { messageType: "file" }
      ]
    };

    if (mediaType !== "all") {
      query.messageType = mediaType;
    }

    const mediaMessages = await Message.find(query)
      .populate('senderId', 'username fullName avatar')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalMedia = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      media: mediaMessages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMedia / limit),
        totalMedia,
        hasNextPage: page * limit < totalMedia,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching conversation media",
      error: error.message 
    });
  }
};

export const clearConversationHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { clearForEveryone = false } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const userParticipant = conversation.participants.find(p => 
      p.userId.toString() === userId && !p.leftAt
    );

    if (!userParticipant) {
      return res.status(400).json({ 
        success: false,
        message: "You are not a participant in this conversation" 
      });
    }

    if (clearForEveryone) {
      // Only admin can clear for everyone
      if (userParticipant.role !== "admin") {
        return res.status(403).json({ 
          success: false,
          message: "Only admins can clear history for everyone" 
        });
      }

      // Delete all messages
      await Message.deleteMany({ conversationId });

      // Notify all participants
      emitToConversation(conversationId, "conversation-history-cleared", {
        conversationId,
        clearedBy: userId,
        clearForEveryone: true
      });
    } else {
      // Mark messages as deleted for this user only
      await Message.updateMany(
        { conversationId },
        { $addToSet: { deletedFor: userId } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Conversation history cleared successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error clearing conversation history",
      error: error.message 
    });
  }
};
