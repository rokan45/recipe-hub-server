import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isBlocked: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    // Local credential auth support (Better Auth manages its own account/session
    // collections separately; this hash is used by our custom JWT-issuing login
    // route for credential login as required by the challenge spec).
    passwordHash: { type: String, select: false },
    authProvider: { type: String, enum: ["credential", "google"], default: "credential" },
  },
  { timestamps: true } // createdAt, updatedAt
);

userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);
export default User;
