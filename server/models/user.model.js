import mongoose from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    validate: {
      validator: function(username) {
        return /^[a-zA-Z0-9_]+$/.test(username);
      },
      message: "Username can only contain letters, numbers, and underscores"
    }
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: 100
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    trim: true,
    maxlength: 100
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  contacts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: 50
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  notificationSettings: {
    messages: {
      type: Boolean,
      default: true
    },
    friendRequests: {
      type: Boolean,
      default: true
    },
    conversationInvites: {
      type: Boolean,
      default: true
    },
    mentions: {
      type: Boolean,
      default: true
    },
    calls: {
      type: Boolean,
      default: true
    },
    system: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    sound: {
      type: Boolean,
      default: true
    },
    doNotDisturb: {
      type: Boolean,
      default: false
    },
    quietHours: {
      enabled: {
        type: Boolean,
        default: false
      },
      start: {
        type: String,
        default: "22:00"
      },
      end: {
        type: String,
        default: "08:00"
      }
    }
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'everyone'
    },
    lastSeenVisibility: {
      type: String,
      enum: ['everyone', 'contacts', 'nobody'],
      default: 'everyone'
    },
    readReceipts: {
      type: Boolean,
      default: true
    },
    allowInvites: {
      type: Boolean,
      default: true
    }
  },
  role: {
    type: String,
    enum: ["user", "counselor", "admin", "moderator"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: {
      type: String,
      default: null
    },
    backupCodes: [{
      type: String
    }]
  },
  sessions: [{
    token: String,
    device: String,
    ip: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  lastLogout: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.verificationToken;
      delete ret.passwordResetToken;
      delete ret.twoFactorAuth.secret;
      delete ret.sessions;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better performance (username and email already indexed by unique: true)
userSchema.index({ fullName: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ 'contacts.userId': 1 });

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.fullName || this.username;
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  // Hash password
  this.password = await bcrypt.hash(this.password, 12);
  
  // Update updatedAt timestamp
  this.updatedAt = new Date();
  
  next();
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is blocked
userSchema.methods.isBlocked = function(userId) {
  return this.blockedUsers.some(id => id.toString() === userId.toString());
};

// Method to add contact
userSchema.methods.addContact = function(userId, nickname = null) {
  const existingContact = this.contacts.find(c => c.userId.toString() === userId.toString());
  if (existingContact) {
    throw new Error('User is already a contact');
  }
  
  this.contacts.push({
    userId,
    nickname,
    addedAt: new Date()
  });
};

// Method to remove contact
userSchema.methods.removeContact = function(userId) {
  this.contacts = this.contacts.filter(c => c.userId.toString() !== userId.toString());
};

// Method to block user
userSchema.methods.blockUser = function(userId) {
  if (!this.isBlocked(userId)) {
    this.blockedUsers.push(userId);
  }
};

// Method to unblock user
userSchema.methods.unblockUser = function(userId) {
  this.blockedUsers = this.blockedUsers.filter(id => id.toString() !== userId.toString());
};

// Method to update online status
userSchema.methods.updateOnlineStatus = function(isOnline = true) {
  this.isOnline = isOnline;
  this.lastSeen = new Date();
  if (isOnline) {
    this.lastLogin = new Date();
  } else {
    this.lastLogout = new Date();
  }
};

// Method to add session
userSchema.methods.addSession = function(token, device, ip, userAgent) {
  this.sessions.push({
    token,
    device,
    ip,
    userAgent,
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true
  });

  // Keep only last 10 sessions
  if (this.sessions.length > 10) {
    this.sessions = this.sessions.slice(-10);
  }
};

// Method to remove session
userSchema.methods.removeSession = function(token) {
  this.sessions = this.sessions.filter(s => s.token !== token);
};

// Method to deactivate all sessions
userSchema.methods.deactivateAllSessions = function() {
  this.sessions.forEach(session => {
    session.isActive = false;
  });
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Static method to search users
userSchema.statics.searchUsers = function(query, excludeUserId = null, limit = 10) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery = {
    $or: [
      { username: searchRegex },
      { fullName: searchRegex },
      { email: searchRegex }
    ],
    isActive: true,
    isDeleted: false
  };

  if (excludeUserId) {
    searchQuery._id = { $ne: excludeUserId };
  }

  return this.find(searchQuery)
    .select('username fullName avatar bio isOnline lastSeen')
    .limit(limit)
    .sort({ username: 1 });
};

export default mongoose.model("User", userSchema);
