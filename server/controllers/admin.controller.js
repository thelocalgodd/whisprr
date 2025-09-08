import User from "../models/user.model.js";
import Report from "../models/report.model.js";
import ContentFlag from "../models/contentFlag.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import Group from "../models/group.model.js";

// Dashboard Analytics
export const getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Active Users
    const activeUsers = await User.countDocuments({ 
      isActive: true, 
      isDeleted: false 
    });

    // Daily Active Users (last 7 days)
    const dailyActiveUsers = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await User.countDocuments({
        lastSeen: { $gte: startOfDay, $lte: endOfDay },
        isActive: true
      });
      
      dailyActiveUsers.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        users: count
      });
    }

    // Messages count (last 24 hours)
    const last24Hours = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    const messagesLast24h = await Message.countDocuments({
      createdAt: { $gte: last24Hours }
    });

    // Daily messages (last 7 days)
    const dailyMessages = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Message.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      dailyMessages.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        count
      });
    }

    // Reports count
    const openReports = await Report.countDocuments({ status: "open" });
    
    // Daily reports (last 7 days)
    const dailyReports = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Report.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });
      
      dailyReports.push({
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        count
      });
    }

    // User types distribution
    const regularUsers = await User.countDocuments({ role: "user", isActive: true });
    const counselors = await User.countDocuments({ role: "counselor", isActive: true });
    const pendingCounselors = await User.countDocuments({ 
      role: "user", 
      isVerified: false,
      // Add logic for pending counselor applications
    });

    const userTypes = [
      { name: "Regular Users", value: regularUsers, color: "#0ea5e9" },
      { name: "Counselors", value: counselors, color: "#10b981" },
      { name: "Pending", value: pendingCounselors, color: "#f59e0b" }
    ];

    // New signups (last 7 days)
    const newSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Content flags
    const pendingFlags = await ContentFlag.countDocuments({ status: "open" });

    res.json({
      success: true,
      data: {
        metrics: {
          activeUsers,
          messagesLast24h,
          newSignups,
          openReports
        },
        charts: {
          dailyActiveUsers,
          dailyMessages,
          dailyReports,
          userTypes
        },
        moderation: {
          openReports,
          pendingFlags,
          totalFlags: await ContentFlag.countDocuments()
        }
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
};

// User Management
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isDeleted: false };
    
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username fullName email role isActive isVerified createdAt lastSeen')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasMore: skip + users.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -sessions -twoFactorAuth.secret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's message count
    const messageCount = await Message.countDocuments({ sender: userId });
    
    // Get user's report count (as reporter and target)
    const reportsAsReporter = await Report.countDocuments({ reporter: userId });
    const reportsAsTarget = await Report.countDocuments({ target: userId });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          messageCount,
          reportsAsReporter,
          reportsAsTarget
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, role } = req.body;

    const updateData = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (role && ['user', 'counselor', 'moderator', 'admin'].includes(role)) {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -sessions');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Reports Management
export const getReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, priority } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const reports = await Report.find(query)
      .populate('reporter', 'username fullName')
      .populate('target', 'username fullName')
      .populate('reviewedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasMore: skip + reports.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    
    const report = await Report.findById(reportId)
      .populate('reporter', 'username fullName avatar')
      .populate('target', 'username fullName avatar')
      .populate('reviewedBy', 'username fullName')
      .populate('messageId');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Get conversation context if it's a message report
    let context = [];
    if (report.messageId) {
      const messages = await Message.find({
        conversation: report.messageId.conversation
      })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
      
      context = messages.reverse();
    }

    res.json({
      success: true,
      data: {
        report,
        context
      }
    });
  } catch (error) {
    console.error('Get report by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, reviewNotes } = req.body;
    const reviewerId = req.user.userId;

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        reviewNotes,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('reporter', 'username fullName')
     .populate('target', 'username fullName')
     .populate('reviewedBy', 'username fullName');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report,
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report',
      error: error.message
    });
  }
};

// Content Flags Management
export const getContentFlags = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, status, severity } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const flags = await ContentFlag.find(query)
      .populate('userId', 'username fullName')
      .populate('reviewedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ContentFlag.countDocuments(query);

    res.json({
      success: true,
      data: {
        flags,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalFlags: total,
          hasMore: skip + flags.length < total
        }
      }
    });
  } catch (error) {
    console.error('Get content flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content flags',
      error: error.message
    });
  }
};

export const getContentFlagById = async (req, res) => {
  try {
    const { flagId } = req.params;
    
    const flag = await ContentFlag.findById(flagId)
      .populate('userId', 'username fullName avatar createdAt')
      .populate('reviewedBy', 'username fullName')
      .populate('messageId');

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Content flag not found'
      });
    }

    // Get user history
    const userFlags = await ContentFlag.countDocuments({ 
      userId: flag.userId._id,
      status: { $in: ['reviewed', 'actioned'] }
    });

    const userMessages = await Message.countDocuments({ 
      sender: flag.userId._id 
    });

    const userHistory = {
      accountAge: Math.floor((Date.now() - flag.userId.createdAt) / (1000 * 60 * 60 * 24 * 30)), // months
      messagesSent: userMessages,
      previousFlags: userFlags,
      warnings: 0, // You may want to track this separately
      suspensions: 0 // You may want to track this separately
    };

    // Get similar flags
    const similarFlags = await ContentFlag.countDocuments({
      category: flag.category,
      status: 'open',
      _id: { $ne: flagId }
    });

    res.json({
      success: true,
      data: {
        flag,
        userHistory,
        similarFlags
      }
    });
  } catch (error) {
    console.error('Get content flag by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content flag',
      error: error.message
    });
  }
};

export const updateContentFlag = async (req, res) => {
  try {
    const { flagId } = req.params;
    const { status, action, actionNotes } = req.body;
    const reviewerId = req.user.userId;

    const flag = await ContentFlag.findByIdAndUpdate(
      flagId,
      {
        status,
        action,
        actionNotes,
        reviewedBy: reviewerId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'username fullName')
     .populate('reviewedBy', 'username fullName');

    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'Content flag not found'
      });
    }

    // If action is taken, you might want to implement the actual action
    // (e.g., delete message, suspend user, etc.)

    res.json({
      success: true,
      data: flag,
      message: 'Content flag updated successfully'
    });
  } catch (error) {
    console.error('Update content flag error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content flag',
      error: error.message
    });
  }
};