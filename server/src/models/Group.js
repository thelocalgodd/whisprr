const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['anxiety', 'depression', 'relationships', 'trauma', 'addiction', 'grief', 'self-esteem', 'stress', 'other'],
    required: true
  },
  type: {
    type: String,
    enum: ['public', 'private', 'support-circle'],
    default: 'public'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    isMuted: {
      type: Boolean,
      default: false
    },
    mutedUntil: Date
  }],
  settings: {
    maxMembers: {
      type: Number,
      default: 100,
      max: 500
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    allowedUserTypes: {
      users: {
        type: Boolean,
        default: true
      },
      counselors: {
        type: Boolean,
        default: true
      }
    },
    autoDelete: {
      enabled: {
        type: Boolean,
        default: false
      },
      afterDays: {
        type: Number,
        default: 30
      }
    },
    postingPermissions: {
      type: String,
      enum: ['all', 'counselors-only', 'moderators-only'],
      default: 'all'
    }
  },
  rules: [{
    rule: String,
    order: Number
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    sessions: [{
      title: String,
      description: String,
      startTime: Date,
      endTime: Date,
      host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      maxParticipants: Number,
      registeredParticipants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
      }
    }]
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalMembers: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    },
    lastActivity: Date
  },
  moderation: {
    reports: [{
      reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    bannedUsers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      bannedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: Date
    }],
    warnings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  avatar: String,
  coverImage: String,
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  deletedAt: Date
}, {
  timestamps: true
});

groupSchema.index({ name: 'text', description: 'text' });
groupSchema.index({ category: 1 });
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ creator: 1 });
groupSchema.index({ isActive: 1, isArchived: 1 });
groupSchema.index({ tags: 1 });

groupSchema.methods.addMember = async function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  
  if (existingMember) {
    return false;
  }
  
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Group has reached maximum capacity');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date()
  });
  
  this.statistics.totalMembers = this.members.length;
  await this.save();
  return true;
};

groupSchema.methods.removeMember = async function(userId) {
  const memberIndex = this.members.findIndex(m => m.user.toString() === userId.toString());
  
  if (memberIndex === -1) {
    return false;
  }
  
  this.members.splice(memberIndex, 1);
  this.statistics.totalMembers = this.members.length;
  await this.save();
  return true;
};

groupSchema.methods.isMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

groupSchema.methods.getMemberRole = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

groupSchema.methods.banUser = async function(userId, bannedBy, reason, duration) {
  await this.removeMember(userId);
  
  const banEntry = {
    user: userId,
    bannedBy: bannedBy,
    reason: reason,
    bannedAt: new Date()
  };
  
  if (duration) {
    banEntry.expiresAt = new Date(Date.now() + duration);
  }
  
  this.moderation.bannedUsers.push(banEntry);
  await this.save();
  return true;
};

groupSchema.methods.isUserBanned = function(userId) {
  const ban = this.moderation.bannedUsers.find(b => b.user.toString() === userId.toString());
  
  if (!ban) return false;
  
  if (ban.expiresAt && ban.expiresAt < new Date()) {
    return false;
  }
  
  return true;
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;