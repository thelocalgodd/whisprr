import express from "express";
import * as authController from "../controllers/auth.controller.js";
import auth from "../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/profile", auth, authController.getProfile);
router.put("/profile", auth, authController.updateProfile);
router.put("/change-password", auth, authController.changePassword);

export default router;
