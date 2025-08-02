import express from "express";
import { getUserProfile } from "../controllers/userController";
import { authMiddleware, requireSignIn } from "../controllers/authController";
const router = express.Router();

router.get("/profile", requireSignIn, authMiddleware, getUserProfile);


export default router;