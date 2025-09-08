import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'file', 'system', 'call'],
      default: 'text'
    },
    media: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
      thumbnail: String,
      duration: Number, // for audio/video
      width: Number,    // for images/videos
      height: Number    // for images/videos
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    mentions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      username: String,
      startIndex: Number,
      endIndex: Number
    }],
    reactions: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      emoji: String,
      reactedAt: {
        type: Date,
        default: Date.now
      }
    }],
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    isPinned: {
      type: Boolean,
      default: false
    },
    pinnedAt: {
      type: Date,
      default: null
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    isForwarded: {
      type: Boolean,
      default: false
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    // System message data
    systemData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Call message data
    callData: {
      type: {
        type: String,
        enum: ['voice', 'video']
      },
      duration: Number,
      status: {
        type: String,
        enum: ['missed', 'answered', 'declined', 'ended']
      }
    },
    // Encryption data
    encryptedContent: {
      type: String,
      default: null
    },
    encryptionKeyId: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
messageSchema.index({ conversationId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ content: 'text' }); // Text search
messageSchema.index({ messageType: 1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ isPinned: 1, conversationId: 1 });

// Virtual for unread status
messageSchema.virtual('isUnread').get(function() {
  return this.readBy.length === 0;
});

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.userId.toString() === userId.toString());
};

// Method to mark as read by user
messageSchema.methods.markAsReadBy = function(userId) {
  if (!this.isReadBy(userId)) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    reactedAt: new Date()
  });
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.userId.toString() !== userId.toString());
};

// Method to check if user can edit message
messageSchema.methods.canEditBy = function(userId) {
  const timeLimit = 15 * 60 * 1000; // 15 minutes
  const messageAge = Date.now() - this.timestamp.getTime();
  return this.senderId.toString() === userId.toString() && 
         messageAge <= timeLimit && 
         !this.isDeleted;
};

// Method to check if user can delete message
messageSchema.methods.canDeleteBy = function(userId) {
  return this.senderId.toString() === userId.toString() && !this.isDeleted;
};

// Pre-save middleware
messageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  next();
});

// Static method to get conversation messages with pagination
messageSchema.statics.getConversationMessages = function(conversationId, options = {}) {
  const { 
    page = 1, 
    limit = 50, 
    before = null,
    after = null,
    userId = null
  } = options;

  let query = { 
    conversationId,
    isDeleted: false
  };

  // Exclude messages deleted for specific user
  if (userId) {
    query.deletedFor = { $ne: userId };
  }

  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }

  if (after) {
    query.timestamp = { $gt: new Date(after) };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'username fullName avatar')
    .populate('replyTo', 'content senderId messageType')
    .populate('reactions.userId', 'username fullName')
    .populate('readBy.userId', 'username fullName');
};

// Static method to search messages
messageSchema.statics.searchMessages = function(query, options = {}) {
  const {
    conversationId = null,
    userId = null,
    limit = 20,
    page = 1
  } = options;

  let searchQuery = {
    content: new RegExp(query, 'i'),
    isDeleted: false,
    messageType: 'text'
  };

  if (conversationId) {
    searchQuery.conversationId = conversationId;
  }

  if (userId) {
    searchQuery.deletedFor = { $ne: userId };
  }

  const skip = (page - 1) * limit;

  return this.find(searchQuery)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'username fullName avatar')
    .populate('conversationId', 'name conversationType');
};

export default mongoose.model("Message", messageSchema);
