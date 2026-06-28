import express from "express";
import {
  addFavorite,
  removeFavorite,
  getMyFavorites,
  checkFavorite,
} from "../controllers/favoriteController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.use(verifyToken);

router.get("/mine", getMyFavorites);
router.get("/check/:recipeId", checkFavorite);
router.post("/:recipeId", addFavorite);
router.delete("/:recipeId", removeFavorite);

export default router;
