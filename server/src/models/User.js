const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid;
    },
    minlength: 8
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  authMethod: {
    type: String,
    enum: ['password', 'firebase'],
    required: true,
    default: 'password'
  },
  role: {
    type: String,
    enum: ['user', 'counselor', 'admin'],
    default: 'user'
  },
  counselorInfo: {
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'not_submitted'],
      default: 'not_submitted'
    },
    verificationDocuments: [{
      type: String
    }],
    specializations: [{
      type: String
    }],
    certifications: [{
      name: String,
      issuer: String,
      dateObtained: Date,
      documentUrl: String
    }],
    availabilityStatus: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalSessions: {
      type: Number,
      default: 0
    }
  },
  profile: {
    displayName: String,
    bio: String,
    avatar: String,
    pronouns: String,
    timezone: String,
    languages: [String]
  },
  privacy: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    blockList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  status: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: Date,
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    }
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: {
      type: Boolean,
      default: false
    },
    sessions: [{
      token: String,
      deviceInfo: String,
      ipAddress: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    description: String,
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium', 'professional'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  statistics: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalGroupsJoined: {
      type: Number,
      default: 0
    },
    totalSessionsAttended: {
      type: Number,
      default: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpiresAt: Date
}, {
  timestamps: true
});

userSchema.index({ 'counselorInfo.isVerified': 1, 'counselorInfo.availabilityStatus': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'status.isOnline': 1 });
userSchema.index({ role: 1 });

userSchema.virtual('isAccountLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateUsername = function() {
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `User_${randomStr}`;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.security.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.security.passwordResetExpires = Date.now() + 30 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  this.security.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex');
  return verifyToken;
};

userSchema.methods.incrementLoginAttempts = function() {
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { 'security.loginAttempts': 1 },
      $unset: { 'security.lockUntil': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000;
  
  if (this.security.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { 'security.loginAttempts': 0 },
    $unset: { 'security.lockUntil': 1 }
  });
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.security.twoFactorSecret;
  delete obj.security.passwordResetToken;
  delete obj.security.emailVerificationToken;
  delete obj.security.sessions;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;