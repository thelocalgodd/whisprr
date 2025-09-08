const Session = require("../models/Session");
const User = require("../models/User");
const Group = require("../models/Group");
const { body, validationResult } = require("express-validator");

const initiateCall = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, groupId, callType = "voice" } = req.body;
    const callerId = req.user._id;

    if (!recipientId && !groupId) {
      return res
        .status(400)
        .json({ error: "Recipient or group required for call" });
    }

    if (recipientId && groupId) {
      return res
        .status(400)
        .json({ error: "Cannot call both recipient and group simultaneously" });
    }

    let participants = [callerId];
    let sessionType = "private";

    if (recipientId) {
      const recipient = await User.findById(recipientId);
      if (!recipient || !recipient.isActive) {
        return res.status(404).json({ error: "Recipient not found" });
      }

      if (recipient.privacy.blockList.includes(callerId)) {
        return res.status(403).json({ error: "You are blocked by this user" });
      }

      if (req.user.privacy.blockList.includes(recipientId)) {
        return res.status(403).json({ error: "You have blocked this user" });
      }

      participants.push(recipientId);
      sessionType =
        recipient.role === "counselor" || req.user.role === "counselor"
          ? "counseling"
          : "private";
    } else {
      const group = await Group.findById(groupId);
      if (!group || !group.isActive) {
        return res.status(404).json({ error: "Group not found" });
      }

      if (!group.isMember(callerId)) {
        return res
          .status(403)
          .json({ error: "You are not a member of this group" });
      }

      if (group.isUserBanned(callerId)) {
        return res
          .status(403)
          .json({ error: "You are banned from this group" });
      }

      sessionType =
        group.type === "support-circle" ? "support-circle" : "group";
    }

    const session = new Session({
      participants,
      type: sessionType,
      counselor:
        req.user.role === "counselor"
          ? callerId
          : recipientId &&
            (await User.findById(recipientId)).role === "counselor"
          ? recipientId
          : undefined,
      group: groupId || undefined,
      status: "active",
      startTime: new Date(),
      callInfo: {
        isVoiceCall: callType === "voice" || callType === "video",
        isVideoCall: callType === "video",
        callStartTime: new Date(),
        participants: [
          {
            user: callerId,
            joinedAt: new Date(),
            audioEnabled: true,
            videoEnabled: callType === "video",
          },
        ],
      },
    });

    await session.save();

    res.status(201).json({
      message: "Call initiated successfully",
      callId: session._id,
      session: {
        id: session._id,
        type: session.type,
        callType,
        participants: session.participants,
        startTime: session.startTime,
        callInfo: session.callInfo,
      },
    });
  } catch (error) {
    console.error("Initiate call error:", error);
    res.status(500).json({ error: "Failed to initiate call" });
  }
};

const joinCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(callId)
      .populate("participants", "username profile role")
      .populate("group", "name type members");

    if (!session) {
      return res.status(404).json({ error: "Call not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Call is not active" });
    }

    if (!session.participants.includes(userId) && !session.group) {
      return res
        .status(403)
        .json({ error: "You are not invited to this call" });
    }

    if (
      session.group &&
      !session.group.members.some(
        (m) => m.user.toString() === userId.toString()
      )
    ) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    const existingParticipant = session.callInfo.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    if (!existingParticipant) {
      session.callInfo.participants.push({
        user: userId,
        joinedAt: new Date(),
        audioEnabled: true,
        videoEnabled: false,
      });
    } else {
      existingParticipant.joinedAt = new Date();
      existingParticipant.leftAt = undefined;
    }

    await session.save();

    res.json({
      message: "Joined call successfully",
      session: {
        id: session._id,
        type: session.type,
        participants: session.participants,
        callInfo: session.callInfo,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });
  } catch (error) {
    console.error("Join call error:", error);
    res.status(500).json({ error: "Failed to join call" });
  }
};

const leaveCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(callId);

    if (!session) {
      return res.status(404).json({ error: "Call not found" });
    }

    const participantIndex = session.callInfo.participants.findIndex(
      (p) => p.user.toString() === userId.toString()
    );

    if (participantIndex !== -1) {
      session.callInfo.participants[participantIndex].leftAt = new Date();
    }

    const activeParticipants = session.callInfo.participants.filter(
      (p) => !p.leftAt || p.leftAt < p.joinedAt
    );

    if (activeParticipants.length === 0) {
      session.status = "ended";
      session.endTime = new Date();
      await session.endCall();
    }

    await session.save();

    res.json({
      message: "Left call successfully",
      callEnded: activeParticipants.length === 0,
    });
  } catch (error) {
    console.error("Leave call error:", error);
    res.status(500).json({ error: "Failed to leave call" });
  }
};

const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(callId);

    if (!session) {
      return res.status(404).json({ error: "Call not found" });
    }

    if (!session.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You are not a participant in this call" });
    }

    const isHost = session.participants[0].toString() === userId.toString();
    const isCounselor = session.counselor?.toString() === userId.toString();

    if (!isHost && !isCounselor && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only the host, counselor, or admin can end the call" });
    }

    await session.endSession();
    await session.endCall();

    res.json({
      message: "Call ended successfully",
      session: {
        id: session._id,
        duration: session.duration,
        callDuration: session.callInfo.callDuration,
        endTime: session.endTime,
      },
    });
  } catch (error) {
    console.error("End call error:", error);
    res.status(500).json({ error: "Failed to end call" });
  }
};

const updateCallSettings = async (req, res) => {
  try {
    const { callId } = req.params;
    const { audioEnabled, videoEnabled } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(callId);

    if (!session) {
      return res.status(404).json({ error: "Call not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Call is not active" });
    }

    const participantIndex = session.callInfo.participants.findIndex(
      (p) => p.user.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res
        .status(403)
        .json({ error: "You are not a participant in this call" });
    }

    if (typeof audioEnabled === "boolean") {
      session.callInfo.participants[participantIndex].audioEnabled =
        audioEnabled;
    }

    if (typeof videoEnabled === "boolean") {
      session.callInfo.participants[participantIndex].videoEnabled =
        videoEnabled;
    }

    await session.save();

    res.json({
      message: "Call settings updated successfully",
      participant: session.callInfo.participants[participantIndex],
    });
  } catch (error) {
    console.error("Update call settings error:", error);
    res.status(500).json({ error: "Failed to update call settings" });
  }
};

const getCallHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const filter = {
      participants: userId,
      $or: [{ "callInfo.isVoiceCall": true }, { "callInfo.isVideoCall": true }],
    };

    if (type && ["voice", "video"].includes(type)) {
      if (type === "voice") {
        filter["callInfo.isVoiceCall"] = true;
        filter["callInfo.isVideoCall"] = false;
      } else {
        filter["callInfo.isVideoCall"] = true;
      }
    }

    const calls = await Session.find(filter)
      .populate(
        "participants",
        "username profile role counselorInfo.isVerified"
      )
      .populate("counselor", "username profile role counselorInfo.isVerified")
      .populate("group", "name type")
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select(
        "participants counselor group type status startTime endTime duration callInfo.callDuration callInfo.isVoiceCall callInfo.isVideoCall feedback"
      );

    const total = await Session.countDocuments(filter);

    res.json({
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get call history error:", error);
    res.status(500).json({ error: "Failed to get call history" });
  }
};

const getActiveCall = async (req, res) => {
  try {
    const userId = req.user._id;

    const activeCall = await Session.findOne({
      participants: userId,
      status: "active",
      $or: [{ "callInfo.isVoiceCall": true }, { "callInfo.isVideoCall": true }],
    })
      .populate(
        "participants",
        "username profile role counselorInfo.isVerified"
      )
      .populate("counselor", "username profile role counselorInfo.isVerified")
      .populate("group", "name type");

    if (!activeCall) {
      return res.json({ activeCall: null });
    }

    res.json({
      activeCall: {
        id: activeCall._id,
        type: activeCall.type,
        participants: activeCall.participants,
        counselor: activeCall.counselor,
        group: activeCall.group,
        startTime: activeCall.startTime,
        callInfo: activeCall.callInfo,
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });
  } catch (error) {
    console.error("Get active call error:", error);
    res.status(500).json({ error: "Failed to get active call" });
  }
};

const submitCallFeedback = async (req, res) => {
  try {
    const { callId } = req.params;
    const { rating, comment, isHelpful } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(callId);

    if (!session) {
      return res.status(404).json({ error: "Call not found" });
    }

    if (!session.participants.includes(userId)) {
      return res
        .status(403)
        .json({ error: "You did not participate in this call" });
    }

    const existingFeedback = session.feedback.find(
      (f) => f.user.toString() === userId.toString()
    );

    if (existingFeedback) {
      existingFeedback.rating = rating;
      existingFeedback.comment = comment;
      existingFeedback.isHelpful = isHelpful;
      existingFeedback.timestamp = new Date();
    } else {
      session.feedback.push({
        user: userId,
        rating,
        comment,
        isHelpful,
        timestamp: new Date(),
      });
    }

    await session.save();

    if (session.counselor && rating) {
      const counselor = await User.findById(session.counselor);
      if (counselor) {
        const totalRatings = await Session.countDocuments({
          counselor: session.counselor,
          "feedback.rating": { $exists: true },
        });

        const ratingSum = await Session.aggregate([
          { $match: { counselor: session.counselor } },
          { $unwind: "$feedback" },
          { $match: { "feedback.rating": { $exists: true } } },
          { $group: { _id: null, total: { $sum: "$feedback.rating" } } },
        ]);

        if (ratingSum.length > 0) {
          const newRating = ratingSum[0].total / totalRatings;
          counselor.counselorInfo.rating = Math.round(newRating * 10) / 10;
          await counselor.save();
        }
      }
    }

    res.json({
      message: "Feedback submitted successfully",
      feedback: session.feedback.find(
        (f) => f.user.toString() === userId.toString()
      ),
    });
  } catch (error) {
    console.error("Submit call feedback error:", error);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
};

const getCounselorStats = async (req, res) => {
  try {
    if (req.user.role !== "counselor") {
      return res.status(403).json({ error: "Counselor access required" });
    }

    const counselorId = req.user._id;

    const stats = await Session.aggregate([
      { $match: { counselor: counselorId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
          totalCallDuration: { $sum: "$callInfo.callDuration" },
          averageRating: { $avg: "$feedback.rating" },
          totalFeedback: { $sum: { $size: "$feedback" } },
        },
      },
    ]);

    const recentSessions = await Session.find({ counselor: counselorId })
      .populate("participants", "username profile")
      .sort({ startTime: -1 })
      .limit(10)
      .select(
        "participants type startTime duration callInfo.callDuration feedback"
      );

    res.json({
      stats: stats[0] || {
        totalSessions: 0,
        totalDuration: 0,
        totalCallDuration: 0,
        averageRating: 0,
        totalFeedback: 0,
      },
      recentSessions,
    });
  } catch (error) {
    console.error("Get counselor stats error:", error);
    res.status(500).json({ error: "Failed to get counselor stats" });
  }
};

const callValidation = [
  body("callType")
    .optional()
    .isIn(["voice", "video"])
    .withMessage("Invalid call type"),
  body("recipientId")
    .optional()
    .isMongoId()
    .withMessage("Invalid recipient ID"),
  body("groupId").optional().isMongoId().withMessage("Invalid group ID"),
];

const feedbackValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("comment")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Comment too long (max 500 characters)"),
  body("isHelpful")
    .optional()
    .isBoolean()
    .withMessage("isHelpful must be boolean"),
];

module.exports = {
  initiateCall,
  joinCall,
  leaveCall,
  endCall,
  updateCallSettings,
  getCallHistory,
  getActiveCall,
  submitCallFeedback,
  getCounselorStats,
  callValidation,
  feedbackValidation,
};
