import express from "express";
import {
  getAdminOverview,
  getAllUsers,
  blockUser,
  unblockUser,
  getAllRecipesAdmin,
  deleteRecipeAdmin,
  editRecipeAdmin,
  toggleFeatureRecipe,
} from "../controllers/adminController.js";
import { verifyToken, verifyAdmin } from "../middleware/verifyToken.js";

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get("/overview", getAdminOverview);

router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

router.get("/recipes", getAllRecipesAdmin);
router.put("/recipes/:id", editRecipeAdmin);
router.delete("/recipes/:id", deleteRecipeAdmin);
router.patch("/recipes/:id/feature", toggleFeatureRecipe);

export default router;
