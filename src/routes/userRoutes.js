import express from "express";
import { updateProfile, getDashboardOverview } from "../controllers/userController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.put("/profile", updateProfile);
router.get("/dashboard-overview", getDashboardOverview);

export default router;
