import express from "express";
import * as groupController from "../controllers/group.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/create", auth, groupController.createGroup);
router.post("/:groupId/join", auth, groupController.joinGroup);
router.post("/:groupId/message", auth, groupController.sendGroupMessage);
router.get("/:groupId/messages", auth, groupController.getGroupMessages);

export default router;
