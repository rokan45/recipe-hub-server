import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Report from "../models/Report.js";
import Payment from "../models/Payment.js";

// GET /api/admin/overview (admin only)
export const getAdminOverview = async (req, res) => {
  try {
    const [totalUsers, totalRecipes, totalPremium, totalReports] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Recipe.countDocuments({ status: "active" }),
      User.countDocuments({ isPremium: true }),
      Report.countDocuments({ status: "pending" }),
    ]);

    return res.status(200).json({
      totalUsers,
      totalRecipes,
      totalPremiumMembers: totalPremium,
      totalReports,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching admin overview" });
  }
};

// GET /api/admin/users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = { role: "user" };
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching users" });
  }
};

// PATCH /api/admin/users/:id/block (admin only)
export const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User blocked", user });
  } catch (error) {
    return res.status(500).json({ message: "Server error blocking user" });
  }
};

// PATCH /api/admin/users/:id/unblock (admin only)
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User unblocked", user });
  } catch (error) {
    return res.status(500).json({ message: "Server error unblocking user" });
  }
};

// GET /api/admin/recipes (admin only) - all recipes from all users, paginated
export const getAllRecipesAdmin = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [recipes, total] = await Promise.all([
      Recipe.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Recipe.countDocuments(filter),
    ]);

    return res.status(200).json({
      recipes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching recipes" });
  }
};

// DELETE /api/admin/recipes/:id (admin only)
export const deleteRecipeAdmin = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    return res.status(200).json({ message: "Recipe deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting recipe" });
  }
};

// PUT /api/admin/recipes/:id (admin only) - edit any recipe
export const editRecipeAdmin = async (req, res) => {
  try {
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
      "status",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const recipe = await Recipe.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    return res.status(200).json({ recipe });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating recipe" });
  }
};

// PATCH /api/admin/recipes/:id/feature (admin only) - toggle featured
export const toggleFeatureRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    recipe.isFeatured = !recipe.isFeatured;
    await recipe.save();

    return res.status(200).json({
      message: recipe.isFeatured ? "Recipe added to featured" : "Recipe removed from featured",
      recipe,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating featured status" });
  }
};
