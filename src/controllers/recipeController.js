import Recipe from "../models/Recipe.js";
import User from "../models/User.js";
import Favorite from "../models/Favorite.js";

const FREE_RECIPE_LIMIT = 2;

// GET /api/recipes  (public) - browse all, paginated, filterable by category
export const getAllRecipes = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 9, 1);
    const skip = (page - 1) * limit;

    const filter = { status: "active" };

    // Category filter using MongoDB $in (supports comma-separated list)
    if (req.query.category) {
      const categories = req.query.category.split(",").map((c) => c.trim()).filter(Boolean);
      if (categories.length > 0) {
        filter.category = { $in: categories };
      }
    }

    if (req.query.search) {
      filter.recipeName = { $regex: req.query.search, $options: "i" };
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Recipe.countDocuments(filter),
    ]);

    return res.status(200).json({
      recipes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getAllRecipes error:", error);
    return res.status(500).json({ message: "Server error fetching recipes" });
  }
};

// GET /api/recipes/categories (public) - distinct categories for filter UI
export const getCategories = async (req, res) => {
  try {
    const categories = await Recipe.distinct("category", { status: "active" });
    return res.status(200).json({ categories });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching categories" });
  }
};

// GET /api/recipes/featured (public)
export const getFeaturedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ isFeatured: true, status: "active" })
      .sort({ createdAt: -1 })
      .limit(8);
    return res.status(200).json({ recipes });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching featured recipes" });
  }
};

// GET /api/recipes/popular (public) - most liked
export const getPopularRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: "active" })
      .sort({ likesCount: -1 })
      .limit(8);
    return res.status(200).json({ recipes });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching popular recipes" });
  }
};

// GET /api/recipes/:id (public)
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    return res.status(200).json({ recipe });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching recipe" });
  }
};

// POST /api/recipes (protected)
export const createRecipe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isPremium) {
      const ownedCount = await Recipe.countDocuments({ authorId: user._id, status: "active" });
      if (ownedCount >= FREE_RECIPE_LIMIT) {
        return res.status(403).json({
          message: `Free accounts can add a maximum of ${FREE_RECIPE_LIMIT} recipes. Upgrade to Premium for unlimited recipes.`,
          code: "FREE_LIMIT_REACHED",
        });
      }
    }

    const {
      recipeName,
      recipeImage,
      category,
      cuisineType,
      difficultyLevel,
      preparationTime,
      ingredients,
      instructions,
      price,
    } = req.body;

    if (
      !recipeName ||
      !recipeImage ||
      !category ||
      !cuisineType ||
      !difficultyLevel ||
      !preparationTime ||
      !ingredients ||
      !instructions
    ) {
      return res.status(400).json({ message: "All recipe fields are required" });
    }

    const recipe = await Recipe.create({
      recipeName,
      recipeImage,
      category,
      cuisineType,
      difficultyLevel,
      preparationTime,
      ingredients: Array.isArray(ingredients)
        ? ingredients
        : String(ingredients).split("\n").map((i) => i.trim()).filter(Boolean),
      instructions,
      price: price || 5,
      authorId: user._id,
      authorName: user.name,
      authorEmail: user.email,
    });

    return res.status(201).json({ recipe });
  } catch (error) {
    console.error("createRecipe error:", error);
    return res.status(500).json({ message: "Server error creating recipe" });
  }
};

// GET /api/recipes/mine/list (protected)
export const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ authorId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ recipes });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching your recipes" });
  }
};

// PUT /api/recipes/:id (protected, owner only)
export const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.authorId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only edit your own recipes" });
    }

    const allowedFields = [
      "recipeName",
      "recipeImage",
      "category",
      "cuisineType",
      "difficultyLevel",
      "preparationTime",
      "ingredients",
      "instructions",
      "price",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        recipe[field] = req.body[field];
      }
    });

    await recipe.save();
    return res.status(200).json({ recipe });
  } catch (error) {
    console.error("updateRecipe error:", error);
    return res.status(500).json({ message: "Server error updating recipe" });
  }
};

// DELETE /api/recipes/:id (protected, owner only)
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    if (String(recipe.authorId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete your own recipes" });
    }

    await Recipe.findByIdAndDelete(req.params.id);
    await Favorite.deleteMany({ recipeId: req.params.id });

    return res.status(200).json({ message: "Recipe deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting recipe" });
  }
};

// POST /api/recipes/:id/like (protected)
export const toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const userId = req.user.id;
    const alreadyLiked = recipe.likedBy.some((id) => String(id) === String(userId));

    if (alreadyLiked) {
      recipe.likedBy = recipe.likedBy.filter((id) => String(id) !== String(userId));
      recipe.likesCount = Math.max(0, recipe.likesCount - 1);
    } else {
      recipe.likedBy.push(userId);
      recipe.likesCount += 1;
    }

    await recipe.save();
    return res.status(200).json({ likesCount: recipe.likesCount, liked: !alreadyLiked });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating like" });
  }
};
