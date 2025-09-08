const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ["private", "group", "counseling", "support-circle"],
      required: true,
    },
    counselor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    status: {
      type: String,
      enum: ["active", "paused", "ended", "scheduled"],
      default: "active",
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    scheduledTime: Date,
    duration: Number,
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    callInfo: {
      isVoiceCall: {
        type: Boolean,
        default: false,
      },
      isVideoCall: {
        type: Boolean,
        default: false,
      },
      callStartTime: Date,
      callEndTime: Date,
      callDuration: Number,
      recordingUrl: String,
      participants: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          joinedAt: Date,
          leftAt: Date,
          audioEnabled: Boolean,
          videoEnabled: Boolean,
        },
      ],
    },
    feedback: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        isHelpful: Boolean,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    notes: {
      counselorNotes: String,
      actionItems: [String],
      followUpRequired: {
        type: Boolean,
        default: false,
      },
      followUpDate: Date,
      tags: [String],
    },
    summary: {
      generatedSummary: String,
      keyPoints: [String],
      sentiment: {
        type: String,
        enum: ["positive", "neutral", "negative", "mixed"],
      },
      topics: [String],
    },
    crisis: {
      flagged: {
        type: Boolean,
        default: false,
      },
      severity: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
      interventionRequired: Boolean,
      interventionNotes: String,
      referralMade: Boolean,
      referralDetails: String,
    },
    privacy: {
      isAnonymous: {
        type: Boolean,
        default: true,
      },
      dataRetentionDays: {
        type: Number,
        default: 30,
      },
      consentGiven: {
        type: Boolean,
        default: true,
      },
    },
    metadata: {
      platform: String,
      appVersion: String,
      deviceInfo: String,
      ipAddress: String,
      location: {
        country: String,
        region: String,
        city: String,
      },
    },
    billing: {
      isPaid: {
        type: Boolean,
        default: false,
      },
      amount: Number,
      currency: String,
      paymentMethod: String,
      transactionId: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ participants: 1 });
sessionSchema.index({ counselor: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ startTime: -1 });
sessionSchema.index({ "crisis.flagged": 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.pre("save", function (next) {
  if (!this.expiresAt && this.privacy.dataRetentionDays) {
    this.expiresAt = new Date(
      Date.now() + this.privacy.dataRetentionDays * 24 * 60 * 60 * 1000
    );
  }

  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }

  next();
});

sessionSchema.methods.endSession = function () {
  this.status = "ended";
  this.endTime = new Date();
  if (this.startTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.save();
};

sessionSchema.methods.addMessage = function (messageId) {
  this.messages.push(messageId);
  return this.save();
};

sessionSchema.methods.addParticipant = function (userId) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

sessionSchema.methods.removeParticipant = function (userId) {
  const index = this.participants.indexOf(userId);
  if (index > -1) {
    this.participants.splice(index, 1);
    return this.save();
  }
  return Promise.resolve(this);
};

sessionSchema.methods.startCall = function (type) {
  this.callInfo.isVoiceCall = type === "voice" || type === "video";
  this.callInfo.isVideoCall = type === "video";
  this.callInfo.callStartTime = new Date();
  return this.save();
};

sessionSchema.methods.endCall = function () {
  if (this.callInfo.callStartTime) {
    this.callInfo.callEndTime = new Date();
    this.callInfo.callDuration = Math.floor(
      (this.callInfo.callEndTime - this.callInfo.callStartTime) / 1000
    );
  }
  return this.save();
};

sessionSchema.methods.flagForCrisis = function (severity, notes) {
  this.crisis.flagged = true;
  this.crisis.severity = severity;
  this.crisis.interventionRequired =
    severity === "high" || severity === "critical";
  if (notes) {
    this.crisis.interventionNotes = notes;
  }
  return this.save();
};

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
