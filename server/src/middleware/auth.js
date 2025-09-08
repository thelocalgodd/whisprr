const jwt = require('jsonwebtoken');
const { admin } = require('../config/firebase');
const User = require('../models/User');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
  
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
  
  return { accessToken, refreshToken };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const user = await User.findById(decoded.userId).select('-password -security.twoFactorSecret');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    if (user.isBanned) {
      return res.status(403).json({ 
        error: 'Account banned',
        reason: user.banReason,
        expiresAt: user.banExpiresAt
      });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const authenticateFirebase = async (req, res, next) => {
  try {
    const firebaseToken = req.header('Firebase-Token');
    
    if (!firebaseToken) {
      return next();
    }
    
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      const username = `User_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      user = await User.create({
        username,
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        authMethod: 'firebase',
        isAnonymous: !decodedToken.email,
        profile: {
          displayName: decodedToken.name || username
        },
        security: {
          emailVerified: decodedToken.email_verified || false
        }
      });
    }
    
    const tokens = generateTokens(user._id);
    req.firebaseUser = user;
    req.tokens = tokens;
    next();
  } catch (error) {
    console.error('Firebase authentication error:', error);
    next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

const verifyCounselor = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'counselor' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Counselor access required' });
  }
  
  if (req.user.role === 'counselor' && !req.user.counselorInfo.isVerified) {
    return res.status(403).json({ error: 'Counselor verification required' });
  }
  
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }
    
    const decoded = verifyToken(token);
    
    if (decoded) {
      const user = await User.findById(decoded.userId).select('-password -security.twoFactorSecret');
      if (user && user.isActive && !user.isBanned) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

const checkAccountLock = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  if (req.user.isAccountLocked) {
    return res.status(423).json({ 
      error: 'Account temporarily locked due to multiple failed login attempts',
      lockUntil: req.user.security.lockUntil
    });
  }
  
  next();
};

module.exports = {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  authenticate,
  authenticateFirebase,
  authorize,
  verifyCounselor,
  optionalAuth,
  checkAccountLock
};