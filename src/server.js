import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";

import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const startServer = async () => {
  // Connect to MongoDB BEFORE building Better Auth, since auth.js
  // pulls the live Mongoose connection's underlying MongoClient.
  await connectDB();

  // Import auth + routes only after DB is connected
  const { auth } = await import("./lib/auth.js");
  const authRoutes = (await import("./routes/authRoutes.js")).default;
  const recipeRoutes = (await import("./routes/recipeRoutes.js")).default;
  const favoriteRoutes = (await import("./routes/favoriteRoutes.js")).default;
  const reportRoutes = (await import("./routes/reportRoutes.js")).default;
  const paymentRoutes = (await import("./routes/paymentRoutes.js")).default;
  const adminRoutes = (await import("./routes/adminRoutes.js")).default;
  const userRoutes = (await import("./routes/userRoutes.js")).default;

  const app = express();

  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );

  // Better Auth's own handler (Google OAuth + its session management).
  // MUST be mounted before express.json() per Better Auth's Express guide.
  app.all("/api/auth/*", toNodeHandler(auth));

  // JSON + cookie parsing for all routes below this line
  app.use(express.json());
  app.use(cookieParser());

  app.get("/", (req, res) => {
    res.send("RecipeHub API is running 🍳");
  });

  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/recipes", recipeRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/users", userRoutes);

  // 404 handler for unknown API routes
  app.use("/api", (req, res) => {
    res.status(404).json({ message: "API route not found" });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
  });

  app.listen(PORT, () => {
    console.log(`🚀 RecipeHub server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
