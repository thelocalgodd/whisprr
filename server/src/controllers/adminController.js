const User = require('../models/User');
const Group = require('../models/Group');
const Message = require('../models/Message');
const Session = require('../models/Session');
const Resource = require('../models/Resource');
const { body, validationResult } = require('express-validator');

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCounselors,
      verifiedCounselors,
      totalGroups,
      totalMessages,
      totalSessions,
      activeUsersToday,
      newUsersThisWeek,
      messagesThisWeek,
      sessionsThisWeek,
      pendingVerifications,
      flaggedMessages,
      crisisAlerts,
      reportedContent
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'counselor', isActive: true }),
      User.countDocuments({ 'counselorInfo.isVerified': true, isActive: true }),
      Group.countDocuments({ isActive: true }),
      Message.countDocuments({ isDeleted: false }),
      Session.countDocuments(),
      User.countDocuments({
        'status.lastSeen': { $gte: new Date(today.setHours(0, 0, 0, 0)) },
        isActive: true
      }),
      User.countDocuments({
        createdAt: { $gte: lastWeek },
        isActive: true
      }),
      Message.countDocuments({
        createdAt: { $gte: lastWeek },
        isDeleted: false
      }),
      Session.countDocuments({
        createdAt: { $gte: lastWeek }
      }),
      User.countDocuments({
        role: 'counselor',
        'counselorInfo.verificationStatus': 'pending'
      }),
      Message.countDocuments({
        'moderation.flagged': true,
        'moderation.action': 'none'
      }),
      Message.countDocuments({
        'crisis.detected': true,
        createdAt: { $gte: lastMonth }
      }),
      Message.countDocuments({
        'reports.0': { $exists: true },
        'reports.status': 'pending'
      })
    ]);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const messageVolume = await Message.aggregate([
      {
        $match: {
          createdAt: { $gte: lastMonth },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topGroups = await Group.aggregate([
      { $match: { isActive: true } },
      { $sort: { 'statistics.totalMembers': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'creator',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          'statistics.totalMembers': 1,
          'statistics.totalMessages': 1,
          'creator.username': 1,
          createdAt: 1
        }
      }
    ]);

    res.json({
      overview: {
        totalUsers,
        totalCounselors,
        verifiedCounselors,
        totalGroups,
        totalMessages,
        totalSessions,
        activeUsersToday,
        newUsersThisWeek,
        messagesThisWeek,
        sessionsThisWeek
      },
      moderation: {
        pendingVerifications,
        flaggedMessages,
        crisisAlerts,
        reportedContent
      },
      charts: {
        userGrowth,
        messageVolume
      },
      topGroups
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
};

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'banned') {
      filter.isBanned = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'profile.displayName': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('username email role profile.displayName status counselorInfo.isVerified statistics createdAt isActive isBanned banReason')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .populate('privacy.blockList', 'username profile.displayName')
      .populate('reports.reportedBy', 'username profile.displayName');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userSessions = await Session.find({
      participants: userId
    })
      .populate('counselor', 'username profile.displayName')
      .populate('group', 'name')
      .sort({ startTime: -1 })
      .limit(10);

    const userMessages = await Message.find({
      sender: userId,
      isDeleted: false
    })
      .populate('group', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    const userGroups = await Group.find({
      'members.user': userId,
      isActive: true
    })
      .select('name type statistics.totalMembers')
      .sort({ 'statistics.lastActivity': -1 });

    res.json({
      user,
      activity: {
        recentSessions: userSessions,
        recentMessages: userMessages,
        memberGroups: userGroups
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

const banUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { reason, duration, permanent = false } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    user.isBanned = true;
    user.banReason = reason;

    if (!permanent && duration) {
      user.banExpiresAt = new Date(Date.now() + duration * 60 * 1000);
    }

    user.status.isOnline = false;
    user.security.sessions = [];

    await user.save();

    await Group.updateMany(
      { 'members.user': userId },
      { $pull: { members: { user: userId } } }
    );

    res.json({
      message: 'User banned successfully',
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt
      }
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.banExpiresAt = undefined;

    await user.save();

    res.json({
      message: 'User unbanned successfully',
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
};

const getReports = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'pending',
      type = 'all'
    } = req.query;
    const skip = (page - 1) * limit;

    let reports = [];

    if (type === 'all' || type === 'messages') {
      const messageReports = await Message.aggregate([
        { $match: { 'reports.0': { $exists: true } } },
        { $unwind: '$reports' },
        {
          $match: status === 'all' ? {} : { 'reports.status': status }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reports.reportedBy',
            foreignField: '_id',
            as: 'reporter'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $project: {
            type: { $literal: 'message' },
            messageId: '$_id',
            report: '$reports',
            reporter: { $arrayElemAt: ['$reporter', 0] },
            sender: { $arrayElemAt: ['$sender', 0] },
            content: '$content',
            createdAt: '$createdAt'
          }
        },
        { $sort: { 'report.timestamp': -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      reports = reports.concat(messageReports);
    }

    if (type === 'all' || type === 'users') {
      const userReports = await User.aggregate([
        { $match: { 'reports.0': { $exists: true } } },
        { $unwind: '$reports' },
        {
          $match: status === 'all' ? {} : { 'reports.status': status }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reports.reportedBy',
            foreignField: '_id',
            as: 'reporter'
          }
        },
        {
          $project: {
            type: { $literal: 'user' },
            userId: '$_id',
            report: '$reports',
            reporter: { $arrayElemAt: ['$reporter', 0] },
            username: '$username',
            profile: '$profile',
            role: '$role'
          }
        },
        { $sort: { 'report.createdAt': -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);

      reports = reports.concat(userReports);
    }

    reports.sort((a, b) => new Date(b.report.timestamp || b.report.createdAt) - new Date(a.report.timestamp || a.report.createdAt));

    const totalMessageReports = await Message.aggregate([
      { $match: { 'reports.0': { $exists: true } } },
      { $unwind: '$reports' },
      {
        $match: status === 'all' ? {} : { 'reports.status': status }
      },
      { $count: 'total' }
    ]);

    const totalUserReports = await User.aggregate([
      { $match: { 'reports.0': { $exists: true } } },
      { $unwind: '$reports' },
      {
        $match: status === 'all' ? {} : { 'reports.status': status }
      },
      { $count: 'total' }
    ]);

    const total = (totalMessageReports[0]?.total || 0) + (totalUserReports[0]?.total || 0);

    res.json({
      reports: reports.slice(0, parseInt(limit)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, reason, reportType } = req.body;

    let result = null;

    if (reportType === 'message') {
      const message = await Message.findOne({ 'reports._id': reportId });
      
      if (!message) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = message.reports.id(reportId);
      report.status = 'reviewed';

      if (action === 'delete') {
        message.isDeleted = true;
        message.deletedBy = req.user._id;
        message.deletedAt = new Date();
        message.moderation.action = 'deleted';
        message.moderation.moderatedBy = req.user._id;
        message.moderation.moderatedAt = new Date();
      } else if (action === 'hide') {
        message.moderation.action = 'hidden';
        message.moderation.moderatedBy = req.user._id;
        message.moderation.moderatedAt = new Date();
      } else if (action === 'warn') {
        message.moderation.action = 'warning';
        message.moderation.moderatedBy = req.user._id;
        message.moderation.moderatedAt = new Date();
      }

      await message.save();
      result = message;

    } else if (reportType === 'user') {
      const user = await User.findOne({ 'reports._id': reportId });
      
      if (!user) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = user.reports.id(reportId);
      report.status = 'reviewed';

      if (action === 'ban') {
        user.isBanned = true;
        user.banReason = reason || 'Violation of community guidelines';
      } else if (action === 'warn') {
        // Add warning to user record
      }

      await user.save();
      result = user;
    }

    res.json({
      message: 'Report reviewed successfully',
      action,
      result
    });
  } catch (error) {
    console.error('Review report error:', error);
    res.status(500).json({ error: 'Failed to review report' });
  }
};

const getSystemHealth = async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      activeConnections,
      messagesLastHour,
      sessionsActive,
      dbConnection,
      errorCount
    ] = await Promise.all([
      User.countDocuments({ 'status.isOnline': true }),
      Message.countDocuments({
        createdAt: { $gte: oneHourAgo },
        isDeleted: false
      }),
      Session.countDocuments({ status: 'active' }),
      checkDatabaseConnection(),
      getRecentErrorCount()
    ]);

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.json({
      status: 'healthy',
      timestamp: now,
      metrics: {
        activeConnections,
        messagesLastHour,
        sessionsActive,
        database: {
          connected: dbConnection,
          responseTime: await getDatabaseResponseTime()
        },
        server: {
          uptime: process.uptime(),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
          },
          cpu: cpuUsage
        },
        errors: {
          count: errorCount,
          lastHour: errorCount
        }
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
};

const checkDatabaseConnection = async () => {
  try {
    await User.findOne({}).limit(1);
    return true;
  } catch (error) {
    return false;
  }
};

const getDatabaseResponseTime = async () => {
  const start = Date.now();
  try {
    await User.findOne({}).limit(1);
    return Date.now() - start;
  } catch (error) {
    return -1;
  }
};

const getRecentErrorCount = async () => {
  return 0;
};

const getCrisisAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, severity, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = { 'crisis.detected': true };

    if (severity && severity !== 'all') {
      filter['crisis.severity'] = severity;
    }

    const crisisMessages = await Message.find(filter)
      .populate('sender', 'username profile role')
      .populate('recipient', 'username profile role')
      .populate('group', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments(filter);

    res.json({
      alerts: crisisMessages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get crisis alerts error:', error);
    res.status(500).json({ error: 'Failed to get crisis alerts' });
  }
};

const updateCrisisAlert = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { actionTaken, notes } = req.body;

    const message = await Message.findById(messageId);

    if (!message || !message.crisis.detected) {
      return res.status(404).json({ error: 'Crisis alert not found' });
    }

    message.crisis.actionTaken = actionTaken;
    message.crisis.reviewedBy = req.user._id;

    if (notes) {
      message.crisis.notes = notes;
    }

    await message.save();

    res.json({
      message: 'Crisis alert updated successfully',
      alert: message.crisis
    });
  } catch (error) {
    console.error('Update crisis alert error:', error);
    res.status(500).json({ error: 'Failed to update crisis alert' });
  }
};

const banValidation = [
  body('reason')
    .isLength({ min: 10, max: 500 })
    .withMessage('Ban reason must be 10-500 characters'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be positive number (minutes)'),
  body('permanent')
    .optional()
    .isBoolean()
    .withMessage('Permanent must be boolean')
];

module.exports = {
  getDashboardStats,
  getUsers,
  getUserDetails,
  banUser,
  unbanUser,
  getReports,
  reviewReport,
  getSystemHealth,
  getCrisisAlerts,
  updateCrisisAlert,
  banValidation
};