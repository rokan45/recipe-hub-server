import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken, cookieOptions, JWT_COOKIE_NAME } from "../utils/jwt.js";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, image, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters and include one uppercase and one lowercase letter",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      image: image || "",
      passwordHash,
      authProvider: "credential",
      role: "user",
    });

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions());

    return res.status(201).json({
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
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error during registration" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Contact support." });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions());

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
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
};

// POST /api/auth/google-sync
// Called by the client right after Better Auth completes a Google sign-in.
// Ensures a matching row exists in our `users` collection and issues our
// custom JWT cookie so verifyToken middleware can protect dashboard routes.
export const googleSync = async (req, res) => {
  try {
    const { name, email, image } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: name || "RecipeHub User",
        email: email.toLowerCase(),
        image: image || "",
        authProvider: "google",
        role: "user",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Contact support." });
    }

    const token = generateToken({ id: user._id, email: user.email, role: user.role });
    res.cookie(JWT_COOKIE_NAME, token, cookieOptions());

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
    console.error("Google sync error:", error);
    return res.status(500).json({ message: "Server error during Google sync" });
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  res.clearCookie(JWT_COOKIE_NAME, cookieOptions());
  return res.status(200).json({ message: "Logged out successfully" });
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isPremium: user.isPremium,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching profile" });
  }
};
