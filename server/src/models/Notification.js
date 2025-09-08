const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  type: {
    type: String,
    enum: [
      'message',
      'group_invite',
      'group_join',
      'group_leave',
      'counselor_request',
      'counselor_assignment',
      'session_scheduled',
      'session_reminder',
      'crisis_alert',
      'moderation_warning',
      'account_update',
      'system_announcement',
      'call_request',
      'call_missed',
      'resource_shared',
      'report_update'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    },
    callId: String,
    url: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  status: {
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: Date,
    archived: {
      type: Boolean,
      default: false
    },
    archivedAt: Date
  },
  delivery: {
    inApp: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: false
    },
    email: {
      type: Boolean,
      default: false
    },
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    failureReason: String
  },
  category: {
    type: String,
    enum: ['communication', 'support', 'security', 'system', 'social'],
    default: 'communication',
    index: true
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  metadata: {
    source: {
      type: String,
      default: 'system'
    },
    batchId: String,
    campaignId: String,
    tags: [String]
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, 'status.read': 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, category: 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Set default expiration to 90 days if not specified
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.status.read = true;
  this.status.readAt = new Date();
  return this.save();
};

notificationSchema.methods.archive = function() {
  this.status.archived = true;
  this.status.archivedAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.delivery.delivered = true;
  this.delivery.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markDeliveryFailed = function(reason) {
  this.delivery.delivered = false;
  this.delivery.failureReason = reason;
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    'status.read': false,
    isDeleted: false
  });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      'status.read': false,
      isDeleted: false
    },
    {
      $set: {
        'status.read': true,
        'status.readAt': new Date()
      }
    }
  );
};

notificationSchema.statics.getByCategory = function(userId, category, options = {}) {
  const query = {
    recipient: userId,
    category: category,
    isDeleted: false
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0)
    .populate('sender', 'username role')
    .exec();
};

notificationSchema.statics.createNotification = function(data) {
  const notification = new this(data);
  return notification.save();
};

notificationSchema.statics.createBulkNotifications = function(notifications) {
  return this.insertMany(notifications);
};

// Cleanup old notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Transform for JSON output
notificationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;