const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    sparse: true
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video', 'system'],
    default: 'text'
  },
  content: {
    text: String,
    encryptedText: String,
    mediaUrl: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    thumbnailUrl: String,
    duration: Number
  },
  encryption: {
    isEncrypted: {
      type: Boolean,
      default: true
    },
    algorithm: {
      type: String,
      default: 'AES'
    }
  },
  status: {
    sent: {
      type: Boolean,
      default: true
    },
    delivered: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    deliveredAt: Date,
    readAt: Date
  },
  metadata: {
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    forwarded: {
      type: Boolean,
      default: false
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    editHistory: [{
      content: String,
      editedAt: Date
    }]
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
    }
  }],
  moderation: {
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String,
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    action: {
      type: String,
      enum: ['none', 'warning', 'deleted', 'hidden'],
      default: 'none'
    }
  },
  crisis: {
    detected: {
      type: Boolean,
      default: false
    },
    keywords: [String],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    actionTaken: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: Date,
  expiresAt: Date,
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'audio', 'video', 'other']
    },
    url: String,
    name: String,
    size: Number,
    mimeType: String
  }]
}, {
  timestamps: true
});

messageSchema.index({ createdAt: -1 });
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ 'status.read': 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

messageSchema.pre('save', function(next) {
  if (this.content.text && this.encryption.isEncrypted && !this.content.encryptedText) {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!';
    this.content.encryptedText = CryptoJS.AES.encrypt(
      this.content.text,
      encryptionKey
    ).toString();
    this.content.text = undefined;
  }
  
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

messageSchema.methods.decrypt = function() {
  if (this.content.encryptedText && this.encryption.isEncrypted) {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars!!';
    const bytes = CryptoJS.AES.decrypt(this.content.encryptedText, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
  return this.content.text || '';
};

messageSchema.methods.markAsRead = function() {
  this.status.read = true;
  this.status.readAt = new Date();
  return this.save();
};

messageSchema.methods.markAsDelivered = function() {
  this.status.delivered = true;
  this.status.deliveredAt = new Date();
  return this.save();
};

messageSchema.methods.checkForCrisisKeywords = function(keywords) {
  const text = this.decrypt().toLowerCase();
  const detectedKeywords = [];
  
  keywords.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      detectedKeywords.push(keyword);
    }
  });
  
  if (detectedKeywords.length > 0) {
    this.crisis.detected = true;
    this.crisis.keywords = detectedKeywords;
    
    if (detectedKeywords.length >= 3) {
      this.crisis.severity = 'critical';
    } else if (detectedKeywords.length >= 2) {
      this.crisis.severity = 'high';
    } else {
      this.crisis.severity = 'medium';
    }
  }
  
  return detectedKeywords;
};

messageSchema.methods.toJSON = function() {
  const obj = this.toObject();
  if (obj.content.encryptedText) {
    obj.content.text = this.decrypt();
    delete obj.content.encryptedText;
  }
  delete obj.__v;
  return obj;
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;