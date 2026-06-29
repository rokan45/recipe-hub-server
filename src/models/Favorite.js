import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// A user can favorite a given recipe only once
favoriteSchema.index({ userId: 1, recipeId: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
