import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
  {
    recipeName: { type: String, required: true, trim: true },
    recipeImage: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    cuisineType: { type: String, required: true, trim: true },
    difficultyLevel: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    preparationTime: { type: Number, required: true }, // in minutes
    ingredients: { type: [String], required: true },
    instructions: { type: String, required: true },
    price: { type: Number, default: 5 }, // price in dollars for Stripe purchase
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    authorEmail: { type: String, required: true },
    likesCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "removed"], default: "active" },
  },
  { timestamps: true }
);

recipeSchema.index({ category: 1 });
recipeSchema.index({ likesCount: -1 });
recipeSchema.index({ isFeatured: 1 });
recipeSchema.index({ authorId: 1 });

const Recipe = mongoose.model("Recipe", recipeSchema);
export default Recipe;
