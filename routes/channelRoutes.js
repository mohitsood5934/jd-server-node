import express from "express";
import {
  createChannel,
  fetchChannels,
  getChannelChat,
  getDashboardDetails,
  handleMessage,
  handleMessageEmail,
  replyToUser,
  updateChannelStatus,
} from "../controllers/channelController.js";
import { authMiddleware } from "../controllers/authController.js";

const router = express.Router();

router.post("/create-channel", authMiddleware, createChannel);
router.put("/update-channel", authMiddleware, updateChannelStatus);
router.post("/addChat", authMiddleware, handleMessage);
router.get("/getChat/:channelId", authMiddleware, getChannelChat);
router.get("/fetchChannels", authMiddleware, fetchChannels);
router.post("/getDashBoardDetails", authMiddleware, getDashboardDetails);
router.post("/reply-user", authMiddleware, replyToUser);
router.post("/addChatEmail", handleMessageEmail);

export default router;
