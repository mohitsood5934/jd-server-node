import express from "express";
import {
  signup,
  login,
  refreshToken,
  logout,
  //   adminMiddleware,
  //   authMiddleware,
} from "../controllers/authController.js";

const router = express.Router();

// router.post("/signup", authMiddleware, adminMiddleware, signup); // only admin can add users
router.post("/signup", signup);
router.post("/login", login);
router.get("/refresh_token", refreshToken);
router.post("/logout", logout);

export default router;
