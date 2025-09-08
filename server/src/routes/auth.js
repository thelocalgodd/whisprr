const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/authController');

const { 
  authenticate, 
  authenticateFirebase,
  checkAccountLock 
} = require('../middleware/auth');

const { rateLimiters } = require('../middleware/security');

router.post('/register', rateLimiters.auth, registerValidation, register);

router.post('/login', rateLimiters.auth, checkAccountLock, loginValidation, login);

router.post('/firebase', rateLimiters.auth, authenticateFirebase, firebaseAuth);

router.post('/refresh-token', rateLimiters.general, refreshToken);

router.post('/logout', authenticate, logout);

router.post('/logout-all', authenticate, logoutAll);

router.post('/forgot-password', rateLimiters.auth, forgotPassword);

router.post('/reset-password', rateLimiters.auth, resetPassword);

router.post('/change-password', authenticate, changePassword);

router.get('/profile', authenticate, getProfile);

router.put('/profile', authenticate, updateProfile);

module.exports = router;