import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import { emitToConversation, emitToUser } from "../sockets/index.js";

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId, content, messageType = "text", replyTo, media } = req.body;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to send messages in this conversation" 
      });
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId: userId,
      content,
      messageType,
      replyTo,
      media,
      timestamp: new Date(),
      readBy: [{ userId, readAt: new Date() }] // Mark as read for sender
    });

    await message.save();
    await message.populate('senderId', 'username fullName avatar');
    if (replyTo) {
      await message.populate('replyTo', 'content senderId');
    }

    // Update conversation's last message
    conversation.lastMessage = message._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Emit to all conversation participants
    emitToConversation(conversationId, "new-message", {
      message,
      conversationId
    });

    // Send push notifications to offline participants
    const offlineParticipants = conversation.participants.filter(p => 
      p.userId.toString() !== userId && !p.isOnline
    );

    for (const participant of offlineParticipants) {
      emitToUser(participant.userId, "notification", {
        type: "message",
        from: userId,
        conversationId,
        messageContent: content,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error sending message",
      error: error.message 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { page = 1, limit = 50, before } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this conversation" 
      });
    }

    const skip = (page - 1) * limit;
    let query = { conversationId };

    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('senderId', 'username fullName avatar')
      .populate('replyTo', 'content senderId messageType')
      .populate({
        path: 'reactions.userId',
        select: 'username fullName'
      });

    const totalMessages = await Message.countDocuments({ conversationId });

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasNextPage: page * limit < totalMessages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching messages",
      error: error.message 
    });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    // Only sender can edit their message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to edit this message" 
      });
    }

    // Check if message can still be edited (within time limit)
    const timeLimit = 15 * 60 * 1000; // 15 minutes
    const messageAge = Date.now() - message.timestamp.getTime();
    if (messageAge > timeLimit) {
      return res.status(403).json({ 
        success: false,
        message: "Message can no longer be edited" 
      });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Emit edit event to conversation
    emitToConversation(message.conversationId, "message-edited", {
      messageId,
      newContent: content,
      editedAt: message.editedAt
    });

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      data: message
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error editing message",
      error: error.message 
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to delete this message" 
      });
    }

    if (deleteForEveryone) {
      // Check time limit for delete for everyone (1 hour)
      const timeLimit = 60 * 60 * 1000; // 1 hour
      const messageAge = Date.now() - message.timestamp.getTime();
      if (messageAge > timeLimit) {
        return res.status(403).json({ 
          success: false,
          message: "Cannot delete for everyone after 1 hour" 
        });
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = userId;
      await message.save();

      // Emit delete event to all participants
      emitToConversation(message.conversationId, "message-deleted", {
        messageId,
        deletedBy: userId,
        deleteForEveryone: true
      });
    } else {
      // Delete only for the user
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error deleting message",
      error: error.message 
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    // Check if user already marked as read
    const alreadyRead = message.readBy.some(r => r.userId.toString() === userId);
    if (!alreadyRead) {
      message.readBy.push({ userId, readAt: new Date() });
      await message.save();

      // Emit read receipt to conversation
      emitToConversation(message.conversationId, "message-read", {
        messageId,
        readBy: userId,
        readAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: "Message marked as read"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error marking message as read",
      error: error.message 
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.query;

    let query = {
      'readBy.userId': { $ne: userId },
      senderId: { $ne: userId } // Don't count own messages
    };

    if (conversationId) {
      query.conversationId = conversationId;
    }

    const unreadCount = await Message.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error getting unread count",
      error: error.message 
    });
  }
};

export const forwardMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;
    const { conversationIds } = req.body;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ 
        success: false,
        message: "Original message not found" 
      });
    }

    const forwardedMessages = [];

    for (const conversationId of conversationIds) {
      // Verify user can send to this conversation
      const conversation = await Conversation.findById(conversationId);
      const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
      
      if (isParticipant) {
        const forwardedMessage = new Message({
          conversationId,
          senderId: userId,
          content: originalMessage.content,
          messageType: originalMessage.messageType,
          media: originalMessage.media,
          isForwarded: true,
          forwardedFrom: messageId,
          timestamp: new Date(),
          readBy: [{ userId, readAt: new Date() }]
        });

        await forwardedMessage.save();
        await forwardedMessage.populate('senderId', 'username fullName avatar');
        forwardedMessages.push(forwardedMessage);

        // Update conversation last message
        conversation.lastMessage = forwardedMessage._id;
        conversation.lastActivity = new Date();
        await conversation.save();

        // Emit to conversation
        emitToConversation(conversationId, "new-message", {
          message: forwardedMessage,
          conversationId
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Messages forwarded successfully",
      forwardedMessages
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error forwarding message",
      error: error.message 
    });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(r => 
      r.userId.toString() === userId && r.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ 
        success: false,
        message: "You already reacted with this emoji" 
      });
    }

    // Remove any existing reaction from this user
    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId);

    // Add new reaction
    message.reactions.push({
      userId,
      emoji,
      reactedAt: new Date()
    });

    await message.save();

    // Emit reaction to conversation
    emitToConversation(message.conversationId, "message-reaction", {
      messageId,
      userId,
      emoji,
      action: "add"
    });

    res.status(200).json({
      success: true,
      message: "Reaction added successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error adding reaction",
      error: error.message 
    });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId);
    await message.save();

    // Emit reaction removal to conversation
    emitToConversation(message.conversationId, "message-reaction", {
      messageId,
      userId,
      action: "remove"
    });

    res.status(200).json({
      success: true,
      message: "Reaction removed successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error removing reaction",
      error: error.message 
    });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(message.conversationId);
    const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to pin messages in this conversation" 
      });
    }

    message.isPinned = true;
    message.pinnedBy = userId;
    message.pinnedAt = new Date();
    await message.save();

    // Emit pin event to conversation
    emitToConversation(message.conversationId, "message-pinned", {
      messageId,
      pinnedBy: userId,
      pinnedAt: message.pinnedAt
    });

    res.status(200).json({
      success: true,
      message: "Message pinned successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error pinning message",
      error: error.message 
    });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { userId } = req.user;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false,
        message: "Message not found" 
      });
    }

    message.isPinned = false;
    message.pinnedBy = null;
    message.pinnedAt = null;
    await message.save();

    // Emit unpin event to conversation
    emitToConversation(message.conversationId, "message-unpinned", {
      messageId,
      unpinnedBy: userId
    });

    res.status(200).json({
      success: true,
      message: "Message unpinned successfully"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error unpinning message",
      error: error.message 
    });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        message: "Conversation not found" 
      });
    }

    const isParticipant = conversation.participants.some(p => p.userId.toString() === userId);
    if (!isParticipant) {
      return res.status(403).json({ 
        success: false,
        message: "Not authorized to view this conversation" 
      });
    }

    const pinnedMessages = await Message.find({
      conversationId,
      isPinned: true
    })
    .sort({ pinnedAt: -1 })
    .populate('senderId', 'username fullName avatar')
    .populate('pinnedBy', 'username fullName');

    res.status(200).json({
      success: true,
      pinnedMessages
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Error fetching pinned messages",
      error: error.message 
    });
  }
};