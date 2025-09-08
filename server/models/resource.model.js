import mongoose from "mongoose";

const resourceSchema = mongoose.Schema({
  title: {
    type: String,
    required: [true, "Resource title is required"],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, "Resource description is required"],
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ["article", "video", "audio", "pdf", "link", "tool"],
    required: true
  },
  url: {
    type: String,
    required: [true, "Resource URL is required"],
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+/.test(url);
      },
      message: "Please provide a valid URL"
    }
  },
  category: {
    type: String,
    enum: [
      "anxiety",
      "depression", 
      "stress",
      "relationships",
      "self-care",
      "therapy",
      "meditation",
      "crisis",
      "general"
    ],
    default: "general"
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  rating: {
    total: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    average: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
resourceSchema.index({ type: 1, category: 1 });
resourceSchema.index({ isPublic: 1, isActive: 1 });
resourceSchema.index({ createdBy: 1 });
resourceSchema.index({ title: 'text', description: 'text' });

// Virtual for like count
resourceSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
resourceSchema.virtual('dislikesCount').get(function() {
  return this.dislikes ? this.dislikes.length : 0;
});

export default mongoose.model("Resource", resourceSchema);