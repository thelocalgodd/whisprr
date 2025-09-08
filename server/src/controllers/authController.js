const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, role = 'user' } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists with this username or email'
      });
    }

    const user = new User({
      username: username || `User_${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      password,
      email,
      role,
      authMethod: 'password',
      isAnonymous: !email
    });

    await user.save();

    const tokens = generateTokens(user._id);

    user.security.sessions.push({
      token: tokens.refreshToken,
      deviceInfo: req.get('User-Agent'),
      ipAddress: req.ip,
      createdAt: new Date()
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAnonymous: user.isAnonymous
      },
      tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    const user = await User.findOne({ 
      username,
      authMethod: 'password',
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isAccountLocked) {
      return res.status(423).json({
        error: 'Account locked due to multiple failed attempts',
        lockUntil: user.security.lockUntil
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        error: 'Account banned',
        reason: user.banReason,
        expiresAt: user.banExpiresAt
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await user.resetLoginAttempts();

    const tokens = generateTokens(user._id);

    user.security.sessions.push({
      token: tokens.refreshToken,
      deviceInfo: req.get('User-Agent'),
      ipAddress: req.ip,
      createdAt: new Date()
    });

    user.status.isOnline = true;
    user.status.lastSeen = new Date();

    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAnonymous: user.isAnonymous,
        profile: user.profile
      },
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const firebaseAuth = async (req, res) => {
  try {
    if (req.firebaseUser && req.tokens) {
      res.json({
        message: 'Firebase authentication successful',
        user: {
          id: req.firebaseUser._id,
          username: req.firebaseUser.username,
          email: req.firebaseUser.email,
          role: req.firebaseUser.role,
          isAnonymous: req.firebaseUser.isAnonymous,
          profile: req.firebaseUser.profile
        },
        tokens: req.tokens
      });
    } else {
      res.status(401).json({ error: 'Firebase authentication failed' });
    }
  } catch (error) {
    console.error('Firebase auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const sessionIndex = user.security.sessions.findIndex(
      session => session.token === refreshToken
    );

    if (sessionIndex === -1) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const tokens = generateTokens(user._id);

    user.security.sessions[sessionIndex].token = tokens.refreshToken;

    await user.save();

    res.json({ tokens });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $pull: { 'security.sessions': { token: refreshToken } },
          $set: { 'status.isOnline': false, 'status.lastSeen': new Date() }
        }
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

const logoutAll = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          'security.sessions': [],
          'status.isOnline': false,
          'status.lastSeen': new Date()
        }
      }
    );

    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ 
      email, 
      authMethod: 'password',
      isActive: true 
    });

    if (!user) {
      return res.json({ 
        message: 'If email exists, password reset link has been sent' 
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    res.json({ 
      message: 'Password reset link sent to email',
      resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      'security.passwordResetToken': hashedToken,
      'security.passwordResetExpires': { $gt: Date.now() },
      authMethod: 'password',
      isActive: true
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.sessions = [];

    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.authMethod !== 'password') {
      return res.status(400).json({ error: 'Password change not available for this account type' });
    }

    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    req.user.password = newPassword;
    req.user.security.sessions = req.user.security.sessions.filter(
      session => session.token === req.body.keepCurrentSession
    );

    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -security.twoFactorSecret -security.sessions')
      .populate('privacy.blockList', 'username');

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      'profile.displayName',
      'profile.bio',
      'profile.pronouns',
      'profile.timezone',
      'profile.languages',
      'preferences.theme',
      'preferences.language',
      'preferences.fontSize',
      'notifications.email',
      'notifications.push',
      'notifications.sms',
      'privacy.showOnlineStatus',
      'privacy.allowDirectMessages'
    ];

    const updateObject = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateObject[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateObject,
      { new: true, runValidators: true }
    ).select('-password -security.twoFactorSecret -security.sessions');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
};

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username required'),
  body('password')
    .notEmpty()
    .withMessage('Password required')
];

module.exports = {
  register,
  login,
  firebaseAuth,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  registerValidation,
  loginValidation
};