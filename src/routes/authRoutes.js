import express from "express";
import { register, login, logout, getMe, googleSync } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google-sync", googleSync);
router.post("/logout", logout);
router.get("/me", verifyToken, getMe);

export default router;
