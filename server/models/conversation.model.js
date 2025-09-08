import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  conversationType: {
    type: String,
    enum: ['private', 'group'],
    required: true,
    default: 'private'
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String,
    default: null
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    mutedUntil: {
      type: Date,
      default: null
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date,
      default: null
    },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    customNickname: {
      type: String,
      trim: true,
      maxlength: 50
    }
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowInvites: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    autoDeleteMessages: {
      enabled: {
        type: Boolean,
        default: false
      },
      duration: {
        type: Number, // in hours
        default: 24
      }
    },
    encryption: {
      enabled: {
        type: Boolean,
        default: false
      },
      keyId: {
        type: String,
        default: null
      }
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
conversationSchema.index({ 'participants.userId': 1 });
conversationSchema.index({ lastActivity: -1 });
conversationSchema.index({ conversationType: 1 });
conversationSchema.index({ createdAt: -1 });

// Virtual for active participants
conversationSchema.virtual('activeParticipants').get(function() {
  return this.participants.filter(p => !p.leftAt);
});

// Virtual for participant count
conversationSchema.virtual('participantCount').get(function() {
  return this.activeParticipants.length;
});

// Pre-save middleware to update timestamps
conversationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Method to check if user is participant
conversationSchema.methods.hasParticipant = function(userId) {
  return this.participants.some(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );
};

// Method to get participant role
conversationSchema.methods.getParticipantRole = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );
  return participant ? participant.role : null;
};

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role = 'member') {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(p => 
    p.userId.toString() === userId.toString()
  );

  if (existingParticipant && !existingParticipant.leftAt) {
    throw new Error('User is already a participant');
  }

  if (existingParticipant && existingParticipant.leftAt) {
    // User rejoining
    existingParticipant.leftAt = null;
    existingParticipant.joinedAt = new Date();
    existingParticipant.role = role;
  } else {
    // New participant
    this.participants.push({
      userId,
      role,
      joinedAt: new Date()
    });
  }

  this.lastActivity = new Date();
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => 
    p.userId.toString() === userId.toString() && !p.leftAt
  );

  if (!participant) {
    throw new Error('User is not a participant');
  }

  participant.leftAt = new Date();
  this.lastActivity = new Date();
};

// Method to check if conversation can be deleted by user
conversationSchema.methods.canDeleteBy = function(userId) {
  return this.createdBy.toString() === userId.toString();
};

// Static method to find user's conversations
conversationSchema.statics.findByUser = function(userId, options = {}) {
  const {
    type = null,
    archived = false,
    limit = 20,
    page = 1,
    includeDeleted = false
  } = options;

  let query = {
    'participants.userId': userId,
    'participants.leftAt': { $exists: false }
  };

  if (!includeDeleted) {
    query.isDeleted = false;
  }

  if (type) {
    query.conversationType = type;
  }

  // Handle archived filter
  if (archived) {
    query['participants.isArchived'] = true;
  } else {
    query.$or = [
      { 'participants.isArchived': false },
      { 'participants.isArchived': { $exists: false } }
    ];
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('participants.userId', 'username fullName avatar isOnline lastSeen')
    .populate('lastMessage', 'content messageType timestamp senderId')
    .populate('createdBy', 'username fullName')
    .sort({ lastActivity: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to create private conversation
conversationSchema.statics.createPrivateConversation = async function(user1Id, user2Id) {
  // Check if conversation already exists
  const existingConversation = await this.findOne({
    conversationType: 'private',
    'participants.userId': { $all: [user1Id, user2Id] },
    'participants.2': { $exists: false }, // Ensure only 2 participants
    isDeleted: false
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create new private conversation
  const conversation = new this({
    conversationType: 'private',
    participants: [
      { userId: user1Id, role: 'member' },
      { userId: user2Id, role: 'member' }
    ],
    createdBy: user1Id
  });

  return conversation.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;