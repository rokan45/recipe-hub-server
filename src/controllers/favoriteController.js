import Favorite from "../models/Favorite.js";
import Recipe from "../models/Recipe.js";
import User from "../models/User.js";

// POST /api/favorites/:recipeId (protected)
export const addFavorite = async (req, res) => {
  try {
    const { recipeId } = req.params;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const user = await User.findById(req.user.id);

    const existing = await Favorite.findOne({ userId: req.user.id, recipeId });
    if (existing) {
      return res.status(409).json({ message: "Recipe already in favorites" });
    }

    const favorite = await Favorite.create({
      userId: req.user.id,
      userEmail: user.email,
      recipeId,
    });

    return res.status(201).json({ favorite });
  } catch (error) {
    console.error("addFavorite error:", error);
    return res.status(500).json({ message: "Server error adding favorite" });
  }
};

// DELETE /api/favorites/:recipeId (protected)
export const removeFavorite = async (req, res) => {
  try {
    const { recipeId } = req.params;
    await Favorite.findOneAndDelete({ userId: req.user.id, recipeId });
    return res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    return res.status(500).json({ message: "Server error removing favorite" });
  }
};

// GET /api/favorites/mine (protected)
export const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id }).sort({ addedAt: -1 });
    const recipeIds = favorites.map((f) => f.recipeId);
    const recipes = await Recipe.find({ _id: { $in: recipeIds } });

    // preserve favorite ordering and attach addedAt
    const recipeMap = new Map(recipes.map((r) => [String(r._id), r]));
    const result = favorites
      .map((f) => {
        const r = recipeMap.get(String(f.recipeId));
        if (!r) return null;
        return { ...r.toObject(), addedAt: f.addedAt, favoriteId: f._id };
      })
      .filter(Boolean);

    return res.status(200).json({ favorites: result });
  } catch (error) {
    console.error("getMyFavorites error:", error);
    return res.status(500).json({ message: "Server error fetching favorites" });
  }
};

// GET /api/favorites/check/:recipeId (protected)
export const checkFavorite = async (req, res) => {
  try {
    const existing = await Favorite.findOne({
      userId: req.user.id,
      recipeId: req.params.recipeId,
    });
    return res.status(200).json({ isFavorite: !!existing });
  } catch (error) {
    return res.status(500).json({ message: "Server error checking favorite" });
  }
};
