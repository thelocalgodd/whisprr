const express = require("express");
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
  loginValidation,
} = require("../controllers/authController");

const {
  authenticate,
  authenticateFirebase,
  checkAccountLock,
} = require("../middleware/auth");

const { rateLimiters } = require("../middleware/security");

router.post("/register", register);

router.post("/login", login);

router.post("/firebase", firebaseAuth);

router.post("/refresh-token", refreshToken);

router.post("/logout", authenticate, logout);

router.post("/logout-all", authenticate, logoutAll);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.post("/change-password", changePassword);

router.get("/profile", getProfile);

router.put("/profile", updateProfile);

module.exports = router;
