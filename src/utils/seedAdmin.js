/**
 * Seeds (or updates) an admin account from environment variables.
 * Run with: npm run seed:admin
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const run = async () => {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || "admin@recipehub.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeThisPassword123";
  const name = process.env.ADMIN_NAME || "RecipeHub Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  let admin = await User.findOne({ email });

  if (admin) {
    admin.role = "admin";
    admin.passwordHash = passwordHash;
    admin.isBlocked = false;
    await admin.save();
    console.log(`Existing user promoted to admin: ${email}`);
  } else {
    admin = await User.create({
      name,
      email,
      passwordHash,
      role: "admin",
      authProvider: "credential",
    });
    console.log(`✅ Admin account created: ${email}`);
  }

  console.log("Done. You can now log in with this email/password as admin.");
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seed script failed:", err);
  process.exit(1);
});
