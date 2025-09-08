const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['article', 'video', 'audio', 'pdf', 'exercise', 'worksheet', 'guide', 'tool'],
    required: true
  },
  category: {
    type: String,
    enum: ['mental-health', 'coping-strategies', 'self-help', 'crisis-support', 'relationships', 'mindfulness', 'therapy-techniques', 'educational'],
    required: true
  },
  content: {
    text: String,
    fileUrl: String,
    externalUrl: String,
    embedCode: String,
    duration: Number,
    pages: Number
  },
  author: {
    name: String,
    credentials: String,
    bio: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'pending-review', 'approved', 'rejected', 'archived'],
    default: 'pending-review'
  },
  visibility: {
    type: String,
    enum: ['public', 'users-only', 'counselors-only', 'premium'],
    default: 'public'
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  targetAudience: [{
    type: String,
    enum: ['teens', 'adults', 'seniors', 'parents', 'couples', 'professionals']
  }],
  language: {
    type: String,
    default: 'en'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: {
    type: Number,
    min: 1
  },
  metadata: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    ratings: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  relatedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number
  }],
  accessibility: {
    hasTranscript: {
      type: Boolean,
      default: false
    },
    hasClosedCaptions: {
      type: Boolean,
      default: false
    },
    hasAudioDescription: {
      type: Boolean,
      default: false
    },
    isScreenReaderFriendly: {
      type: Boolean,
      default: true
    }
  },
  licensing: {
    type: {
      type: String,
      enum: ['proprietary', 'creative-commons', 'public-domain', 'custom'],
      default: 'proprietary'
    },
    details: String,
    attribution: String
  },
  version: {
    number: {
      type: String,
      default: '1.0.0'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    changeLog: [{
      version: String,
      changes: String,
      date: Date
    }]
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publishedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

resourceSchema.index({ title: 'text', description: 'text' });
resourceSchema.index({ category: 1, type: 1 });
resourceSchema.index({ status: 1, visibility: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ 'metadata.averageRating': -1 });
resourceSchema.index({ 'metadata.views': -1 });
resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ 'seo.slug': 1 });

resourceSchema.pre('save', function(next) {
  if (this.metadata.ratings && this.metadata.ratings.length > 0) {
    const sum = this.metadata.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    this.metadata.averageRating = sum / this.metadata.ratings.length;
  }
  
  if (!this.seo.slug && this.title) {
    this.seo.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  
  next();
});

resourceSchema.methods.incrementView = function() {
  this.metadata.views += 1;
  return this.save();
};

resourceSchema.methods.incrementDownload = function() {
  this.metadata.downloads += 1;
  return this.save();
};

resourceSchema.methods.addRating = function(userId, rating, comment) {
  const existingRating = this.metadata.ratings.find(
    r => r.user.toString() === userId.toString()
  );
  
  if (existingRating) {
    existingRating.rating = rating;
    existingRating.comment = comment;
    existingRating.timestamp = new Date();
  } else {
    this.metadata.ratings.push({
      user: userId,
      rating: rating,
      comment: comment
    });
  }
  
  const sum = this.metadata.ratings.reduce((acc, curr) => acc + curr.rating, 0);
  this.metadata.averageRating = sum / this.metadata.ratings.length;
  
  return this.save();
};

resourceSchema.methods.toggleBookmark = function(userId) {
  const index = this.metadata.bookmarks.indexOf(userId);
  
  if (index > -1) {
    this.metadata.bookmarks.splice(index, 1);
  } else {
    this.metadata.bookmarks.push(userId);
  }
  
  return this.save();
};

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;