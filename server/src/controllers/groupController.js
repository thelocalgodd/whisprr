const Group = require("../models/Group");
const User = require("../models/User");
const Message = require("../models/Message");
const { body, validationResult } = require("express-validator");

const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      category,
      type = "public",
      maxMembers = 100,
      requiresApproval = false,
    } = req.body;

    if (req.user.role === "user" && type === "support-circle") {
      return res.status(403).json({
        error: "Only counselors and admins can create support circles",
      });
    }

    const group = new Group({
      name,
      description,
      category,
      type,
      creator: req.user._id,
      moderators: [req.user._id],
      members: [
        {
          user: req.user._id,
          role: "admin",
          joinedAt: new Date(),
        },
      ],
      settings: {
        maxMembers,
        requiresApproval,
        isPublic: type === "public",
      },
    });

    await group.save();

    await User.updateOne(
      { _id: req.user._id },
      { $inc: { "statistics.totalGroupsJoined": 1 } }
    );

    const populatedGroup = await Group.findById(group._id)
      .populate("creator", "username profile role")
      .populate("members.user", "username profile role");

    res.status(201).json({
      message: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
};

const getGroups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      search,
      sortBy = "recent",
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,
      isArchived: false,
      "settings.isPublic": true,
    };

    if (category && category !== "all") {
      filter.category = category;
    }

    if (type && type !== "all") {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    let sortOptions = {};
    switch (sortBy) {
      case "popular":
        sortOptions = { "statistics.totalMembers": -1 };
        break;
      case "active":
        sortOptions = { "statistics.lastActivity": -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { "statistics.lastActivity": -1 };
    }

    const groups = await Group.find()
      .populate("creator", "username profile role counselorInfo.isVerified")
      .populate("moderators", "username profile role counselorInfo.isVerified")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-moderation -members");

    const total = await Group.countDocuments(filter);

    res.json({
      groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get groups error:", error);
    res.status(500).json({ error: "Failed to get groups" });
  }
};

const getGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("creator", "username profile role counselorInfo.isVerified")
      .populate("moderators", "username profile role counselorInfo.isVerified")
      .populate(
        "members.user",
        "username profile role counselorInfo.isVerified status.isOnline status.lastSeen"
      );

    if (!group || !group.isActive) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.isMember(req.user._id);
    const memberRole = group.getMemberRole(req.user._id);

    res.json({
      group,
      membership: {
        isMember,
        role: memberRole,
        canPost:
          isMember &&
          (!group.settings.postingPermissions ||
            group.settings.postingPermissions === "all" ||
            (group.settings.postingPermissions === "counselors-only" &&
              req.user.role === "counselor") ||
            (group.settings.postingPermissions === "moderators-only" &&
              ["moderator", "admin"].includes(memberRole))),
      },
    });
  } catch (error) {
    console.error("Get group error:", error);
    res.status(500).json({ error: "Failed to get group" });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group || !group.isActive) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.isMember(req.user._id)) {
      return res.status(400).json({ error: "Already a member of this group" });
    }

    if (group.isUserBanned(req.user._id)) {
      return res.status(403).json({ error: "You are banned from this group" });
    }

    if (group.members.length >= group.settings.maxMembers) {
      return res
        .status(400)
        .json({ error: "Group has reached maximum capacity" });
    }

    if (!group.settings.allowedUserTypes.users && req.user.role === "user") {
      return res
        .status(403)
        .json({ error: "This group is restricted to counselors only" });
    }

    if (
      !group.settings.allowedUserTypes.counselors &&
      req.user.role === "counselor"
    ) {
      return res
        .status(403)
        .json({ error: "This group is restricted to users only" });
    }

    if (group.settings.requiresApproval) {
      return res.status(200).json({
        message: "Join request submitted for approval",
        pending: true,
      });
    }

    await group.addMember(req.user._id);

    await User.updateOne(
      { _id: req.user._id },
      { $inc: { "statistics.totalGroupsJoined": 1 } }
    );

    res.json({ message: "Successfully joined the group" });
  } catch (error) {
    console.error("Join group error:", error);
    res.status(500).json({ error: "Failed to join group" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (!group.isMember(req.user._id)) {
      return res.status(400).json({ error: "Not a member of this group" });
    }

    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error:
          "Group creator cannot leave. Transfer ownership or delete the group.",
      });
    }

    await group.removeMember(req.user._id);

    res.json({ message: "Successfully left the group" });
  } catch (error) {
    console.error("Leave group error:", error);
    res.status(500).json({ error: "Failed to leave group" });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const updates = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const memberRole = group.getMemberRole(req.user._id);

    if (
      !["admin", "moderator"].includes(memberRole) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const allowedUpdates = [
      "name",
      "description",
      "category",
      "tags",
      "avatar",
      "coverImage",
      "settings.maxMembers",
      "settings.requiresApproval",
      "settings.allowedUserTypes",
      "settings.autoDelete",
      "settings.postingPermissions",
      "rules",
    ];

    const updateObject = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateObject[key] = updates[key];
      }
    });

    const updatedGroup = await Group.findByIdAndUpdate(groupId, updateObject, {
      new: true,
      runValidators: true,
    })
      .populate("creator", "username profile role")
      .populate("moderators", "username profile role");

    res.json({
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Update group error:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (
      group.creator.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Only group creator or admin can delete the group" });
    }

    await Group.findByIdAndUpdate(groupId, {
      isActive: false,
      deletedAt: new Date(),
    });

    await Message.updateMany(
      { group: groupId },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete group error:", error);
    res.status(500).json({ error: "Failed to delete group" });
  }
};

const manageMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { action, role, reason, duration } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const requesterRole = group.getMemberRole(req.user._id);

    if (
      !["admin", "moderator"].includes(requesterRole) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    switch (action) {
      case "promote":
        if (requesterRole !== "admin" && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Only admins can promote members" });
        }

        const memberIndex = group.members.findIndex(
          (m) => m.user.toString() === userId
        );
        if (memberIndex !== -1) {
          group.members[memberIndex].role = role;
          if (role === "moderator" && !group.moderators.includes(userId)) {
            group.moderators.push(userId);
          }
        }
        break;

      case "demote":
        if (requesterRole !== "admin" && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ error: "Only admins can demote members" });
        }

        const demoteMemberIndex = group.members.findIndex(
          (m) => m.user.toString() === userId
        );
        if (demoteMemberIndex !== -1) {
          group.members[demoteMemberIndex].role = "member";
        }

        group.moderators = group.moderators.filter(
          (m) => m.toString() !== userId
        );
        break;

      case "mute":
        const muteMemberIndex = group.members.findIndex(
          (m) => m.user.toString() === userId
        );
        if (muteMemberIndex !== -1) {
          group.members[muteMemberIndex].isMuted = true;
          if (duration) {
            group.members[muteMemberIndex].mutedUntil = new Date(
              Date.now() + duration * 60 * 1000
            );
          }
        }
        break;

      case "unmute":
        const unmuteMemberIndex = group.members.findIndex(
          (m) => m.user.toString() === userId
        );
        if (unmuteMemberIndex !== -1) {
          group.members[unmuteMemberIndex].isMuted = false;
          group.members[unmuteMemberIndex].mutedUntil = undefined;
        }
        break;

      case "kick":
        await group.removeMember(userId);
        break;

      case "ban":
        await group.banUser(userId, req.user._id, reason, duration);
        break;

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    await group.save();

    res.json({
      message: `Member ${action} successful`,
      group: await Group.findById(groupId).populate(
        "members.user",
        "username profile role"
      ),
    });
  } catch (error) {
    console.error("Manage member error:", error);
    res.status(500).json({ error: "Failed to manage member" });
  }
};

const getMyGroups = async (req, res) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      "members.user": req.user._id,
      isActive: true,
    };

    if (role) {
      filter["members.role"] = role;
    }

    const groups = await Group.find()
      .populate("creator", "username profile role")
      .populate("moderators", "username profile role")
      .sort({ "statistics.lastActivity": -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const groupsWithRole = groups.map((group) => {
      const memberInfo = group.members.find(
        (m) => m.user.toString() === req.user._id.toString()
      );
      return {
        ...group.toObject(),
        memberRole: memberInfo ? memberInfo.role : null,
        joinedAt: memberInfo ? memberInfo.joinedAt : null,
      };
    });

    const total = await Group.countDocuments(filter);

    res.json({
      groups: groupsWithRole,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my groups error:", error);
    res.status(500).json({ error: "Failed to get groups" });
  }
};

const scheduleSession = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { title, description, startTime, endTime, maxParticipants } =
      req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const memberRole = group.getMemberRole(req.user._id);

    if (
      !["admin", "moderator"].includes(memberRole) &&
      req.user.role !== "counselor"
    ) {
      return res.status(403).json({
        error: "Only moderators and counselors can schedule sessions",
      });
    }

    const session = {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      host: req.user._id,
      maxParticipants: maxParticipants || group.settings.maxMembers,
      registeredParticipants: [],
      status: "upcoming",
    };

    group.schedule.sessions.push(session);
    group.schedule.isScheduled = true;

    await group.save();

    res.json({
      message: "Session scheduled successfully",
      session: group.schedule.sessions[group.schedule.sessions.length - 1],
    });
  } catch (error) {
    console.error("Schedule session error:", error);
    res.status(500).json({ error: "Failed to schedule session" });
  }
};

const createGroupValidation = [
  body("name")
    .isLength({ min: 3, max: 100 })
    .trim()
    .withMessage("Group name must be 3-100 characters"),
  body("description")
    .isLength({ min: 10, max: 500 })
    .trim()
    .withMessage("Description must be 10-500 characters"),
  body("category")
    .isIn([
      "anxiety",
      "depression",
      "relationships",
      "trauma",
      "addiction",
      "grief",
      "self-esteem",
      "stress",
      "other",
    ])
    .withMessage("Invalid category"),
  body("type")
    .optional()
    .isIn(["public", "private", "support-circle"])
    .withMessage("Invalid group type"),
];

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  manageMember,
  getMyGroups,
  scheduleSession,
  createGroupValidation,
};
