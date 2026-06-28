import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    // recipeId is null for premium-membership payments (not tied to a single recipe)
    recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe", default: null },
    purchaseType: { type: String, enum: ["recipe", "premium"], required: true },
    transactionId: { type: String, required: true, unique: true },
    paymentStatus: { type: String, enum: ["pending", "succeeded", "failed"], default: "pending" },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
