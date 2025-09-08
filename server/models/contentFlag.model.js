import mongoose from "mongoose";

const contentFlagSchema = mongoose.Schema({
  contentType: {
    type: String,
    enum: ["message", "profile", "image"],
    required: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: function() {
      return this.contentType === "message";
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ["harassment", "hate-speech", "violence", "sexual", "spam", "self-harm", "other"],
    required: true
  },
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "medium"
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  detectionMethod: {
    type: String,
    enum: ["AI", "user-report", "manual"],
    default: "AI"
  },
  status: {
    type: String,
    enum: ["open", "reviewed", "actioned", "dismissed"],
    default: "open"
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: {
    type: Date
  },
  action: {
    type: String,
    enum: ["none", "warning", "delete", "suspend", "ban"]
  },
  actionNotes: {
    type: String,
    maxlength: 1000
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
contentFlagSchema.index({ status: 1, category: 1 });
contentFlagSchema.index({ userId: 1 });
contentFlagSchema.index({ createdAt: -1 });
contentFlagSchema.index({ severity: 1 });

export default mongoose.model("ContentFlag", contentFlagSchema);