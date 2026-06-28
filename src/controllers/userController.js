import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Favorite from "../models/Favorite.js";

// PUT /api/users/profile (protected)
export const updateProfile = async (req, res) => {
  try {
    const { name, image } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (image !== undefined) updates.image = image;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating profile" });
  }
};

// GET /api/users/dashboard-overview (protected)
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user, totalRecipes, totalFavorites, myRecipes] = await Promise.all([
      User.findById(userId),
      Recipe.countDocuments({ authorId: userId, status: "active" }),
      Favorite.countDocuments({ userId }),
      Recipe.find({ authorId: userId, status: "active" }, "likesCount"),
    ]);

    const totalLikesReceived = myRecipes.reduce((sum, r) => sum + (r.likesCount || 0), 0);

    return res.status(200).json({
      totalRecipes,
      totalFavorites,
      totalLikesReceived,
      isPremium: user?.isPremium || false,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching dashboard overview" });
  }
};
