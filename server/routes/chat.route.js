import express from "express";
import * as chatController from "../controllers/chat.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/send/:recipientId", auth, chatController.sendMessage);
router.get("/:recipientId", auth, chatController.getMessages);

export default router;
