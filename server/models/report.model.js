import mongoose from "mongoose";

const reportSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ["message", "user", "content"],
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function() {
      return this.type === "user" || this.type === "message";
    }
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: function() {
      return this.type === "message";
    }
  },
  reason: {
    type: String,
    required: true,
    enum: ["harassment", "spam", "inappropriate", "abuse", "other"]
  },
  description: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ["open", "reviewed", "resolved", "dismissed"],
    default: "open"
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
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
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ target: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model("Report", reportSchema);