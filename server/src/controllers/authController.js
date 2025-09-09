const User = require("../models/User");
const { generateTokens, verifyRefreshToken } = require("../middleware/auth");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const register = async (req, res) => {
  try {
    const { username, password, fullName, role = "user" } = req.body;

    const existingUser = await User.findOne({
      username: username,
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User already exists with this username",
      });
    }

    const user = new User({
      username:
        username ||
        `User_${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      password,
      fullName: fullName || username,
      role,
      authMethod: "password",
      isAnonymous: true,
    });

    await user.save();

    const tokens = generateTokens(user._id);

    user.security.sessions.push({
      token: tokens.refreshToken,
      deviceInfo: req.get("User-Agent"),
      ipAddress: req.ip,
      createdAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.username,
          role: user.role,
          isAnonymous: user.isAnonymous,
        },
        token: tokens.accessToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username: username,
      authMethod: "password",
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.isAccountLocked) {
      return res.status(423).json({
        error: "Account locked due to multiple failed attempts",
        lockUntil: user.security.lockUntil,
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        error: "Account banned",
        reason: user.banReason,
        expiresAt: user.banExpiresAt,
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await user.resetLoginAttempts();

    const tokens = generateTokens(user._id);

    user.security.sessions.push({
      token: tokens.refreshToken,
      deviceInfo: req.get("User-Agent"),
      ipAddress: req.ip,
      createdAt: new Date(),
    });

    user.status.isOnline = true;
    user.status.lastSeen = new Date();

    await user.save();

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.username,
          role: user.role,
          isAnonymous: user.isAnonymous,
          profile: user.profile,
        },
        token: tokens.accessToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    const sessionIndex = user.security.sessions.findIndex(
      (session) => session.token === refreshToken
    );

    if (sessionIndex === -1) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const tokens = generateTokens(user._id);

    user.security.sessions[sessionIndex].token = tokens.refreshToken;

    await user.save();

    res.json({ tokens });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Token refresh failed" });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken && req.user) {
      await User.updateOne(
        { _id: req.user._id },
        {
          $pull: { "security.sessions": { token: refreshToken } },
          $set: { "status.isOnline": false, "status.lastSeen": new Date() },
        }
      );
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

const logoutAll = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          "security.sessions": [],
          "status.isOnline": false,
          "status.lastSeen": new Date(),
        },
      }
    );

    res.json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email,
      authMethod: "password",
      isActive: true,
    });

    if (!user) {
      return res.json({
        message: "If email exists, password reset link has been sent",
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    res.json({
      message: "Password reset link sent to email",
      resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      "security.passwordResetToken": hashedToken,
      "security.passwordResetExpires": { $gt: Date.now() },
      authMethod: "password",
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    user.password = password;
    user.security.passwordResetToken = undefined;
    user.security.passwordResetExpires = undefined;
    user.security.sessions = [];

    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Password reset failed" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (req.user.authMethod !== "password") {
      return res
        .status(400)
        .json({ error: "Password change not available for this account type" });
    }

    const isCurrentPasswordValid =
      await req.user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    req.user.password = newPassword;
    req.user.security.sessions = req.user.security.sessions.filter(
      (session) => session.token === req.body.keepCurrentSession
    );

    await req.user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Password change failed" });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -security.twoFactorSecret -security.sessions")
      .populate("privacy.blockList", "username");

    res.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = [
      "profile.displayName",
      "profile.bio",
      "profile.pronouns",
      "profile.timezone",
      "profile.languages",
      "preferences.theme",
      "preferences.language",
      "preferences.fontSize",
      "notifications.email",
      "notifications.push",
      "notifications.sms",
      "privacy.showOnlineStatus",
      "privacy.allowDirectMessages",
    ];

    const updateObject = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updateObject[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updateObject, {
      new: true,
      runValidators: true,
    }).select("-password -security.twoFactorSecret -security.sessions");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Profile update failed" });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
};
