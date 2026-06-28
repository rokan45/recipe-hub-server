import express from "express";
import {
  getAllRecipes,
  getCategories,
  getFeaturedRecipes,
  getPopularRecipes,
  getRecipeById,
  createRecipe,
  getMyRecipes,
  updateRecipe,
  deleteRecipe,
  toggleLike,
} from "../controllers/recipeController.js";
import { verifyToken, verifyNotBlocked } from "../middleware/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/", getAllRecipes);
router.get("/categories", getCategories);
router.get("/featured", getFeaturedRecipes);
router.get("/popular", getPopularRecipes);

// Protected routes (must come before /:id to avoid being captured by it)
router.get("/mine/list", verifyToken, getMyRecipes);
router.post("/", verifyToken, verifyNotBlocked, createRecipe);

router.get("/:id", getRecipeById);
router.put("/:id", verifyToken, updateRecipe);
router.delete("/:id", verifyToken, deleteRecipe);
router.post("/:id/like", verifyToken, toggleLike);

export default router;
