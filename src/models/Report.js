import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", required: true },
    reporterEmail: { type: String, required: true },
    reason: {
      type: String,
      enum: ["Spam", "Offensive Content", "Copyright Issue"],
      required: true,
    },
    details: { type: String, default: "" },
    status: { type: String, enum: ["pending", "removed", "dismissed"], default: "pending" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

reportSchema.index({ status: 1 });
reportSchema.index({ recipeId: 1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
