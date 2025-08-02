import express from "express";
import { getUserProfile } from "../controllers/userController.js"
import { authMiddleware, requireSignIn } from "../controllers/authController.js";
const router = express.Router();

router.get("/profile", requireSignIn, authMiddleware, getUserProfile);


export default router;