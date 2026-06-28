import express from "express";
import {
  createReport,
  getAllReports,
  removeReportedRecipe,
  dismissReport,
} from "../controllers/reportController.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/:recipeId", verifyToken, createReport);

router.get("/", verifyToken, verifyAdmin, getAllReports);
router.patch("/:id/remove-recipe", verifyToken, verifyAdmin, removeReportedRecipe);
router.patch("/:id/dismiss", verifyToken, verifyAdmin, dismissReport);

export default router;
